
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect } from 'react';
import { KnowledgeBase, ChatMessage, Language, ApiStatus } from '../types';
import * as geminiService from '../services/geminiService';

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
    const [copyStatus, setCopyStatus] = useState<string | null>(null);
    const endRef = useRef<HTMLDivElement>(null);

    const activeDb = databases.find(db => db.id === activeDbId);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopyStatus(id);
        setTimeout(() => setCopyStatus(null), 2000);
    };

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
                kbName: activeDb.name,
                tokens: { input: inputTokens, output: outputTokens },
                citations,
                timestamp: Date.now()
            };

            setMessages(prev => [...prev, modelMsg]);
        } catch (error: any) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: lang === 'AR' ? `عذراً، حدث خطأ أثناء التحليل. يرجى المحاولة لاحقاً.` : `Sorry, an error occurred during analysis. Please try again later.`,
                citations: [],
                timestamp: Date.now()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50 w-full overflow-hidden">
            {/* Header / Selector */}
            <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 shrink-0 shadow-sm z-10">
                <div className="flex items-center flex-1 min-w-0">
                    <div className="relative w-full max-w-[280px]">
                        <select 
                            value={activeDbId || ''} 
                            onChange={(e) => setActiveDbId(e.target.value)}
                            className={`w-full bg-slate-100 border-none rounded-2xl pl-4 pr-10 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer appearance-none truncate ${lang === 'AR' ? 'text-right' : 'text-left'}`}
                        >
                            <option value="" disabled>{lang === 'AR' ? 'اختر قاعدة المعرفة' : 'Select Knowledge Base'}</option>
                            {databases.map(db => (
                                <option key={db.id} value={db.id}>{db.name}</option>
                            ))}
                        </select>
                        <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 ${lang === 'AR' ? 'left-4' : 'right-4'}`}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>

                {activeDb && (
                    <div className="hidden sm:flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200">
                           {lang === 'AR' ? 'وضع التحليل نشط' : 'REASONING MODE ACTIVE'}
                        </div>
                    </div>
                )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 custom-scrollbar scroll-smooth">
                <div className="max-w-4xl mx-auto space-y-10">
                    {messages.length === 0 && !isTyping ? (
                        <div className="flex flex-col items-center justify-center pt-20 text-center space-y-6">
                            <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-blue-600">
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-800">{lang === 'AR' ? 'كيف يمكنني مساعدتك اليوم؟' : 'How can I help you today?'}</h2>
                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">{lang === 'AR' ? 'اطرح سؤالاً حول مستنداتك' : 'Ask anything about your documents'}</p>
                            </div>
                        </div>
                    ) : (
                        messages.map((m) => (
                            <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-slide-up w-full`}>
                                <div 
                                    className={`relative group w-full max-w-[95%] md:max-w-[85%] px-6 py-5 rounded-[2rem] shadow-sm border flex flex-col ${
                                        m.role === 'user' 
                                        ? 'bg-slate-900 text-white border-slate-800 rounded-tr-none' 
                                        : 'bg-white text-slate-800 border-gray-100 rounded-tl-none'
                                    }`}
                                    dir="auto"
                                >
                                    {/* Top Metadata Row */}
                                    {m.role === 'model' && (
                                        <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-2">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <div className="bg-blue-50 text-blue-600 p-1 rounded-lg shrink-0">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8-4" /></svg>
                                                </div>
                                                <span className="text-[9px] font-black uppercase text-slate-400 truncate tracking-tight">
                                                    {lang === 'AR' ? 'المصدر:' : 'SOURCE:'} {m.kbName || activeDb?.name}
                                                </span>
                                            </div>
                                            <button 
                                                onClick={() => handleCopy(m.text, m.id)}
                                                className="p-1 rounded hover:bg-slate-50 text-slate-300 hover:text-blue-600 transition-all shrink-0"
                                            >
                                                {copyStatus === m.id ? (
                                                    <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                ) : (
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3" /></svg>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {/* Main Content Text */}
                                    <div className="text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium text-auto">
                                        {m.text}
                                    </div>

                                    {/* Bottom Data Row */}
                                    {m.role === 'model' && (
                                        <div className="mt-4 pt-3 border-t border-slate-50 flex flex-col gap-3">
                                            {m.citations.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {m.citations.map(c => (
                                                        <span key={c} className="bg-slate-50 text-slate-400 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-tight border border-slate-100">
                                                            {lang === 'AR' ? 'مستند:' : 'DOC:'} {c}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between">
                                                <div className="flex gap-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-[7px] text-slate-300 font-black uppercase tracking-widest">{lang === 'AR' ? 'الرموز' : 'TOKENS'}</span>
                                                        <span className="text-[9px] font-bold text-slate-400">IN: {m.tokens?.input || 0} | OUT: {m.tokens?.output || 0}</span>
                                                    </div>
                                                </div>

                                                <button 
                                                    onClick={() => handleCopy(m.text, m.id)}
                                                    className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 px-3 py-1.5 rounded-xl transition-all group shadow-sm active:scale-95"
                                                >
                                                    <span className="text-[9px] font-black uppercase tracking-widest">
                                                        {copyStatus === m.id ? (lang === 'AR' ? 'تم النسخ' : 'COPIED') : (lang === 'AR' ? 'نسخ النص' : 'COPY TEXT')}
                                                    </span>
                                                    {copyStatus !== m.id && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className={`mt-1.5 px-4 text-[8px] font-black text-slate-300 uppercase tracking-widest ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        ))
                    )}
                    
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-blue-50 px-6 py-4 rounded-[2rem] rounded-tl-none flex items-center gap-3 shadow-sm">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                                </div>
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest animate-pulse">
                                    {lang === 'AR' ? 'جاري التحليل المنطقي...' : 'Analyzing content...'}
                                </span>
                            </div>
                        </div>
                    )}
                    <div ref={endRef} className="h-10" />
                </div>
            </div>

            {/* Input Form */}
            <div className="px-4 md:px-8 pb-6 pt-4 bg-white border-t border-gray-100 shadow-lg">
                <form onSubmit={handleSend} className="max-w-4xl mx-auto relative group">
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={lang === 'AR' ? 'اطرح سؤالاً عن المستندات...' : 'Ask a question about documents...'}
                        disabled={!activeDbId || isTyping}
                        className={`w-full bg-slate-100 border-2 border-transparent rounded-[2rem] py-4 px-8 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:bg-white transition-all text-slate-800 font-bold placeholder:text-slate-300 text-sm md:text-base ${lang === 'AR' ? 'text-right' : 'text-left'}`}
                        dir="auto"
                    />
                    <button 
                        type="submit" 
                        disabled={!query.trim() || isTyping || !activeDbId}
                        className={`absolute top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:scale-105 active:scale-95 disabled:bg-slate-300 transition-all ${lang === 'AR' ? 'left-2.5' : 'right-2.5'}`}
                    >
                        <svg className={`w-5 h-5 ${lang === 'AR' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M14 5l7 7-7 7M5 12h14" /></svg>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatInterface;
