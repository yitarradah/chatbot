
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect } from 'react';
import { KnowledgeBase, ChatMessage, Language, ApiStatus } from '../types';
import * as geminiService from '../services/geminiService';
import Spinner from './Spinner';

interface ChatInterfaceProps {
    databases: KnowledgeBase[];
    activeDbId: string | null;
    setActiveDbId: (id: string) => void;
    lang: Language;
    apiStatus: ApiStatus;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ databases, activeDbId, setActiveDbId, lang, apiStatus }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [query, setQuery] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    const activeDb = databases.find(db => db.id === activeDbId);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim() || !activeDb || isTyping) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: query,
            citations: [],
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setQuery('');
        setIsTyping(true);

        try {
            const { text, modelUsed, inputTokens, outputTokens } = await geminiService.askRAG(activeDb, query, messages, lang);
            
            // Citation Parsing
            const citations: string[] = [];
            const citationRegex = /\[Source:\s*(.*?)\]/g;
            let match;
            while ((match = citationRegex.exec(text)) !== null) {
                if (!citations.includes(match[1])) citations.push(match[1]);
            }

            const modelMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: text, 
                modelName: modelUsed,
                tokens: { input: inputTokens, output: outputTokens },
                citations,
                timestamp: Date.now()
            };

            setMessages(prev => [...prev, modelMsg]);
        } catch (error: any) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: lang === 'AR' ? `حدث خطأ: ${error.message}` : `Error: ${error.message}`,
                citations: [],
                timestamp: Date.now()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const copyResponsePair = (modelMessage: ChatMessage) => {
        const index = messages.findIndex(m => m.id === modelMessage.id);
        if (index === -1) return;
        
        let questionText = "";
        for (let i = index - 1; i >= 0; i--) {
            if (messages[i].role === 'user') {
                questionText = messages[i].text;
                break;
            }
        }

        const fullText = `${lang === 'AR' ? 'السؤال' : 'Question'}: ${questionText}\n\n${lang === 'AR' ? 'الإجابة' : 'Answer'}: ${modelMessage.text}`;
        navigator.clipboard.writeText(fullText);
        
        // Brief feedback
        const notification = document.createElement('div');
        notification.innerText = lang === 'AR' ? 'تم نسخ السؤال والإجابة' : 'Copied Q&A pair';
        notification.className = "fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold animate-fade-in z-[100]";
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    };

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] w-full max-w-full overflow-hidden">
            {/* Top Bar */}
            <div className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 shrink-0">
                <div className="flex items-center flex-1 min-w-0">
                    <div className="relative group w-full max-w-[200px] md:max-w-[280px]">
                        <select 
                            value={activeDbId || ''} 
                            onChange={(e) => setActiveDbId(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 text-xs md:text-sm font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer truncate"
                        >
                            <option value="" disabled>{lang === 'AR' ? 'اختر قاعدة المعرفة' : 'Select Knowledge Base'}</option>
                            {databases.map(db => (
                                <option key={db.id} value={db.id}>{db.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4" /></svg>
                        </div>
                    </div>
                </div>

                {activeDb && (
                    <div className="flex items-center space-x-3 md:space-x-6 rtl:space-x-reverse text-[10px] md:text-xs font-bold text-slate-400 uppercase shrink-0">
                        <div className="hidden sm:flex items-center space-x-1.5 rtl:space-x-reverse">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            <span>{activeDb.files.length}</span>
                        </div>
                        <div className="bg-blue-50 text-blue-600 px-2 md:px-3 py-1 rounded-md border border-blue-100 flex items-center space-x-1 md:space-x-1.5">
                            <svg className="w-3 md:w-3.5 h-3 md:h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M11 2v20c-5.07 0-9.22-3.8-9.92-8.74L1 13.02V10.98l.08-.24C1.78 5.8 5.93 2 11 2zm2 0c5.07 0 9.22 3.8 9.92 8.74l.08.24v2.04l-.08.24C22.22 18.2 18.07 22 13 22V2z" /></svg>
                            <span className="tracking-widest hidden xs:inline uppercase">{activeDb.preferredModel.split('-')[0]}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 md:py-10 custom-scrollbar w-full">
                <div className="max-w-4xl mx-auto space-y-8">
                    {!activeDbId ? (
                        <div className="flex flex-col items-center justify-center pt-20 text-slate-200">
                            <div className="p-8 bg-white rounded-full border border-slate-100 shadow-sm mb-6">
                                <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            </div>
                            <p className="text-xl font-black uppercase tracking-[0.2em] text-slate-300">
                                {lang === 'AR' ? 'اختر قاعدة معرفة للبدء' : 'Select Knowledge Base'}
                            </p>
                        </div>
                    ) : (
                        messages.map((m) => (
                            <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-slide-up w-full`}>
                                <div className={`relative px-5 md:px-7 py-4 md:py-5 rounded-2xl md:rounded-[2rem] shadow-sm max-w-[95%] sm:max-w-[85%] md:max-w-[75%] ${
                                    m.role === 'user' 
                                    ? 'bg-[#0f172a] text-white rounded-tr-none' 
                                    : 'bg-white text-slate-800 border border-gray-100 rounded-tl-none ring-1 ring-gray-100/50'
                                }`}>
                                    <p className={`text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium ${lang === 'AR' ? 'text-right' : 'text-left'}`}>
                                        {m.text}
                                    </p>

                                    {m.role === 'model' && (
                                        <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col space-y-3">
                                            {m.citations.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {m.citations.map(c => (
                                                        <span key={c} className="bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1 rounded text-[10px] font-bold">
                                                            {c}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center justify-between rtl:flex-row-reverse">
                                                <div className="flex items-center space-x-2 rtl:space-x-reverse text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                                    <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 truncate">{m.modelName?.replace('gemini-', '')}</span>
                                                    <span>{m.tokens?.input}/{m.tokens?.output} toks</span>
                                                </div>
                                                <button 
                                                    onClick={() => copyResponsePair(m)}
                                                    className="flex items-center space-x-1.5 p-1.5 text-slate-300 hover:text-blue-500 transition-all rounded-lg hover:bg-blue-50"
                                                    title={lang === 'AR' ? 'نسخ السؤال والإجابة' : 'Copy Question & Answer'}
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                                    <span className="text-[10px] font-bold hidden sm:inline uppercase">{lang === 'AR' ? 'نسخ' : 'COPY'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className={`mt-2 px-3 text-[9px] font-bold text-slate-300 uppercase tracking-widest ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        ))
                    )}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-100 px-6 py-4 rounded-2xl rounded-tl-none flex items-center space-x-3 shadow-sm rtl:space-x-reverse">
                                <Spinner />
                                <span className="text-xs font-black text-blue-500 uppercase tracking-widest animate-pulse">
                                    {lang === 'AR' ? 'جاري فحص قاعدة المعرفة...' : 'Consulting documents...'}
                                </span>
                            </div>
                        </div>
                    )}
                    <div ref={endRef} className="h-6" />
                </div>
            </div>

            {/* Input */}
            <div className="px-4 md:px-8 py-6 bg-white border-t border-gray-100">
                <div className="max-w-5xl mx-auto flex items-center space-x-2 md:space-x-4 rtl:space-x-reverse">
                    <button 
                        onClick={() => { if(confirm(lang === 'AR' ? 'حذف المحادثة؟' : 'Clear chat history?')) setMessages([])}} 
                        className="p-3.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent shrink-0"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </button>
                    <form onSubmit={handleSend} className="flex-1 relative flex items-center min-w-0">
                        <input 
                            type="text" 
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={lang === 'AR' ? 'اكتب استفسارك هنا...' : 'Ask a question about your files...'}
                            disabled={!activeDbId || isTyping}
                            className={`w-full bg-[#f8fafc] border border-slate-200 rounded-2xl py-4 md:py-5 px-6 md:px-8 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-slate-800 font-bold placeholder:text-slate-300 text-sm md:text-lg ${lang === 'AR' ? 'text-right pl-16' : 'text-left pr-16'}`}
                        />
                        <button 
                            type="submit" 
                            disabled={!query.trim() || isTyping || !activeDbId}
                            className={`absolute top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 disabled:bg-slate-200 disabled:shadow-none transition-all active:scale-95 ${lang === 'AR' ? 'left-3' : 'right-3'}`}
                        >
                            <svg className={`w-6 h-6 ${lang === 'AR' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path d="M13 5l7 7-7 7" />
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
