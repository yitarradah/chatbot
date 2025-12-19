
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI } from "@google/genai";
import { KnowledgeBase, ChatMessage } from '../types';

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
        You are an advanced Technical Support Specialist with deep reasoning capabilities.
        Target Language: ${lang === 'AR' ? 'Arabic' : 'English'}.
        
        DATA SOURCE:
        ${context}
        
        TASK:
        1. Analyze the provided documents to answer the user's query.
        2. Use your reasoning budget to cross-reference multiple parts of the documents if necessary.
        3. STRICT: If information is missing, state that clearly in ${lang}.
        4. CITATION: Always end relevant sentences with [Source: filename.ext].
        5. FORMATTING: Use Markdown headers and bullet points for readability.
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
                    temperature: 0.2,
                    // Enable high-performance reasoning
                    thinkingConfig: { 
                        thinkingBudget: modelName.includes('pro') ? 32768 : 24576 
                    }
                }
            });

            // Estimated tokens based on response metadata if available, otherwise fallback
            const inTokens = Math.floor((systemInstruction.length + query.length) / 4);
            const outTokens = Math.floor((response.text?.length || 0) / 4);

            return {
                text: response.text || "",
                modelUsed: modelName,
                inputTokens: inTokens,
                outputTokens: outTokens
            };
        } catch (error: any) {
            if (error?.status === 429 && modelName !== MODELS[MODELS.length - 1]) {
                continue;
            }
            throw error;
        }
    }
    
    throw new Error("Reasoning engine failed to initialize.");
}
