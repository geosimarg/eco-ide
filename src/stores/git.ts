import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useWorkspaceStore } from './workspace';
import { logger } from '@/utils/logger';

export interface GitChange {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked' | 'renamed' | 'copied';
  staged: boolean;
}

export interface GitBranch {
  name: string;
  current: boolean;
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export const useGitStore = defineStore('git', () => {
  const isGitRepo = ref(false);
  const branch = ref<string>('main');
  const changes = ref<GitChange[]>([]);
  const stagedChanges = ref<GitChange[]>([]);
  const commits = ref<GitCommit[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function runGitCommand(args: string[]): Promise<string> {
    const { Command } = await import('@tauri-apps/plugin-shell');
    const workspaceStore = useWorkspaceStore();
    
    if (!workspaceStore.workspacePath) {
      throw new Error('No workspace open');
    }

    const command = Command.create('git', args, {
      cwd: workspaceStore.workspacePath,
    });

    const output = await command.execute();
    
    if (output.code !== 0) {
      throw new Error(output.stderr || 'Git command failed');
    }

    return output.stdout;
  }

  async function checkIsRepo() {
    const workspaceStore = useWorkspaceStore();
    if (!workspaceStore.workspacePath) {
      isGitRepo.value = false;
      return;
    }

    try {
      await runGitCommand(['rev-parse', '--git-dir']);
      isGitRepo.value = true;
    } catch {
      isGitRepo.value = false;
    }
  }

  async function fetchBranch() {
    try {
      const output = await runGitCommand(['branch', '--show-current']);
      branch.value = output.trim() || 'main';
    } catch (e) {
      logger.error('Failed to get branch:', e);
      branch.value = 'main';
    }
  }

  async function fetchStatus() {
    try {
      const output = await runGitCommand(['status', '--porcelain=v1']);
      const lines = output.trim().split('\n').filter(Boolean);
      
      const unstaged: GitChange[] = [];
      const staged: GitChange[] = [];

      for (const line of lines) {
        if (line.length < 3) continue;
        
        const indexStatus = line[0];
        const worktreeStatus = line[1];
        const filePath = line.substring(3);

        let status: GitChange['status'] = 'modified';
        let stagedFlag = false;

        if (indexStatus !== ' ' && indexStatus !== '?') {
          stagedFlag = true;
          status = mapStatus(indexStatus);
        } else if (worktreeStatus !== ' ' && worktreeStatus !== '?') {
          status = mapStatus(worktreeStatus);
        } else if (indexStatus === '?') {
          status = 'untracked';
        }

        const change: GitChange = { path: filePath, status, staged: stagedFlag };
        
        if (stagedFlag) {
          staged.push(change);
        } else {
          unstaged.push(change);
        }
      }

      changes.value = unstaged;
      stagedChanges.value = staged;
    } catch (e) {
      logger.error('Failed to get status:', e);
      changes.value = [];
      stagedChanges.value = [];
    }
  }

  function mapStatus(char: string): GitChange['status'] {
    switch (char) {
      case 'M': return 'modified';
      case 'A': return 'added';
      case 'D': return 'deleted';
      case 'R': return 'renamed';
      case 'C': return 'copied';
      default: return 'modified';
    }
  }

  async function fetchRecentCommits(count: number = 10) {
    try {
      const output = await runGitCommand([
        'log',
        `--max-count=${count}`,
        '--pretty=format:%H|%s|%an|%ad',
        '--date=short'
      ]);
      
      const lines = output.trim().split('\n').filter(Boolean);
      commits.value = lines.map(line => {
        const [hash, message, author, date] = line.split('|');
        return { hash: hash.substring(0, 7), message, author, date };
      });
    } catch (e) {
      logger.error('Failed to get commits:', e);
      commits.value = [];
    }
  }

  async function stageFile(filePath: string) {
    try {
      await runGitCommand(['add', filePath]);
      await fetchStatus();
    } catch (e) {
      logger.error('Failed to stage file:', e);
      error.value = 'Failed to stage file';
    }
  }

  async function unstageFile(filePath: string) {
    try {
      await runGitCommand(['reset', 'HEAD', filePath]);
      await fetchStatus();
    } catch (e) {
      logger.error('Failed to unstage file:', e);
      error.value = 'Failed to unstage file';
    }
  }

  async function stageAll() {
    try {
      await runGitCommand(['add', '-A']);
      await fetchStatus();
    } catch (e) {
      logger.error('Failed to stage all:', e);
      error.value = 'Failed to stage all files';
    }
  }

  async function commit(message: string) {
    if (!message.trim()) {
      error.value = 'Commit message required';
      return;
    }

    try {
      await runGitCommand(['commit', '-m', message]);
      await fetchStatus();
      await fetchRecentCommits();
      error.value = null;
    } catch (e) {
      logger.error('Failed to commit:', e);
      error.value = 'Failed to create commit';
    }
  }

  async function checkoutBranch(branchName: string) {
    try {
      await runGitCommand(['checkout', branchName]);
      await fetchBranch();
      await fetchStatus();
    } catch (e) {
      logger.error('Failed to checkout branch:', e);
      error.value = 'Failed to checkout branch';
    }
  }

  async function createBranch(branchName: string) {
    try {
      await runGitCommand(['checkout', '-b', branchName]);
      await fetchBranch();
      await fetchStatus();
    } catch (e) {
      logger.error('Failed to create branch:', e);
      error.value = 'Failed to create branch';
    }
  }

  async function fetchBranches(): Promise<GitBranch[]> {
    try {
      const output = await runGitCommand(['branch', '--format=%(refname:short)|%(HEAD)']);
      const lines = output.trim().split('\n').filter(Boolean);
      
      return lines.map(line => {
        const [name, current] = line.split('|');
        return { name, current: current === '*' };
      });
    } catch (e) {
      logger.error('Failed to get branches:', e);
      return [];
    }
  }

  async function refresh() {
    if (!isGitRepo.value) {
      await checkIsRepo();
    }
    
    if (isGitRepo.value) {
      await Promise.all([
        fetchBranch(),
        fetchStatus(),
        fetchRecentCommits()
      ]);
    }
  }

  return {
    isGitRepo,
    branch,
    changes,
    stagedChanges,
    commits,
    isLoading,
    error,
    checkIsRepo,
    fetchBranch,
    fetchStatus,
    fetchRecentCommits,
    stageFile,
    unstageFile,
    stageAll,
    commit,
    checkoutBranch,
    createBranch,
    fetchBranches,
    refresh,
  };
});