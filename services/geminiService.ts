
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI } from "@google/genai";
import { KnowledgeBase, ChatMessage } from '../types';

declare const process: {
    env: {
        API_KEY: string;
    };
};

const MODELS = [
    'gemini-3-flash-preview',
    'gemini-3-pro-preview'
];

function getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export async function checkConnectivity(): Promise<boolean> {
    try {
        const ai = getClient();
        await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: 'ping',
        });
        return true;
    } catch (e) {
        return false;
    }
}

export async function askRAG(
    kb: KnowledgeBase, 
    query: string, 
    history: ChatMessage[],
    lang: 'EN' | 'AR'
): Promise<{ text: string; modelUsed: string; inputTokens: number; outputTokens: number }> {
    const ai = getClient();
    
    // Construct optimized context for Gemini 3's large context window
    const context = kb.files.map(f => `--- DOCUMENT: ${f.name} ---\n${f.content}`).join('\n\n');
    
    const systemInstruction = `
        You are an elite Technical Support Engineer and Document Analyst.
        Target Language: ${lang === 'AR' ? 'Arabic' : 'English'}.
        
        CONTEXT DATA:
        ${context}
        
        INSTRUCTIONS:
        1. Base your answer ONLY on the provided documents.
        2. If the answer is not in the documents, state that you cannot find it in the specific manuals provided.
        3. Use Markdown for formatting (bolding, lists, headers).
        4. CITATION RULE: Whenever you state a fact from a file, append [Source: filename] at the end of the sentence.
        5. TONE: Professional, helpful, and concise.
    `;

    // Hierarchy fallback with Thinking Budget
    for (const modelName of MODELS) {
        try {
            const response = await ai.models.generateContent({
                model: modelName,
                contents: [
                    ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
                    { role: 'user', parts: [{ text: query }] }
                ],
                config: {
                    systemInstruction,
                    temperature: 0.1, // Low temperature for high factual accuracy
                    thinkingConfig: { 
                        thinkingBudget: modelName.includes('pro') ? 32768 : 24576 
                    }
                }
            });

            // Estimated tokens
            const inTokens = Math.floor((systemInstruction.length + query.length) / 4);
            const outTokens = Math.floor((response.text?.length || 0) / 4);

            return {
                text: response.text || "",
                modelUsed: modelName,
                inputTokens: inTokens,
                outputTokens: outTokens
            };
        } catch (error: any) {
            // If rate limited, try next model
            if (error?.status === 429 && modelName !== MODELS[MODELS.length - 1]) {
                continue;
            }
            throw error;
        }
    }
    
    throw new Error("Analysis engine failed to initialize.");
}
