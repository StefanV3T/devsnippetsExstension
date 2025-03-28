"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnippetManager = void 0;
const uuid_1 = require("uuid");
class SnippetManager {
    storage;
    static STORAGE_KEY = 'devsnippet.snippets';
    constructor(storage) {
        this.storage = storage;
    }
    getAllSnippets() {
        return this.storage.get(SnippetManager.STORAGE_KEY, []);
    }
    getSnippets() {
        return this.getAllSnippets();
    }
    getSnippet(id) {
        const snippets = this.getAllSnippets();
        return snippets.find(snippet => snippet.id === id);
    }
    addSnippet(snippet) {
        const snippets = this.getAllSnippets();
        const timestamp = new Date().toISOString();
        const newSnippet = {
            id: (0, uuid_1.v4)(),
            ...snippet,
            created_at: timestamp,
            updated_at: timestamp
        };
        this.storage.update(SnippetManager.STORAGE_KEY, [...snippets, newSnippet]);
        return newSnippet;
    }
    updateSnippet(id, updatedSnippet) {
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
    deleteSnippet(id) {
        const snippets = this.getAllSnippets();
        const filteredSnippets = snippets.filter(snippet => snippet.id !== id);
        if (filteredSnippets.length < snippets.length) {
            this.storage.update(SnippetManager.STORAGE_KEY, filteredSnippets);
            return true;
        }
        return false;
    }
    searchSnippets(query) {
        const snippets = this.getAllSnippets();
        const lowerQuery = query.toLowerCase();
        return snippets.filter(snippet => snippet.title.toLowerCase().includes(lowerQuery) ||
            snippet.description.toLowerCase().includes(lowerQuery) ||
            snippet.code.toLowerCase().includes(lowerQuery) ||
            snippet.tags.some(tag => tag.toLowerCase().includes(lowerQuery)));
    }
    getSnippetsByTag(tag) {
        const snippets = this.getAllSnippets();
        return snippets.filter(snippet => snippet.tags.includes(tag));
    }
    getAllTags() {
        const snippets = this.getAllSnippets();
        const tagSet = new Set();
        snippets.forEach(snippet => {
            snippet.tags.forEach(tag => tagSet.add(tag));
        });
        return Array.from(tagSet);
    }
    importSnippets(snippets) {
        this.storage.update(SnippetManager.STORAGE_KEY, snippets);
    }
}
exports.SnippetManager = SnippetManager;
//# sourceMappingURL=snippetManager.js.map