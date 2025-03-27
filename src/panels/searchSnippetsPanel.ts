// src/panels/searchSnippetsPanel.ts
import * as vscode from 'vscode';
import { SnippetManager } from '../snippetManager';
import { getNonce } from '../utils';

export class SearchSnippetsPanel {
  public static currentPanel: SearchSnippetsPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  
  public static createOrShow(
    extensionUri: vscode.Uri,
    snippetManager: SnippetManager
  ) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (SearchSnippetsPanel.currentPanel) {
      SearchSnippetsPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      'devsnippet.searchSnippets',
      'Search Snippets',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
      }
    );

    SearchSnippetsPanel.currentPanel = new SearchSnippetsPanel(
      panel,
      extensionUri,
      snippetManager
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    private snippetManager: SnippetManager
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'search':
            this._performSearch(message.query);
            return;
          case 'insert':
            this._insertSnippet(message.snippetId);
            return;
          case 'close':
            this._panel.dispose();
            return;
        }
      },
      null,
      this._disposables
    );
  }

  private _performSearch(query: string) {
    const results = this.snippetManager.searchSnippets(query);
    this._panel.webview.postMessage({
      command: 'search-results',
      results
    });
  }

  private _insertSnippet(snippetId: string) {
    vscode.commands.executeCommand('devsnippet.insertSnippet', snippetId);
  }

  private _update() {
    const webview = this._panel.webview;
    webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const nonce = getNonce();
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Search Snippets</title>
        <style>
          body {
            padding: 20px;
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
            background-color: var(--vscode-editor-background);
          }
          .form-group {
            margin-bottom: 15px;
          }
          input {
            width: 100%;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 2px;
          }
          button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 12px;
            border-radius: 2px;
            cursor: pointer;
          }
          button:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
          .snippet {
            border: 1px solid var(--vscode-panel-border);
            margin-bottom: 10px;
            padding: 10px;
            border-radius: 3px;
          }
          .snippet-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          .snippet-title {
            font-weight: bold;
            margin: 0;
          }
          .snippet-language {
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
          }
          .snippet-description {
            margin-bottom: 8px;
            color: var(--vscode-descriptionForeground);
          }
          .snippet-code {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 8px;
            margin-bottom: 10px;
            border-radius: 2px;
            font-family: monospace;
            overflow-x: auto;
          }
          .snippet-footer {
            display: flex;
            justify-content: space-between;
          }
          .snippet-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
          }
          .tag {
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 12px;
          }
          .actions {
            display: flex;
            gap: 5px;
          }
          .no-results {
            text-align: center;
            color: var(--vscode-disabledForeground);
            padding: 20px;
          }
        </style>
      </head>
      <body>
        <h2>Search Snippets</h2>
        <div class="form-group">
          <input type="text" id="search-input" placeholder="Search by title, description, code or tags..." autofocus>
        </div>
        
        <div id="results"></div>

        <script nonce="${nonce}">
          (function() {
            const vscode = acquireVsCodeApi();
            
            // Search input handling
            const searchInput = document.getElementById('search-input');
            searchInput.addEventListener('input', () => {
              const query = searchInput.value.trim();
              vscode.postMessage({
                command: 'search',
                query
              });
            });
            
            // Receive search results
            window.addEventListener('message', event => {
              const message = event.data;
              if (message.command === 'search-results') {
                renderResults(message.results);
              }
            });
            
            function renderResults(results) {
              const resultsContainer = document.getElementById('results');
              
              if (results.length === 0) {
                resultsContainer.innerHTML = '<div class="no-results">No snippets found</div>';
                return;
              }
              
              resultsContainer.innerHTML = '';
              
              results.forEach(snippet => {
                const snippetEl = document.createElement('div');
                snippetEl.className = 'snippet';
                
                const header = document.createElement('div');
                header.className = 'snippet-header';
                
                const title = document.createElement('h3');
                title.className = 'snippet-title';
                title.textContent = snippet.title;
                
                const language = document.createElement('span');
                language.className = 'snippet-language';
                language.textContent = snippet.language;
                
                header.appendChild(title);
                header.appendChild(language);
                
                const description = document.createElement('div');
                description.className = 'snippet-description';
                description.textContent = snippet.description || 'No description';
                
                const code = document.createElement('pre');
                code.className = 'snippet-code';
                code.textContent = snippet.code;
                
                const footer = document.createElement('div');
                footer.className = 'snippet-footer';
                
                const tags = document.createElement('div');
                tags.className = 'snippet-tags';
                
                snippet.tags.forEach(tag => {
                  const tagEl = document.createElement('span');
                  tagEl.className = 'tag';
                  tagEl.textContent = tag;
                  tags.appendChild(tagEl);
                });
                
                const actions = document.createElement('div');
                actions.className = 'actions';
                
                const insertBtn = document.createElement('button');
                insertBtn.textContent = 'Insert';
                insertBtn.addEventListener('click', () => {
                  vscode.postMessage({
                    command: 'insert',
                    snippetId: snippet.id
                  });
                });
                
                actions.appendChild(insertBtn);
                
                footer.appendChild(tags);
                footer.appendChild(actions);
                
                snippetEl.appendChild(header);
                snippetEl.appendChild(description);
                snippetEl.appendChild(code);
                snippetEl.appendChild(footer);
                
                resultsContainer.appendChild(snippetEl);
              });
            }
            
            // Initial search for all snippets
            vscode.postMessage({
              command: 'search',
              query: ''
            });
          })();
        </script>
      </body>
      </html>
    `;
  }

  public dispose() {
    SearchSnippetsPanel.currentPanel = undefined;
    
    // Clean up resources
    this._panel.dispose();
    
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}