import { createClient } from '@supabase/supabase-js';
import * as vscode from 'vscode';
import { SnippetManager, Snippet } from './snippetManager';

export class SupabaseClient {
  private client: any;
  
  constructor() {
    const config = vscode.workspace.getConfiguration('devsnippet');
    const url = config.get<string>('cloudUrl');
    const key = config.get<string>('supabaseKey');
    
    if (url && key) {
      this.client = createClient(url, key);
    }
  }
  
  public async sync(snippetManager: SnippetManager): Promise<void> {
    if (!this.client) {
      throw new Error('Supabase client not initialized. Please configure cloud URL and key.');
    }
    
    // Get authentication status
    const { data: { user } } = await this.client.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated. Please sign in first.');
    }
    
    // Get local snippets
    const localSnippets = snippetManager.getAllSnippets();
    
    // Get cloud snippets
    const { data: cloudSnippets, error } = await this.client
      .from('snippets')
      .select('*')
      .eq('user_id', user.id);
      
    if (error) {
      throw new Error(`Failed to fetch snippets: ${error.message}`);
    }
    
    // Sync cloud to local
    for (const cloudSnippet of cloudSnippets) {
      const localSnippet = localSnippets.find(s => s.id === cloudSnippet.id);
      
      if (!localSnippet || new Date(localSnippet.updated_at) < new Date(cloudSnippet.updated_at)) {
        // Cloud snippet is newer or doesn't exist locally
        if (!localSnippet) {
          snippetManager.addSnippet({
            title: cloudSnippet.title,
            description: cloudSnippet.description,
            code: cloudSnippet.code,
            language: cloudSnippet.language,
            tags: cloudSnippet.tags
          });
        } else {
          snippetManager.updateSnippet(cloudSnippet.id, {
            title: cloudSnippet.title,
            description: cloudSnippet.description,
            code: cloudSnippet.code,
            language: cloudSnippet.language,
            tags: cloudSnippet.tags
          });
        }
      }
    }
    
    // Sync local to cloud
    for (const localSnippet of localSnippets) {
      const cloudSnippet = cloudSnippets.find((s: Snippet)=> s.id === localSnippet.id);
      
      if (!cloudSnippet || new Date(cloudSnippet.updated_at) < new Date(localSnippet.updated_at)) {
        // Local snippet is newer or doesn't exist in cloud
        const { error } = await this.client
          .from('snippets')
          .upsert({
            id: localSnippet.id,
            title: localSnippet.title,
            description: localSnippet.description,
            code: localSnippet.code,
            language: localSnippet.language,
            tags: localSnippet.tags,
            user_id: user.id,
            created_at: localSnippet.created_at,
            updated_at: localSnippet.updated_at
          });
          
        if (error) {
          console.error(`Failed to sync snippet ${localSnippet.id}:`, error);
        }
      }
    }
  }
  
  public async signIn(email: string, password: string): Promise<void> {
    if (!this.client) {
      throw new Error('Supabase client not initialized');
    }
    
    const { error } = await this.client.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }
  
  public async signOut(): Promise<void> {
    if (!this.client) {
      return;
    }
    
    await this.client.auth.signOut();
  }
}