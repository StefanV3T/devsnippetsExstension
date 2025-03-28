import * as vscode from 'vscode';
import { SnippetManager } from './snippetManager';

// Tree item representing a snippet in the TreeView
export class SnippetTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly snippetId: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly language: string
  ) {
    super(label, collapsibleState);
    
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

export class SnippetsProvider implements vscode.TreeDataProvider<SnippetTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<SnippetTreeItem | undefined | null | void> = 
    new vscode.EventEmitter<SnippetTreeItem | undefined | null | void>();

  readonly onDidChangeTreeData: vscode.Event<SnippetTreeItem | undefined | null | void> = 
    this._onDidChangeTreeData.event;

  private tagFilter: string | null = null;

  constructor(private snippetManager: SnippetManager) {}

  // Method to set the tag filter
  setTagFilter(tagName: string | null) {
    this.tagFilter = tagName;
    this.refresh();
  }

  // Method to clear the tag filter
  clearTagFilter() {
    this.tagFilter = null;
    this.refresh();
  }

  // Refresh the tree view
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: SnippetTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: SnippetTreeItem): Thenable<SnippetTreeItem[]> {
    if (element) {
      // If there's a parent element, this would handle nested items (if needed)
      return Promise.resolve([]);
    } else {
      // Get all snippets from the snippet manager
      let snippets = this.snippetManager.getSnippets();
      
      // Filter snippets by tag if a tag filter is set
      if (this.tagFilter) {
        snippets = snippets.filter(snippet => 
          snippet.tags.includes(this.tagFilter!)
        );
      }
      
      // Convert snippets to tree items
      return Promise.resolve(
        snippets.map(snippet => new SnippetTreeItem(
          snippet.title,
          snippet.id,
          vscode.TreeItemCollapsibleState.None,
          snippet.language
        ))
      );
    }
  }
}