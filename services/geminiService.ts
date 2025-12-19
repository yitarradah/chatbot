
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI } from "@google/genai";
import { KnowledgeBase, ChatMessage } from '../types';

const MODELS = [
    'gemini-flash-lite-latest',
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
            model: 'gemini-flash-lite-latest',
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
    
    // Construct context
    const context = kb.files.map(f => `Filename: ${f.name}\nContent: ${f.content}`).join('\n\n---\n\n');
    
    const systemInstruction = `
        You are a high-performance Enterprise RAG (Retrieval-Augmented Generation) assistant. 
        Target Language: ${lang === 'AR' ? 'Arabic' : 'English'}.
        
        PRIVATE KNOWLEDGE BASE: "${kb.name}"
        CONTEXT FOR THIS SESSION:
        ${context}
        
        STRICT RULES:
        1. Only answer based on the provided context.
        2. If the answer is found in the context, you MUST append "[Source: filename.ext]" at the end of the relevant sentence.
        3. If the information is NOT in the context, you must respond with:
           EN: "The requested information is not available in the current knowledge base."
           AR: "المعلومات المطلوبة غير متوفرة في قاعدة المعرفة الحالية."
           (Provide the response in the target language: ${lang}).
        4. Maintain a professional tone. Use Markdown for formatting (bold, lists).
    `;

    // Attempt hierarchy fallback
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
                    temperature: 0.1,
                }
            });

            // Token estimations
            const inTokens = Math.floor((systemInstruction.length + query.length + JSON.stringify(history).length) / 3.8);
            const outTokens = Math.floor((response.text?.length || 0) / 3.8);

            return {
                text: response.text || "",
                modelUsed: modelName,
                inputTokens: inTokens,
                outputTokens: outTokens
            };
        } catch (error: any) {
            // If it's a quota error (429), try next model. If it's the last model, throw.
            if (error?.status === 429 && modelName !== MODELS[MODELS.length - 1]) {
                continue;
            }
            throw error;
        }
    }
    
    throw new Error("Enterprise model fallback chain exhausted.");
}
