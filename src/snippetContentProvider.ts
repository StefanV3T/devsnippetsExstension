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
    
    // Format creation and update dates
    const createdDate = new Date(snippet.created_at).toLocaleString();
    const updatedDate = new Date(snippet.updated_at).toLocaleString();
    
    // Create tags with badges
    const tagsHtml = snippet.tags && snippet.tags.length 
      ? snippet.tags.map(tag => `<span class="badge">${tag}</span>`).join(' ')
      : '<span class="no-tags">No tags</span>';
    
    // The HTML content with better styling
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: var(--vscode-editor-font-family);
      padding: 0 16px;
      line-height: 1.5;
    }
    h1 {
      color: var(--vscode-titleBar-activeBackground);
      border-bottom: 1px solid var(--vscode-panel-border);
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .description {
      color: var(--vscode-foreground);
      margin-bottom: 20px;
      font-style: italic;
    }
    .metadata {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 20px;
      font-size: 0.9em;
      color: var(--vscode-descriptionForeground);
    }
    .metadata-item {
      display: flex;
      align-items: center;
    }
    .metadata-label {
      font-weight: bold;
      margin-right: 5px;
    }
    .badge {
      background-color: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.85em;
      margin-right: 4px;
    }
    .no-tags {
      font-style: italic;
      color: var(--vscode-disabledForeground);
    }
    .code-container {
      position: relative;
      margin-top: 20px;
    }
    .language-badge {
      position: absolute;
      top: -10px;
      right: 10px;
      background-color: var(--vscode-activityBarBadge-background);
      color: var(--vscode-activityBarBadge-foreground);
      padding: 1px 8px;
      border-radius: 4px;
      font-size: 0.85em;
    }
  </style>
</head>
<body>
  <h1>${snippet.title}</h1>
  
  ${snippet.description ? `<div class="description">${snippet.description}</div>` : ''}
  
  <div class="metadata">
    <div class="metadata-item">
      <span class="metadata-label">Language:</span> ${snippet.language}
    </div>
    <div class="metadata-item">
      <span class="metadata-label">Created:</span> ${createdDate}
    </div>
    <div class="metadata-item">
      <span class="metadata-label">Updated:</span> ${updatedDate}
    </div>
  </div>
  
  <div class="tags">
    <span class="metadata-label">Tags:</span> ${tagsHtml}
  </div>
  
  <div class="code-container">
    <div class="language-badge">${snippet.language}</div>
    <pre><code class="language-${snippet.language}">${escapeHtml(snippet.code)}</code></pre>
  </div>
</body>
</html>`;
  }
}

// Helper function to escape HTML special characters
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}