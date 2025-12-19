
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI } from "@google/genai";
import { KnowledgeBase, ChatMessage } from '../types';

// Use any for process to avoid type pollution in shared compilation contexts
declare const process: any;

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

const isNativeBinary = (mime: string) => {
    const supported = [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/webp',
        'image/heic',
        'image/heif'
    ];
    return supported.includes(mime) || mime.startsWith('image/');
};

export async function askRAG(
    kb: KnowledgeBase, 
    query: string, 
    history: ChatMessage[],
    lang: 'EN' | 'AR'
): Promise<{ text: string; modelUsed: string; inputTokens: number; outputTokens: number }> {
    const ai = getClient();
    
    const docParts = kb.files.map(f => {
        if (f.data && isNativeBinary(f.mimeType)) {
            return {
                inlineData: {
                    data: f.data,
                    mimeType: f.mimeType
                }
            };
        }
        
        const textContent = f.content || `[Binary File metadata: ${f.name}]`;
        const wrapType = f.name.endsWith('.csv') ? 'CSV DATA' : 'DOCUMENT';
        
        return { 
            text: `--- ${wrapType} START: ${f.name} ---\n${textContent}\n--- ${wrapType} END ---\n` 
        };
    });

    const isArabicRequest = lang === 'AR' || /[\u0600-\u06FF]/.test(query);

    // Use systemInstruction in config as per @google/genai guidelines
    const systemInstruction = `
        You are a highly advanced Enterprise Document Intelligence Engine.
        Context: You have access to ${kb.files.length} document parts from database "${kb.name}".
        
        CRITICAL MANDATORY RULES:
        1. LANGUAGE ENFORCEMENT: ${isArabicRequest 
            ? "The user is asking in ARABIC. You MUST respond in professional, native ARABIC only. Translate technical info from the documents into Arabic."
            : "The user is asking in ENGLISH. Respond in professional ENGLISH."
        }
        2. SOURCE LANGUAGE: Even if the source documents are in English, you must translate relevant info into the response language (${isArabicRequest ? 'Arabic' : 'English'}).
        3. CITATIONS: Append [Source: Filename] at the end of every sentence containing factual data.
        4. ACCURACY: Answer ONLY based on the documents.
        5. FORMATTING: Use markdown for tables and bold terms.
    `;

    // Attempt preferred model first, then fall back to defaults for robustness
    const modelAttempts = kb.preferredModel ? [kb.preferredModel, ...MODELS.filter(m => m !== kb.preferredModel)] : MODELS;

    for (const modelName of modelAttempts) {
        try {
            // Updated thinking budget logic: Thinking Config is only for Gemini 3 and 2.5 series
            const isThinkingSupported = modelName.includes('gemini-3') || modelName.includes('gemini-2.5');
            const thinkingConfig = isThinkingSupported ? { 
                thinkingBudget: modelName.includes('pro') ? 32768 : 24576 
            } : undefined;

            const response = await ai.models.generateContent({
                model: modelName,
                contents: [
                    { 
                        role: 'user', 
                        parts: [
                            ...docParts,
                            ...history.slice(-6).map(h => ({ 
                                text: `${h.role === 'user' ? 'Previous Question' : 'Previous Answer'}: ${h.text}` 
                            })),
                            { text: `Current User Query: ${query}` }
                        ] 
                    }
                ],
                config: {
                    systemInstruction,
                    temperature: 0.1,
                    thinkingConfig
                }
            });

            // Access .text property directly (not a method)
            const text = response.text || "";
            
            // Estimating tokens
            const docLength = kb.files.reduce((acc, f) => acc + (f.content?.length || 5000), 0);
            const inTokens = Math.floor((systemInstruction.length + query.length + docLength) / 4);
            const outTokens = Math.floor(text.length / 4);

            return {
                text,
                modelUsed: modelName,
                inputTokens: inTokens,
                outputTokens: outTokens
            };
        } catch (error: any) {
            console.error(`Error with model ${modelName}:`, error);
            if (modelName === modelAttempts[modelAttempts.length - 1]) throw error;
        }
    }
    
    throw new Error("Analysis failed.");
}