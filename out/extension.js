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
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const SnippetProvider_1 = require("./SnippetProvider");
const TagsProvider_1 = require("./TagsProvider");
const snippetManager_1 = require("./snippetManager");
const newSnippetPanel_1 = require("./panels/newSnippetPanel");
const supabaseClient_1 = require("./supabaseClient");
const searchSnippetsPanel_1 = require("./panels/searchSnippetsPanel");
const snippetContentProvider_1 = require("./snippetContentProvider");
function activate(context) {
    console.log('DevSnippet extension is now active!');
    // Initialize services
    const snippetManager = new snippetManager_1.SnippetManager(context.globalState);
    const supabaseClient = new supabaseClient_1.SupabaseClient();
    // Initialize tree view providers
    const snippetsProvider = new SnippetProvider_1.SnippetsProvider(snippetManager);
    const tagsProvider = new TagsProvider_1.TagsProvider(snippetManager);
    // Register the snippet content provider
    const snippetContentProvider = new snippetContentProvider_1.SnippetContentProvider(snippetManager);
    const providerRegistration = vscode.workspace.registerTextDocumentContentProvider(snippetContentProvider_1.SnippetContentProvider.scheme, snippetContentProvider);
    // Register tree views
    vscode.window.registerTreeDataProvider('devsnippet.snippetsView', snippetsProvider);
    vscode.window.registerTreeDataProvider('devsnippet.tagsView', tagsProvider);
    // Register commands
    context.subscriptions.push(providerRegistration, vscode.commands.registerCommand('devsnippet.clearTagFilter', () => {
        snippetsProvider.clearTagFilter();
        vscode.window.showInformationMessage('Cleared tag filter');
    }), vscode.commands.registerCommand('devsnippet.newSnippet', () => {
        const editor = vscode.window.activeTextEditor;
        const selectedCode = editor?.document.getText(editor.selection) || '';
        const language = editor?.document.languageId || 'plaintext';
        newSnippetPanel_1.NewSnippetPanel.createOrShow(context.extensionUri, snippetManager, {
            code: selectedCode,
            language: language
        });
    }), vscode.commands.registerCommand('devsnippet.filterByTag', (tagName) => {
        // Set the filter in snippetsProvider
        snippetsProvider.setTagFilter(tagName);
        // Refresh the snippets view to show filtered results
        vscode.commands.executeCommand('devsnippet.refreshSnippets');
        // Show information message
        vscode.window.showInformationMessage(`Filtered snippets by tag: ${tagName}`);
    }), vscode.commands.registerCommand('devsnippet.openSnippet', async (snippetId) => {
        const snippet = snippetManager.getSnippet(snippetId);
        if (snippet) {
            // Create and show panel
            const panel = vscode.window.createWebviewPanel('snippetPreview', `${snippet.title}`, vscode.ViewColumn.One, {
                enableScripts: true,
                retainContextWhenHidden: true
            });
            // Format creation and update dates
            const createdDate = new Date(snippet.created_at).toLocaleString();
            const updatedDate = new Date(snippet.updated_at).toLocaleString();
            // Create tags with badges
            const tagsHtml = snippet.tags && snippet.tags.length
                ? snippet.tags.map(tag => `<span class="badge">${tag}</span>`).join(' ')
                : '<span class="no-tags">No tags</span>';
            // First, get a reference to the codicon CSS URL
            const codiconsUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css'));
            // Set HTML content with syntax highlighting via highlight.js
            panel.webview.html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/vs2015.min.css">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js"></script>
      <!-- Load language-specific syntax highlighting -->
      <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/languages/${getHighlightJsLanguage(snippet.language)}.min.js"></script>
        <link href="${codiconsUri}" rel="stylesheet" />
      <style>
        body {
          font-family: var(--vscode-editor-font-family);
          padding: 16px;
          line-height: 1.5;
          color: var(--vscode-foreground);
          max-width: 1000px;
          margin: 0 auto;
        }
        h1 {
          color: var(--vscode-editor-foreground);
          border-bottom: 1px solid var(--vscode-panel-border);
          padding-bottom: 10px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header-right {
          font-size: 0.8em;
          color: var(--vscode-descriptionForeground);
        }
        .description {
          margin-bottom: 20px;
          font-style: italic;
          padding: 12px;
          background-color: var(--vscode-editor-inactiveSelectionBackground);
          border-radius: 6px;
          border-left: 4px solid var(--vscode-activityBarBadge-background);
        }
        .metadata {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 20px;
          font-size: 0.9em;
          color: var(--vscode-descriptionForeground);
          background-color: var(--vscode-editor-background);
          padding: 12px;
          border-radius: 6px;
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
          cursor: pointer;
          transition: transform 0.1s;
        }
        .badge:hover {
          transform: scale(1.05);
        }
        .no-tags {
          font-style: italic;
          color: var(--vscode-disabledForeground);
        }
        .code-container {
          position: relative;
          margin-top: 20px;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .code-header {
          background-color: var(--vscode-tab-activeBackground);
          padding: 8px 16px;
          font-family: var(--vscode-font-family);
          font-size: 0.9em;
          color: var(--vscode-tab-activeForeground);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .code-actions {
          display: flex;
          gap: 10px;
        }
        .code-action {
          cursor: pointer;
          opacity: 0.8;
          transition: opacity 0.2s;
        }
        .code-action:hover {
          opacity: 1;
        }
        pre {
          margin: 0;
          padding: 16px;
          overflow: auto;
          font-size: 14px;
          max-height: 400px;
          background-color: var(--vscode-editor-background);
        }
        code {
          font-family: var(--vscode-editor-font-family);
          white-space: pre;
          padding: 0;
        }
        .hljs {
          background-color: var(--vscode-editor-background) !important;
        }
        .language-badge {
          position: absolute;
          top: 8px;
          right: 16px;
          background-color: var(--vscode-activityBarBadge-background);
          color: var(--vscode-activityBarBadge-foreground);
          padding: 1px 8px;
          border-radius: 4px;
          font-size: 0.85em;
          z-index: 10;
        }
        .buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 16px 0;
        }
        button {
          background-color: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          padding: 8px 14px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background-color 0.2s;
        }
        button:hover {
          background-color: var(--vscode-button-hoverBackground);
        }
        .danger {
          background-color: var(--vscode-errorForeground);
        }
        .danger:hover {
          background-color: color-mix(in srgb, var(--vscode-errorForeground), black 10%);
        }
        .codicon {
          font-family: codicon;
          font-size: 16px;
          line-height: 1;
        }
        /* Codicon characters */
        .codicon-edit:before { content: '\\ea73'; }
        .codicon-copy:before { content: '\\eb8b'; }
        .codicon-insert:before { content: '\\ea60'; }
        .codicon-delete:before { content: '\\ea76'; }
        .codicon-symbol-file:before { content: '\\ea7b'; }
        @media (max-width: 600px) {
          .metadata {
            flex-direction: column;
            gap: 6px;
          }
        }
        .copy-notification {
          position: fixed;
          bottom: 20px;
          right: 20px;
          padding: 10px 20px;
          background-color: var(--vscode-activityBarBadge-background);
          color: var(--vscode-activityBarBadge-foreground);
          border-radius: 4px;
          opacity: 0;
          transition: opacity 0.2s;
          z-index: 100;
        }
        .copy-notification.show {
          opacity: 1;
        }
        /* Line numbers */
        .hljs-ln {
          border-collapse: collapse;
        }
        .hljs-ln td {
          padding: 0;
        }
        .hljs-ln-n {
          width: 30px;
          color: var(--vscode-editorLineNumber-foreground);
          text-align: right;
          padding-right: 8px !important;
          user-select: none;
        }
        .hljs-ln-code {
          padding-left: 8px !important;
        }

        .code-with-lines {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--vscode-editor-font-family);
  font-size: 14px;
}

.line-number {
  user-select: none;
  text-align: right;
  padding-right: 16px !important;
  color: var(--vscode-editorLineNumber-foreground);
  min-width: 40px;
  width: 40px;
  position: relative;
}

.line-number::before {
  content: attr(data-line-number);
}

.line-content {
  white-space: pre;
  padding-left: 16px !important;
  border-left: 1px solid var(--vscode-editor-lineHighlightBorder, rgba(255,255,255,0.1));
}
      </style>
    </head>
    <body>
      <h1>
        <span>${snippet.title}</span>
        <span class="header-right">${snippet.language.toUpperCase()}</span>
      </h1>
      
      ${snippet.description ? `<div class="description">${snippet.description}</div>` : ''}
      
      <div class="metadata">
        <div class="metadata-item">
          <span class="codicon codicon-symbol-file"></span>
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
    
      <div class="buttons">
        <button id="editButton"><span class="codicon codicon-edit"></span> Edit</button>
        <button id="copyButton"><span class="codicon codicon-copy"></span> Copy to Clipboard</button>
        <button id="insertButton"><span class="codicon codicon-insert"></span> Insert at Cursor</button>
        <button id="deleteButton" class="danger"><span class="codicon codicon-delete"></span> Delete</button>
      </div>
      
      <div class="code-container">
        <div class="code-header">
          <span>${snippet.title}</span>
          <div class="code-actions">
            <span id="copyCodeBtn" class="code-action" title="Copy code"><span class="codicon codicon-copy"></span></span>
          </div>
        </div>
        <pre><code class="language-${snippet.language}">${escapeHtml(snippet.code)}</code></pre>
      </div>
    
      <div id="copyNotification" class="copy-notification">Copied to clipboard!</div>
    
      <script>
const vscode = acquireVsCodeApi();
        
        // Initialize syntax highlighting
        document.addEventListener('DOMContentLoaded', () => {
          hljs.highlightAll();
          
          setTimeout(() => {
            const codeElement = document.querySelector('code');
            if (codeElement) {
              // Only add line numbers if we have multiple lines
              if (codeElement.textContent.split('\\n').length > 1) {
                // Custom line numbering approach
                applyLineNumbers(codeElement);
              }
            }
          }, 100);
        });

        function applyLineNumbers(codeElement) {
          // Store original highlighted code
          const code = codeElement.innerHTML;
          const lines = code.split('\\n');
          
          // Build the table with line numbers
          let numberedCode = '<table class="code-with-lines"><tbody>';
          lines.forEach((line, index) => {
            // Skip empty last line
            if (index === lines.length - 1 && line === '') return;
            
            const lineNumber = index + 1;
            numberedCode += '<tr><td class="line-number" data-line-number="' + lineNumber + '"></td><td class="line-content">' + line + '</td></tr>';
          });
          numberedCode += '</tbody></table>';
          
          // Replace the code element's content with the table
          codeElement.innerHTML = numberedCode;
        }
    
        // Button event listeners
        document.getElementById('editButton').addEventListener('click', () => {
          vscode.postMessage({ command: 'edit', snippetId: '${snippetId}' });
        });
        
        document.getElementById('copyButton').addEventListener('click', () => {
          vscode.postMessage({ command: 'copy', snippetId: '${snippetId}' });
          showCopyNotification();
        });
        
        document.getElementById('insertButton').addEventListener('click', () => {
          vscode.postMessage({ command: 'insert', snippetId: '${snippetId}' });
        });
    
        document.getElementById('deleteButton').addEventListener('click', () => {
          vscode.postMessage({ command: 'delete', snippetId: '${snippetId}' });
        });
        
        document.getElementById('copyCodeBtn').addEventListener('click', () => {
          vscode.postMessage({ command: 'copy', snippetId: '${snippetId}' });
          showCopyNotification();
        });
        
        // Quick copy from code box
        function showCopyNotification() {
          const notification = document.getElementById('copyNotification');
          notification.classList.add('show');
          setTimeout(() => {
            notification.classList.remove('show');
          }, 2000);
        }
        
        // Make tags clickable to filter by tag
        document.querySelectorAll('.badge').forEach(badge => {
          badge.addEventListener('click', (e) => {
            const tagName = e.target.textContent;
            vscode.postMessage({ command: 'filterByTag', tagName });
          });
        });
    
        // Highlight.js line numbers plugin
        !function(e){"use strict";function t(){var e=document.createElement("style");e.type="text/css",e.innerHTML=".hljs-ln{border-collapse:collapse}.hljs-ln td{padding:0}.hljs-ln-n:before{content:attr(data-line-number)}",document.getElementsByTagName("head")[0].appendChild(e)}function n(t){"complete"===document.readyState?r(t):e.addEventListener("DOMContentLoaded",function(){r(t)})}function r(t){try{var n=document.querySelectorAll("code.hljs,code.nohighlight");for(var r in n)n.hasOwnProperty(r)&&l(n[r],t)}catch(i){e.console.error("LineNumbers error: ",i)}}function l(e,t){"object"==typeof e&&(t=t||{singleLine:!1},e.innerHTML=i(e,t))}function i(e,t){var n=s(e),r=t.singleLine?0:1;return c(e),n.length>r?o(n,r):n[0]}function o(e,t){for(var n="",r=t;r<e.length;r++)n+=a(r,e[r]);return n}function a(e,t){return'<tr><td class="hljs-ln-numbers"><div class="hljs-ln-line hljs-ln-n" data-line-number="'+(e+1)+'"></div></td><td class="hljs-ln-code"><div class="hljs-ln-line">'+t+"</div></td></tr>"}function s(e){var t,n=e.innerHTML.split("\\n");for(t=0;t<n.length;t++)n[t]=d(n[t]);return n}function d(e){return""!==e?e:'<span class="hljs-ln-line"></span>'}function c(e){var t;if(e.childNodes.length>0)for(t=0;t<e.childNodes.length;t++)"code"===e.childNodes[t].nodeName.toLowerCase()&&c(e.childNodes[t]);else e.textContent=e.textContent.replace(/\\n\\r?\\n/g,"\\n")}var u=function(e){e=e||{};var r="hljs-ln",l={"singleLine":!1,"startFrom":1};for(var i in e)e.hasOwnProperty(i)&&(l[i]=e[i]);try{var o=document.querySelector("."+r);o&&o.innerHTML.trim()&&(o.innerHTML="")}catch(a){}t(),n(l)};e.hljs?e.hljs.initLineNumbersOnLoad=u:e.console.error("highlight.js not detected!")}(window);
      </script>
    </body>
    </html>`;
            // Handle messages from the webview
            panel.webview.onDidReceiveMessage(message => {
                switch (message.command) {
                    case 'edit':
                        vscode.commands.executeCommand('devsnippet.editSnippet', snippetId);
                        return;
                    case 'copy':
                        vscode.commands.executeCommand('devsnippet.copySnippet', snippetId);
                        return;
                    case 'insert':
                        vscode.commands.executeCommand('devsnippet.insertSnippet', snippetId);
                        return;
                    case 'delete':
                        vscode.commands.executeCommand('devsnippet.deleteSnippet', snippetId);
                        return;
                    case 'filterByTag':
                        vscode.commands.executeCommand('devsnippet.filterByTag', message.tagName);
                        return;
                }
            });
        }
    }), vscode.commands.registerCommand('devsnippet.editSnippet', (itemOrId) => {
        // Extract snippet ID whether we get a string ID or a tree item
        const snippetId = typeof itemOrId === 'string' ? itemOrId : itemOrId?.snippetId;
        if (!snippetId) {
            vscode.window.showErrorMessage('Cannot edit: Snippet ID not found');
            return;
        }
        const snippet = snippetManager.getSnippet(snippetId);
        if (snippet) {
            // Open the edit panel with the current snippet data
            newSnippetPanel_1.NewSnippetPanel.createOrShow(context.extensionUri, snippetManager, {
                id: snippet.id,
                title: snippet.title,
                description: snippet.description,
                language: snippet.language,
                tags: snippet.tags,
                code: snippet.code
            });
        }
        else {
            vscode.window.showErrorMessage('Snippet not found');
        }
    }), vscode.commands.registerCommand('devsnippet.deleteSnippet', async (itemOrId) => {
        console.log('Delete called with:', itemOrId); // Debug log
        // Extract snippet ID whether we get a string ID or a tree item
        const snippetId = typeof itemOrId === 'string' ? itemOrId : itemOrId?.snippetId;
        console.log('Extracted ID:', snippetId); // Debug log
        if (!snippetId) {
            vscode.window.showErrorMessage('Cannot delete: Snippet ID not found');
            return;
        }
        const snippet = snippetManager.getSnippet(snippetId);
        if (!snippet) {
            vscode.window.showErrorMessage('Snippet not found');
            return;
        }
        // Confirm deletion
        const confirm = await vscode.window.showWarningMessage(`Are you sure you want to delete the snippet "${snippet.title}"?`, { modal: true }, 'Delete', 'Cancel');
        if (confirm === 'Delete') {
            try {
                // Make sure snippetManager has a deleteSnippet method
                snippetManager.deleteSnippet(snippetId);
                vscode.window.showInformationMessage('Snippet deleted successfully');
                // Refresh the tree view
                snippetsProvider.refresh();
                // Close any open editors for this snippet
                const editors = vscode.window.visibleTextEditors;
                for (const editor of editors) {
                    if (editor.document.uri.scheme === 'devsnippet' &&
                        editor.document.uri.path.substring(1) === snippetId) {
                        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                        break;
                    }
                }
            }
            catch (error) {
                console.error('Error deleting snippet:', error);
                vscode.window.showErrorMessage(`Failed to delete snippet: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }), vscode.commands.registerCommand('devsnippet.copySnippet', (itemOrId) => {
        // Extract snippet ID whether we get a string ID or a tree item
        const snippetId = typeof itemOrId === 'string' ? itemOrId : itemOrId?.snippetId;
        if (!snippetId) {
            vscode.window.showErrorMessage('Cannot copy: Snippet ID not found');
            return;
        }
        const snippet = snippetManager.getSnippet(snippetId);
        if (snippet) {
            vscode.env.clipboard.writeText(snippet.code);
            vscode.window.showInformationMessage('Snippet code copied to clipboard!');
        }
        else {
            vscode.window.showErrorMessage('Snippet not found');
        }
    }), vscode.commands.registerCommand('devsnippet.insertSnippet', (snippetId) => {
        const editor = vscode.window.activeTextEditor;
        const snippet = snippetManager.getSnippet(snippetId);
        if (editor && snippet) {
            editor.edit((editBuilder) => {
                editBuilder.insert(editor.selection.active, snippet.code);
            });
        }
    }), vscode.commands.registerCommand('devsnippet.searchSnippets', () => {
        searchSnippetsPanel_1.SearchSnippetsPanel.createOrShow(context.extensionUri, snippetManager);
    }), vscode.commands.registerCommand('devsnippet.refreshSnippets', () => {
        snippetsProvider.refresh();
        tagsProvider.refresh();
    }), vscode.commands.registerCommand('devsnippet.syncSnippets', async () => {
        const config = vscode.workspace.getConfiguration('devsnippet');
        if (config.get('cloudSync')) {
            try {
                await supabaseClient.sync(snippetManager);
                vscode.window.showInformationMessage('Snippets synced successfully');
            }
            catch (error) {
                vscode.window.showErrorMessage(`Sync failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        else {
            const answer = await vscode.window.showInformationMessage('Cloud sync is not enabled. Would you like to enable it now?', 'Yes', 'No');
            if (answer === 'Yes') {
                vscode.commands.executeCommand('workbench.action.openSettings', 'devsnippet.cloudSync');
            }
        }
    }));
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
// Replace the non-working escapeHtml function at the bottom of extension.ts with this:
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
function getHighlightJsLanguage(language) {
    // Map common VS Code language identifiers to highlight.js identifiers
    const languageMap = {
        'javascript': 'javascript',
        'typescript': 'typescript',
        'python': 'python',
        'csharp': 'csharp',
        'c': 'c',
        'cpp': 'cpp',
        'java': 'java',
        'php': 'php',
        'ruby': 'ruby',
        'go': 'go',
        'rust': 'rust',
        'html': 'xml',
        'css': 'css',
        'sql': 'sql',
        'shell': 'bash',
        'powershell': 'powershell',
        'dockerfile': 'dockerfile',
        'yaml': 'yaml',
        'json': 'json',
        'markdown': 'markdown'
    };
    return languageMap[language.toLowerCase()] || 'plaintext';
}
//# sourceMappingURL=extension.js.map