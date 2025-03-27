import * as vscode from 'vscode';
import { SnippetManager } from './snippetManager';

export class SnippetContentProvider implements vscode.TextDocumentContentProvider {
  public static scheme = 'devsnippet';
  
  constructor(private snippetManager: SnippetManager) {}
  
  provideTextDocumentContent(uri: vscode.Uri): string {
    // Extract snippet ID from the URI
    const snippetId = uri.path.substring(1); // Remove leading slash
    const snippet = this.snippetManager.getSnippet(snippetId);
    
    if (!snippet) {
      return 'Snippet not found';
    }
    
    // Format snippet details
    return `# ${snippet.title}
${snippet.description ? `\n${snippet.description}\n` : ''}
${'Tags: ' + (snippet.tags.length ? snippet.tags.join(', ') : 'No tags')}
${'Language: ' + snippet.language}
${'Created: ' + new Date(snippet.created_at).toLocaleString()}
${'Updated: ' + new Date(snippet.updated_at).toLocaleString()}

\`\`\`${snippet.language}
${snippet.code}
\`\`\`
`;
  }
}