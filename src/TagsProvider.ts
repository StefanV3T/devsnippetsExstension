// src/tagsProvider.ts
import * as vscode from 'vscode';
import { SnippetManager } from './snippetManager';

export class TagItem extends vscode.TreeItem {
  constructor(
    public readonly tag: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(tag, collapsibleState);
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

export class TagsProvider implements vscode.TreeDataProvider<TagItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TagItem | undefined | null | void> = new vscode.EventEmitter<TagItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TagItem | undefined | null | void> = this._onDidChangeTreeData.event;
  
  constructor(private snippetManager: SnippetManager) {}
  
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
  
  getTreeItem(element: TagItem): vscode.TreeItem {
    return element;
  }
  
  getChildren(element?: TagItem): Thenable<TagItem[]> {
    if (element) {
      // Tags don't have children
      return Promise.resolve([]);
    } else {
      // Root level, show all tags
      const tags = this.snippetManager.getAllTags();
      
      return Promise.resolve(
        tags.map(tag => new TagItem(tag, vscode.TreeItemCollapsibleState.None))
      );
    }
  }
}

export class TagTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly count: number,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    
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