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
exports.SupabaseClient = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const vscode = __importStar(require("vscode"));
class SupabaseClient {
    client;
    constructor() {
        const config = vscode.workspace.getConfiguration('devsnippet');
        const url = config.get('cloudUrl');
        const key = config.get('supabaseKey');
        if (url && key) {
            this.client = (0, supabase_js_1.createClient)(url, key);
        }
    }
    async sync(snippetManager) {
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
                }
                else {
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
            const cloudSnippet = cloudSnippets.find((s) => s.id === localSnippet.id);
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
    async signIn(email, password) {
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
    async signOut() {
        if (!this.client) {
            return;
        }
        await this.client.auth.signOut();
    }
}
exports.SupabaseClient = SupabaseClient;
//# sourceMappingURL=supabaseClient.js.map