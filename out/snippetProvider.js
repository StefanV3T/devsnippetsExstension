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
exports.SnippetsProvider = exports.SnippetTreeItem = void 0;
const vscode = __importStar(require("vscode"));
// Tree item representing a snippet in the TreeView
class SnippetTreeItem extends vscode.TreeItem {
    label;
    snippetId;
    collapsibleState;
    language;
    constructor(label, snippetId, collapsibleState, language) {
        super(label, collapsibleState);
        this.label = label;
        this.snippetId = snippetId;
        this.collapsibleState = collapsibleState;
        this.language = language;
        // Set additional properties
        this.tooltip = label;
        this.description = language;
        this.contextValue = 'snippet';
        // Set the command that is executed when this tree item is clicked
        this.command = {
            command: 'devsnippet.openSnippet',
            title: 'Open Snippet',
            arguments: [snippetId]
        };
        // Set icon based on language if possible
        this.iconPath = new vscode.ThemeIcon('code');
    }
}
exports.SnippetTreeItem = SnippetTreeItem;
class SnippetsProvider {
    snippetManager;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    tagFilter = null;
    constructor(snippetManager) {
        this.snippetManager = snippetManager;
    }
    // Method to set the tag filter
    setTagFilter(tagName) {
        this.tagFilter = tagName;
        this.refresh();
    }
    // Method to clear the tag filter
    clearTagFilter() {
        this.tagFilter = null;
        this.refresh();
    }
    // Refresh the tree view
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element) {
            // If there's a parent element, this would handle nested items (if needed)
            return Promise.resolve([]);
        }
        else {
            // Get all snippets from the snippet manager
            let snippets = this.snippetManager.getSnippets();
            // Filter snippets by tag if a tag filter is set
            if (this.tagFilter) {
                snippets = snippets.filter(snippet => snippet.tags.includes(this.tagFilter));
            }
            // Convert snippets to tree items
            return Promise.resolve(snippets.map(snippet => new SnippetTreeItem(snippet.title, snippet.id, vscode.TreeItemCollapsibleState.None, snippet.language)));
        }
    }
}
exports.SnippetsProvider = SnippetsProvider;
//# sourceMappingURL=snippetProvider.js.map