"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewSnippetPanel = void 0;
const vscode = __importStar(require("vscode"));
const utils_1 = require("../utils");
class NewSnippetPanel {
    snippetManager;
    static currentPanel;
    _panel;
    _extensionUri;
    _disposables = [];
    static createOrShow(extensionUri, snippetManager, initialData) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // If we already have a panel, show it
        if (NewSnippetPanel.currentPanel) {
            NewSnippetPanel.currentPanel._panel.reveal(column);
            NewSnippetPanel.currentPanel._update(initialData);
            return;
        }
        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel('devsnippet.newSnippet', initialData?.id ? 'Edit Snippet' : 'New Snippet', column || vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
        });
        NewSnippetPanel.currentPanel = new NewSnippetPanel(panel, extensionUri, snippetManager, initialData);
    }
    constructor(panel, extensionUri, snippetManager, initialData) {
        this.snippetManager = snippetManager;
        this._panel = panel;
        this._extensionUri = extensionUri;
        // Set the webview's initial html content
        this._update(initialData);
        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'save':
                    this._saveSnippet(message.snippet, initialData?.id);
                    return;
                case 'close':
                    this._panel.dispose();
                    return;
            }
        }, null, this._disposables);
    }
    _saveSnippet(snippetData, id) {
        try {
            let snippetId;
            if (id) {
                // Update existing snippet
                const updated = this.snippetManager.updateSnippet(id, snippetData);
                vscode.window.showInformationMessage('Snippet updated successfully');
                snippetId = id;
            }
            else {
                // Create new snippet
                const newSnippet = this.snippetManager.addSnippet(snippetData);
                vscode.window.showInformationMessage('Snippet created successfully');
                snippetId = newSnippet.id;
            }
            // Refresh the snippets view
            vscode.commands.executeCommand('devsnippet.refreshSnippets');
            // Open the snippet in a new tab
            vscode.commands.executeCommand('devsnippet.openSnippet', snippetId);
            // Close the panel
            this._panel.dispose();
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to save snippet: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    _update(initialData) {
        const webview = this._panel.webview;
        this._panel.title = initialData?.id ? 'Edit Snippet' : 'New Snippet';
        // Generate the HTML for the webview
        webview.html = this._getHtmlForWebview(webview, initialData);
    }
    _getHtmlForWebview(webview, initialData) {
        const nonce = (0, utils_1.getNonce)();
        const languages = [
            'plaintext', 'javascript', 'typescript', 'python', 'java', 'cpp',
            'csharp', 'go', 'ruby', 'php', 'html', 'css', 'sql', 'shell'
        ];
        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${initialData?.id ? 'Edit Snippet' : 'New Snippet'}</title>
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
          label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
          }
          input, textarea, select {
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
            margin-right: 10px;
          }
          button:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
          #tags-container {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            margin-top: 10px;
          }
          .tag {
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 2px 8px;
            border-radius: 10px;
            display: flex;
            align-items: center;
          }
          .tag button {
            background: none;
            border: none;
            color: var(--vscode-badge-foreground);
            margin-left: 5px;
            padding: 0 2px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <h2>${initialData?.id ? 'Edit Snippet' : 'Create New Snippet'}</h2>
        <div class="form-group">
          <label for="title">Title</label>
          <input type="text" id="title" value="${initialData?.title || ''}" required>
        </div>
        
        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" rows="2">${initialData?.description || ''}</textarea>
        </div>
        
        <div class="form-group">
          <label for="language">Language</label>
          <select id="language">
            ${languages.map(lang => `
              <option value="${lang}" ${(initialData?.language === lang) ? 'selected' : ''}>
                ${lang.charAt(0).toUpperCase() + lang.slice(1)}
              </option>
            `).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label for="code">Code</label>
          <textarea id="code" rows="10">${initialData?.code || ''}</textarea>
        </div>
        
        <div class="form-group">
          <label for="tag-input">Tags</label>
          <div style="display: flex;">
            <input type="text" id="tag-input" placeholder="Add tag and press Enter">
            <button type="button" id="add-tag" style="margin-left: 5px;">Add</button>
          </div>
          <div id="tags-container">
            ${initialData?.tags ? initialData.tags.map(tag => `
              <div class="tag" data-tag="${tag}">
                ${tag}
                <button type="button" class="remove-tag">×</button>
              </div>
            `).join('') : ''}
          </div>
        </div>
        
        <div class="form-group" style="margin-top: 20px;">
          <button type="button" id="save-button">
            ${initialData?.id ? 'Update' : 'Create'} Snippet
          </button>
          <button type="button" id="cancel-button">Cancel</button>
        </div>

        <script nonce="${nonce}">
          (function() {
            const vscode = acquireVsCodeApi();
            let tags = ${initialData?.tags ? JSON.stringify(initialData.tags) : '[]'};
            
            // Handle tag input
            document.getElementById('tag-input').addEventListener('keydown', (e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            });
            
            document.getElementById('add-tag').addEventListener('click', () => {
              addTag();
            });
            
            function addTag() {
              const input = document.getElementById('tag-input');
              const tag = input.value.trim();
              
              if (tag && !tags.includes(tag)) {
                tags.push(tag);
                renderTags();
                input.value = '';
              }
            }
            
            function removeTag(tag) {
              tags = tags.filter(t => t !== tag);
              renderTags();
            }
            
            function renderTags() {
              const container = document.getElementById('tags-container');
              container.innerHTML = '';
              
              tags.forEach(tag => {
                const tagEl = document.createElement('div');
                tagEl.className = 'tag';
                tagEl.dataset.tag = tag;
                tagEl.innerHTML = \`\${tag}<button type="button" class="remove-tag">×</button>\`;
                
                tagEl.querySelector('.remove-tag').addEventListener('click', () => {
                  removeTag(tag);
                });
                
                container.appendChild(tagEl);
              });
            }
            
            // Handle save button
            document.getElementById('save-button').addEventListener('click', () => {
              const title = document.getElementById('title').value.trim();
              const description = document.getElementById('description').value.trim();
              const language = document.getElementById('language').value;
              const code = document.getElementById('code').value;
              
              if (!title) {
                alert('Title is required');
                return;
              }
              
              if (!code) {
                alert('Code is required');
                return;
              }
              
              vscode.postMessage({
                command: 'save',
                snippet: {
                  title,
                  description,
                  language,
                  code,
                  tags
                }
              });
            });
            
            // Handle cancel button
            document.getElementById('cancel-button').addEventListener('click', () => {
              vscode.postMessage({
                command: 'close'
              });
            });
            
            // Initialize tags
            renderTags();
          })();
        </script>
      </body>
      </html>
    `;
    }
    dispose() {
        NewSnippetPanel.currentPanel = undefined;
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
exports.NewSnippetPanel = NewSnippetPanel;
//# sourceMappingURL=newSnippetPanel.js.map