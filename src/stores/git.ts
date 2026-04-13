import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useWorkspaceStore } from './workspace';
import { logger } from '@/utils/logger';
import { GitChange } from '@/interfaces/git_change';
import { GitBranch } from '@/interfaces/git_branch';
import { GitCommit } from '@/interfaces/git_commit';

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

  async function runGitCommandWithStdin(args: string[], stdinData: string): Promise<string> {
    const { invoke } = await import('@tauri-apps/api/core');
    const workspaceStore = useWorkspaceStore();

    if (!workspaceStore.workspacePath) {
      throw new Error('No workspace open');
    }

    return invoke<string>('run_git_command_with_stdin', {
      args,
      cwd: workspaceStore.workspacePath,
      stdinData,
    });
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
    logger.info('[fetchStatus] Buscando status git');
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

        // Untracked file
        if (indexStatus === '?' && worktreeStatus === '?') {
          unstaged.push({ path: filePath, status: 'untracked', staged: false });
          continue;
        }

        // Has staged changes
        if (indexStatus !== ' ' && indexStatus !== '?') {
          staged.push({ path: filePath, status: mapStatus(indexStatus), staged: true });
        }

        // Has unstaged changes (also covers partially-staged: both slots non-space)
        if (worktreeStatus !== ' ' && worktreeStatus !== '?') {
          unstaged.push({ path: filePath, status: mapStatus(worktreeStatus), staged: false });
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

  async function unstageAll() {
    try {
      await runGitCommand(['reset', 'HEAD']);
      await fetchStatus();
    } catch (e) {
      logger.error('Failed to unstage all:', e);
      error.value = 'Failed to unstage all files';
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

  async function stageHunk(_filePath: string, patchContent: string) {
    try {
      await runGitCommandWithStdin(['apply', '--cached', '--unidiff-zero'], patchContent);
      await fetchStatus();
    } catch (e) {
      logger.error('Failed to stage hunk:', e);
      error.value = 'Failed to stage hunk';
    }
  }

  async function discardHunk(_filePath: string, patchContent: string) {
    try {
      await runGitCommandWithStdin(['apply', '-R', '--unidiff-zero'], patchContent);
      await fetchStatus();
    } catch (e) {
      logger.error('Failed to discard hunk:', e);
      error.value = 'Failed to discard hunk';
    }
  }

  async function unstageHunk(_filePath: string, patchContent: string) {
    try {
      await runGitCommandWithStdin(['apply', '-R', '--cached', '--unidiff-zero'], patchContent);
      await fetchStatus();
    } catch (e) {
      logger.error('Failed to unstage hunk:', e);
      error.value = 'Failed to unstage hunk';
    }
  }

  async function getStagedContent(filePath: string): Promise<string> {
    try {
      return await runGitCommand(['show', `:${filePath}`]);
    } catch {
      return '';
    }
  }

  async function getHeadContent(filePath: string): Promise<string> {
    try {
      return await runGitCommand(['show', `HEAD:${filePath}`]);
    } catch {
      return '';
    }
  }

  async function discardChanges(filePath: string) {
    try {
      await runGitCommand(['restore', filePath]);
      await fetchStatus();
    } catch (e) {
      logger.error('Failed to discard changes:', e);
      error.value = 'Failed to discard changes';
    }
  }

  async function deleteFile(filePath: string) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const workspaceStore = useWorkspaceStore();
      const fullPath = `${workspaceStore.workspacePath}/${filePath}`;
      await invoke('delete_path', { path: fullPath });
      await fetchStatus();
    } catch (e) {
      logger.error('Failed to delete file:', e);
      error.value = 'Failed to delete file';
    }
  }

  async function discardAllChanges() {
    try {
      await runGitCommand(['checkout', '--', '.']);
      await fetchStatus();
    } catch (e) {
      logger.error('Failed to discard all changes:', e);
      error.value = 'Failed to discard all changes';
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
    unstageAll,
    stageAll,
    stageHunk,
    discardHunk,
    unstageHunk,
    getStagedContent,
    getHeadContent,
    discardChanges,
    deleteFile,
    discardAllChanges,
    commit,
    checkoutBranch,
    createBranch,
    fetchBranches,
    refresh,
  };
});