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
exports.SnippetsProvider = exports.SnippetItem = void 0;
const vscode = __importStar(require("vscode"));
class SnippetItem extends vscode.TreeItem {
    snippet;
    collapsibleState;
    constructor(snippet, collapsibleState) {
        super(snippet.title, collapsibleState);
        this.snippet = snippet;
        this.collapsibleState = collapsibleState;
        this.tooltip = snippet.description || snippet.title;
        this.description = snippet.language;
        this.contextValue = 'snippet';
        // Set icon based on language
        this.iconPath = new vscode.ThemeIcon('code');
        // Set command to execute when item is clicked
        this.command = {
            command: 'devsnippet.copySnippet',
            title: 'Copy Snippet',
            arguments: [snippet.id]
        };
    }
}
exports.SnippetItem = SnippetItem;
class SnippetsProvider {
    snippetManager;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    constructor(snippetManager) {
        this.snippetManager = snippetManager;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element) {
            // If element is provided, we're looking for children of a snippet (which has none)
            return Promise.resolve([]);
        }
        else {
            // Root level, show all snippets
            const snippets = this.snippetManager.getAllSnippets();
            if (snippets.length === 0) {
                vscode.window.showInformationMessage('No snippets found. Create one by selecting code and using "DevSnippet: Create New Snippet"');
            }
            return Promise.resolve(snippets.map(snippet => new SnippetItem(snippet, vscode.TreeItemCollapsibleState.None)));
        }
    }
}
exports.SnippetsProvider = SnippetsProvider;
//# sourceMappingURL=snippetProvider.js.map