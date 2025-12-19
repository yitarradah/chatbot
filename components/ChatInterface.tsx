
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
            {/* Header / Store Selector */}
            <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 shrink-0 shadow-sm z-10">
                <div className="flex items-center flex-1 min-w-0">
                    <div className="relative w-full max-w-[280px]">
                        <select 
                            value={activeDbId || ''} 
                            onChange={(e) => setActiveDbId(e.target.value)}
                            className="w-full bg-slate-100 border-none rounded-2xl pl-4 pr-10 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer appearance-none truncate"
                        >
                            <option value="" disabled>{lang === 'AR' ? 'اختر قاعدة المعرفة' : 'Select Knowledge Base'}</option>
                            {databases.map(db => (
                                <option key={db.id} value={db.id}>{db.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
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

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 custom-scrollbar scroll-smooth">
                <div className="max-w-4xl mx-auto space-y-8">
                    {!activeDbId ? (
                        <div className="flex flex-col items-center justify-center pt-20 text-center space-y-6">
                            <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-blue-600 animate-pulse">
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-800">{lang === 'AR' ? 'مساعدك الذكي للمستندات' : 'Your Smart Manual Assistant'}</h2>
                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">{lang === 'AR' ? 'اختر ملفاتك من القائمة أعلاه للبدء' : 'Select your documents from the list above to start'}</p>
                            </div>
                        </div>
                    ) : (
                        messages.map((m) => (
                            <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-slide-up`}>
                                <div className={`max-w-[85%] md:max-w-[75%] px-6 py-4 rounded-[2rem] shadow-sm ${
                                    m.role === 'user' 
                                    ? 'bg-slate-900 text-white rounded-tr-none' 
                                    : 'bg-white text-slate-800 border border-gray-100 rounded-tl-none'
                                }`}>
                                    <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium">
                                        {m.text}
                                    </p>

                                    {m.role === 'model' && m.citations.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-slate-50 flex flex-wrap gap-2">
                                            {m.citations.map(c => (
                                                <span key={c} className="bg-slate-100 text-slate-500 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                                                    DOC: {c}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-2 px-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        ))
                    )}
                    
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-blue-100 px-6 py-4 rounded-[2rem] rounded-tl-none flex items-center space-x-3 rtl:space-x-reverse shadow-md">
                                <div className="flex space-x-1 rtl:space-x-reverse items-center">
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                                </div>
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                    {lang === 'AR' ? 'جاري التحليل المنطقي...' : 'Thinking & Analyzing...'}
                                </span>
                            </div>
                        </div>
                    )}
                    <div ref={endRef} className="h-10" />
                </div>
            </div>

            {/* Input Form */}
            <div className="px-4 md:px-8 pb-8 pt-4 bg-white/80 backdrop-blur-md border-t border-gray-100">
                <form onSubmit={handleSend} className="max-w-4xl mx-auto relative group">
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={lang === 'AR' ? 'اطرح سؤالاً عن المستندات...' : 'Ask a question about the manuals...'}
                        disabled={!activeDbId || isTyping}
                        className="w-full bg-slate-100 border-2 border-transparent rounded-[2.5rem] py-4 px-8 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:bg-white transition-all text-slate-800 font-bold placeholder:text-slate-300 text-sm md:text-base pr-16 rtl:pr-8 rtl:pl-16 shadow-sm"
                    />
                    <button 
                        type="submit" 
                        disabled={!query.trim() || isTyping || !activeDbId}
                        className={`absolute top-1/2 -translate-y-1/2 p-3 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none transition-all ${lang === 'AR' ? 'left-2.5' : 'right-2.5'}`}
                    >
                        <svg className={`w-5 h-5 ${lang === 'AR' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M14 5l7 7-7 7M5 12h14" /></svg>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatInterface;
