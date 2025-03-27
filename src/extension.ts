import * as vscode from 'vscode';
import { SnippetsProvider } from './snippetProvider';
import { TagsProvider } from './TagsProvider';
import { SnippetManager } from './snippetManager';
import { NewSnippetPanel } from './panels/newSnippetPanel';
import { SupabaseClient } from './supabaseClient';
import { SearchSnippetsPanel } from './panels/searchSnippetsPanel';
import { SnippetContentProvider } from './snippetContentProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('DevSnippet extension is now active!');

  // Initialize services
  const snippetManager = new SnippetManager(context.globalState);
  const supabaseClient = new SupabaseClient();
  
  // Initialize tree view providers
  const snippetsProvider = new SnippetsProvider(snippetManager);
  const tagsProvider = new TagsProvider(snippetManager);

    // Register the snippet content provider
	const snippetContentProvider = new SnippetContentProvider(snippetManager);
	const providerRegistration = vscode.workspace.registerTextDocumentContentProvider(
	  SnippetContentProvider.scheme, 
	  snippetContentProvider
	);
  
  // Register tree views
  vscode.window.registerTreeDataProvider('devsnippet.snippetsView', snippetsProvider);
  vscode.window.registerTreeDataProvider('devsnippet.tagsView', tagsProvider);

  // Register commands
  context.subscriptions.push(
	providerRegistration,

    vscode.commands.registerCommand('devsnippet.newSnippet', () => {
      const editor = vscode.window.activeTextEditor;
      const selectedCode = editor?.document.getText(editor.selection) || '';
      const language = editor?.document.languageId || 'plaintext';
      
      NewSnippetPanel.createOrShow(context.extensionUri, snippetManager, {
        code: selectedCode,
        language: language
      });
    }),

	vscode.commands.registerCommand('devsnippet.openSnippet', async (snippetId: string) => {
		const snippet = snippetManager.getSnippet(snippetId);
		if (snippet) {
		  const uri = vscode.Uri.parse(`${SnippetContentProvider.scheme}:/${snippetId}`);
		  const doc = await vscode.workspace.openTextDocument(uri);
		  await vscode.window.showTextDocument(doc, { preview: false });
		}
	  }),
    
    vscode.commands.registerCommand('devsnippet.editSnippet', (snippetId: string) => {
      const snippet = snippetManager.getSnippet(snippetId);
      if (snippet) {
        NewSnippetPanel.createOrShow(context.extensionUri, snippetManager, snippet);
      }
    }),
    
    vscode.commands.registerCommand('devsnippet.deleteSnippet', async (snippetId: string) => {
      const snippet = snippetManager.getSnippet(snippetId);
      if (snippet) {
        const answer = await vscode.window.showWarningMessage(
          `Are you sure you want to delete "${snippet.title}"?`,
          { modal: true },
          'Delete'
        );
        
        if (answer === 'Delete') {
          snippetManager.deleteSnippet(snippetId);
          snippetsProvider.refresh();
          tagsProvider.refresh();
          vscode.window.showInformationMessage(`Snippet "${snippet.title}" deleted`);
        }
      }
    }),
    
    vscode.commands.registerCommand('devsnippet.copySnippet', (snippetId: string) => {
      const snippet = snippetManager.getSnippet(snippetId);
      if (snippet) {
        vscode.env.clipboard.writeText(snippet.code);
        vscode.window.showInformationMessage('Snippet copied to clipboard');
      }
    }),
    
    vscode.commands.registerCommand('devsnippet.insertSnippet', (snippetId: string) => {
      const editor = vscode.window.activeTextEditor;
      const snippet = snippetManager.getSnippet(snippetId);
      
      if (editor && snippet) {
        editor.edit((editBuilder) => {
          editBuilder.insert(editor.selection.active, snippet.code);
        });
      }
    }),
    
    vscode.commands.registerCommand('devsnippet.searchSnippets', () => {
      SearchSnippetsPanel.createOrShow(context.extensionUri, snippetManager);
    }),
    
    vscode.commands.registerCommand('devsnippet.refreshSnippets', () => {
      snippetsProvider.refresh();
      tagsProvider.refresh();
    }),
    
    vscode.commands.registerCommand('devsnippet.syncSnippets', async () => {
      const config = vscode.workspace.getConfiguration('devsnippet');
      if (config.get('cloudSync')) {
        try {
          await supabaseClient.sync(snippetManager);
          vscode.window.showInformationMessage('Snippets synced successfully');
        } catch (error) {
			vscode.window.showErrorMessage(`Sync failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        const answer = await vscode.window.showInformationMessage(
          'Cloud sync is not enabled. Would you like to enable it now?',
          'Yes', 'No'
        );
        
        if (answer === 'Yes') {
          vscode.commands.executeCommand('workbench.action.openSettings', 'devsnippet.cloudSync');
        }
      }
    })
  );
}

export function deactivate() {}