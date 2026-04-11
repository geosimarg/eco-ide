import { languageServerExtensions } from '@codemirror/lsp-client';

export interface LSPConfig {
  host: string;
  port: number;
  language: string;
}

export async function createLSPClient(config: LSPConfig) {
  console.log('LSP client configured for:', config.language);
  return null;
}

export function getLSPExtensions() {
  return languageServerExtensions();
}

export function destroyLSPClient() {
}