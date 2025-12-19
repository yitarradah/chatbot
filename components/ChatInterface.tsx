
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
                text: lang === 'AR' ? `خطأ: يرجى التحقق من اتصال الإنترنت أو مفتاح API.` : `Error: Please check your connection or API key.`,
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
        
        const notification = document.createElement('div');
        notification.innerText = lang === 'AR' ? 'تم النسخ' : 'Copied';
        notification.className = "fixed bottom-24 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-full text-xs font-bold animate-fade-in z-[100] shadow-lg";
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    };

    return (
        <div className="flex flex-col h-full bg-[#fcfdfe] w-full max-w-full overflow-hidden">
            {/* Context Header */}
            <div className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 shrink-0 shadow-sm z-10">
                <div className="flex items-center flex-1 min-w-0">
                    <div className="relative group w-full max-w-[200px] md:max-w-[320px]">
                        <select 
                            value={activeDbId || ''} 
                            onChange={(e) => setActiveDbId(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-3 pr-8 py-2 text-xs md:text-sm font-bold text-slate-800 appearance-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer truncate shadow-sm"
                        >
                            <option value="" disabled>{lang === 'AR' ? 'اختر المستندات' : 'Select Documents'}</option>
                            {databases.map(db => (
                                <option key={db.id} value={db.id}>{db.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>

                {activeDb && (
                    <div className="flex items-center space-x-2 md:space-x-4 rtl:space-x-reverse shrink-0">
                        <div className="hidden sm:flex bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
                           {activeDb.files.length} FILES
                        </div>
                        <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md shadow-blue-100">
                           REASONING ON
                        </div>
                    </div>
                )}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 md:py-10 custom-scrollbar w-full scroll-smooth">
                <div className="max-w-4xl mx-auto space-y-10">
                    {!activeDbId ? (
                        <div className="flex flex-col items-center justify-center pt-24 text-center">
                            <div className="w-24 h-24 bg-white rounded-[2.5rem] border border-gray-100 shadow-xl flex items-center justify-center mb-8 animate-bounce">
                                <svg className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                                {lang === 'AR' ? 'ابدأ بتحليل مستنداتك' : 'Begin Analyzing Documents'}
                            </h2>
                            <p className="text-slate-400 font-bold mt-2 uppercase tracking-[0.2em] text-xs">
                                {lang === 'AR' ? 'اختر قاعدة معرفة من القائمة أعلاه' : 'Select a knowledge base above to start'}
                            </p>
                        </div>
                    ) : (
                        messages.map((m) => (
                            <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-slide-up w-full`}>
                                <div className={`relative px-6 py-5 rounded-3xl shadow-sm max-w-[95%] sm:max-w-[85%] md:max-w-[80%] ${
                                    m.role === 'user' 
                                    ? 'bg-slate-900 text-white rounded-tr-none' 
                                    : 'bg-white text-slate-800 border border-gray-100 rounded-tl-none ring-1 ring-gray-100/30'
                                }`}>
                                    <p className={`text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium ${lang === 'AR' ? 'text-right' : 'text-left'}`}>
                                        {m.text}
                                    </p>

                                    {m.role === 'model' && (
                                        <div className="mt-6 pt-5 border-t border-slate-50 flex flex-col space-y-4">
                                            {m.citations.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {m.citations.map(c => (
                                                        <span key={c} className="bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase">
                                                            📄 {c}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center justify-between rtl:flex-row-reverse">
                                                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                                    <span className="bg-slate-50 text-slate-400 px-2 py-1 rounded-md border border-slate-100 text-[9px] font-black tracking-widest uppercase">
                                                        {m.modelName?.replace('gemini-', '')}
                                                    </span>
                                                    <span className="text-[9px] font-black text-slate-300 tracking-widest uppercase">
                                                        {m.tokens?.input}/{m.tokens?.output} TOKS
                                                    </span>
                                                </div>
                                                <button 
                                                    onClick={() => copyResponsePair(m)}
                                                    className="p-2 text-slate-300 hover:text-blue-600 transition-all rounded-xl hover:bg-blue-50"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className={`mt-2 px-4 text-[9px] font-black text-slate-300 uppercase tracking-widest ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        ))
                    )}
                    
                    {isTyping && (
                        <div className="flex justify-start animate-pulse">
                            <div className="bg-white border border-blue-100 px-8 py-5 rounded-3xl rounded-tl-none flex items-center space-x-4 shadow-lg shadow-blue-50/50 rtl:space-x-reverse">
                                <div className="relative">
                                    <div className="w-6 h-6 border-2 border-blue-100 rounded-full animate-ping absolute" />
                                    <Spinner />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-blue-600 uppercase tracking-[0.2em]">
                                        {lang === 'AR' ? 'جاري التحليل المنطقي...' : 'Thinking Deeply...'}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                        {lang === 'AR' ? 'البحث في المستندات' : 'Querying Knowledge Base'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={endRef} className="h-10" />
                </div>
            </div>

            {/* Input Form */}
            <div className="px-4 md:px-8 py-8 bg-white border-t border-gray-100 shadow-2xl">
                <div className="max-w-5xl mx-auto flex items-center space-x-3 md:space-x-5 rtl:space-x-reverse">
                    <button 
                        onClick={() => { if(confirm(lang === 'AR' ? 'مسح المحادثة؟' : 'Reset this session?')) setMessages([])}} 
                        className="p-4 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent shrink-0"
                        title="Clear History"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                    <form onSubmit={handleSend} className="flex-1 relative flex items-center min-w-0">
                        <input 
                            type="text" 
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={lang === 'AR' ? 'اطرح سؤالاً عن ملفاتك...' : 'Ask about your manuals...'}
                            disabled={!activeDbId || isTyping}
                            className={`w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-4 md:py-5 px-8 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 focus:bg-white transition-all text-slate-800 font-bold placeholder:text-slate-300 text-sm md:text-lg shadow-sm ${lang === 'AR' ? 'text-right pl-20' : 'text-left pr-20'}`}
                        />
                        <button 
                            type="submit" 
                            disabled={!query.trim() || isTyping || !activeDbId}
                            className={`absolute top-1/2 -translate-y-1/2 p-3.5 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 disabled:bg-slate-200 disabled:shadow-none transition-all active:scale-90 ${lang === 'AR' ? 'left-3' : 'right-3'}`}
                        >
                            <svg className={`w-6 h-6 ${lang === 'AR' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7-7 7M5 12h14" />
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
