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
exports.TagTreeItem = exports.TagsProvider = exports.TagItem = void 0;
// src/tagsProvider.ts
const vscode = __importStar(require("vscode"));
class TagItem extends vscode.TreeItem {
    tag;
    collapsibleState;
    constructor(tag, collapsibleState) {
        super(tag, collapsibleState);
        this.tag = tag;
        this.collapsibleState = collapsibleState;
        this.tooltip = `Filter by tag: ${tag}`;
        this.iconPath = new vscode.ThemeIcon('tag');
        this.contextValue = 'tag';
        // Set command to execute when item is clicked
        this.command = {
            command: 'devsnippet.filterByTag',
            title: 'Filter by Tag',
            arguments: [tag]
        };
    }
}
exports.TagItem = TagItem;
class TagsProvider {
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
            // Tags don't have children
            return Promise.resolve([]);
        }
        else {
            // Root level, show all tags
            const tags = this.snippetManager.getAllTags();
            return Promise.resolve(tags.map(tag => new TagItem(tag, vscode.TreeItemCollapsibleState.None)));
        }
    }
}
exports.TagsProvider = TagsProvider;
class TagTreeItem extends vscode.TreeItem {
    label;
    count;
    collapsibleState;
    constructor(label, count, collapsibleState) {
        super(label, collapsibleState);
        this.label = label;
        this.count = count;
        this.collapsibleState = collapsibleState;
        this.tooltip = `${label} (${count} snippets)`;
        this.description = count.toString();
        this.contextValue = 'tag';
        // Add a command to filter by this tag when clicked
        this.command = {
            command: 'devsnippet.filterByTag',
            title: 'Filter by Tag',
            arguments: [this.label]
        };
    }
}
exports.TagTreeItem = TagTreeItem;
//# sourceMappingURL=TagsProvider.js.map