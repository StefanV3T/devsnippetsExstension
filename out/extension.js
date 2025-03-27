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
const snippetProvider_1 = require("./snippetProvider");
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
    const snippetsProvider = new snippetProvider_1.SnippetsProvider(snippetManager);
    const tagsProvider = new TagsProvider_1.TagsProvider(snippetManager);
    // Register the snippet content provider
    const snippetContentProvider = new snippetContentProvider_1.SnippetContentProvider(snippetManager);
    const providerRegistration = vscode.workspace.registerTextDocumentContentProvider(snippetContentProvider_1.SnippetContentProvider.scheme, snippetContentProvider);
    // Register tree views
    vscode.window.registerTreeDataProvider('devsnippet.snippetsView', snippetsProvider);
    vscode.window.registerTreeDataProvider('devsnippet.tagsView', tagsProvider);
    // Register commands
    context.subscriptions.push(providerRegistration, vscode.commands.registerCommand('devsnippet.newSnippet', () => {
        const editor = vscode.window.activeTextEditor;
        const selectedCode = editor?.document.getText(editor.selection) || '';
        const language = editor?.document.languageId || 'plaintext';
        newSnippetPanel_1.NewSnippetPanel.createOrShow(context.extensionUri, snippetManager, {
            code: selectedCode,
            language: language
        });
    }), vscode.commands.registerCommand('devsnippet.openSnippet', async (snippetId) => {
        const snippet = snippetManager.getSnippet(snippetId);
        if (snippet) {
            const uri = vscode.Uri.parse(`${snippetContentProvider_1.SnippetContentProvider.scheme}:/${snippetId}`);
            const doc = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(doc, { preview: false });
        }
    }), vscode.commands.registerCommand('devsnippet.editSnippet', (snippetId) => {
        const snippet = snippetManager.getSnippet(snippetId);
        if (snippet) {
            newSnippetPanel_1.NewSnippetPanel.createOrShow(context.extensionUri, snippetManager, snippet);
        }
    }), vscode.commands.registerCommand('devsnippet.deleteSnippet', async (snippetId) => {
        const snippet = snippetManager.getSnippet(snippetId);
        if (snippet) {
            const answer = await vscode.window.showWarningMessage(`Are you sure you want to delete "${snippet.title}"?`, { modal: true }, 'Delete');
            if (answer === 'Delete') {
                snippetManager.deleteSnippet(snippetId);
                snippetsProvider.refresh();
                tagsProvider.refresh();
                vscode.window.showInformationMessage(`Snippet "${snippet.title}" deleted`);
            }
        }
    }), vscode.commands.registerCommand('devsnippet.copySnippet', (snippetId) => {
        const snippet = snippetManager.getSnippet(snippetId);
        if (snippet) {
            vscode.env.clipboard.writeText(snippet.code);
            vscode.window.showInformationMessage('Snippet copied to clipboard');
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
//# sourceMappingURL=extension.js.map