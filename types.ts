
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export type Language = 'EN' | 'AR';

export interface StoredFile {
    id: string;
    name: string;
    content?: string;   // For text-based files (CSV, TXT, MD)
    data?: string;      // Base64 for binary files (PDF, Images)
    mimeType: string;
    size: number;
    uploadedAt: string;
}

export interface KnowledgeBase {
    id: string;
    name: string;
    description?: string;
    files: StoredFile[];
    preferredModel: string;
}

export interface AdminUser {
    id: string;
    username: string;
    password: string;
    email?: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    modelName?: string;
    kbName?: string; // Tracks which database provided the answer
    tokens?: { input: number; output: number };
    citations: string[];
    timestamp: number;
}

export enum AppView {
    Login,
    Chat,
    Admin
}

export enum ApiStatus {
    Functional = 'Functional',
    QuotaExceeded = 'Quota Exceeded',
    Disrupted = 'Service Disrupted',
    Checking = 'Checking...'
}

export interface SystemConfig {
    systemName: string;
    defaultKbId: string | null;
    admins: AdminUser[];
}

export interface CustomMetadata {
    key: string;
    stringValue: string;
}

export interface Document {
    name: string;
    displayName: string;
    customMetadata?: CustomMetadata[];
}

export interface RagStore {
    name: string;
    displayName: string;
}

export interface QueryResult {
    text: string;
    groundingChunks: Array<{
        retrievedContext?: {
            text: string;
        }
    }>;
}
