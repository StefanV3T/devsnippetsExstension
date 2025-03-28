import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';

export interface Snippet {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export class SnippetManager {
  private storage: vscode.Memento;
  private static readonly STORAGE_KEY = 'devsnippet.snippets';
  
  constructor(storage: vscode.Memento) {
    this.storage = storage;
  }
  
  public getAllSnippets(): Snippet[] {
    return this.storage.get<Snippet[]>(SnippetManager.STORAGE_KEY, []);
  }
  
  public getSnippets(): Snippet[] {
    return this.getAllSnippets();
  }
  
  public getSnippet(id: string): Snippet | undefined {
    const snippets = this.getAllSnippets();
    return snippets.find(snippet => snippet.id === id);
  }
  
  public addSnippet(snippet: Omit<Snippet, 'id' | 'created_at' | 'updated_at'>): Snippet {
    const snippets = this.getAllSnippets();
    const timestamp = new Date().toISOString();
    
    const newSnippet: Snippet = {
      id: uuidv4(),
      ...snippet,
      created_at: timestamp,
      updated_at: timestamp
    };
    
    this.storage.update(SnippetManager.STORAGE_KEY, [...snippets, newSnippet]);
    return newSnippet;
  }
  
  public updateSnippet(id: string, updatedSnippet: Partial<Omit<Snippet, 'id' | 'created_at'>>): Snippet | undefined {
    const snippets = this.getAllSnippets();
    const index = snippets.findIndex(snippet => snippet.id === id);
    
    if (index !== -1) {
      const timestamp = new Date().toISOString();
      
      snippets[index] = {
        ...snippets[index],
        ...updatedSnippet,
        updated_at: timestamp
      };
      
      this.storage.update(SnippetManager.STORAGE_KEY, snippets);
      return snippets[index];
    }
    
    return undefined;
  }
  
  public deleteSnippet(id: string): boolean {
    const snippets = this.getAllSnippets();
    const filteredSnippets = snippets.filter(snippet => snippet.id !== id);
    
    if (filteredSnippets.length < snippets.length) {
      this.storage.update(SnippetManager.STORAGE_KEY, filteredSnippets);
      return true;
    }
    
    return false;
  }
  
  public searchSnippets(query: string): Snippet[] {
    const snippets = this.getAllSnippets();
    const lowerQuery = query.toLowerCase();
    
    return snippets.filter(snippet => 
      snippet.title.toLowerCase().includes(lowerQuery) ||
      snippet.description.toLowerCase().includes(lowerQuery) ||
      snippet.code.toLowerCase().includes(lowerQuery) ||
      snippet.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }
  
  public getSnippetsByTag(tag: string): Snippet[] {
    const snippets = this.getAllSnippets();
    return snippets.filter(snippet => snippet.tags.includes(tag));
  }
  
  public getAllTags(): string[] {
    const snippets = this.getAllSnippets();
    const tagSet = new Set<string>();
    
    snippets.forEach(snippet => {
      snippet.tags.forEach(tag => tagSet.add(tag));
    });
    
    return Array.from(tagSet);
  }
  
  public importSnippets(snippets: Snippet[]): void {
    this.storage.update(SnippetManager.STORAGE_KEY, snippets);
  }
}