
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { AppView, ApiStatus, Language } from '../types';

interface NavbarProps {
    view: AppView;
    setView: (v: AppView) => void;
    isAuthenticated: boolean;
    onLogout: () => void;
    apiStatus: ApiStatus;
    lang: Language;
    onToggleLang: () => void;
    systemName: string;
}

const Navbar: React.FC<NavbarProps> = ({ view, setView, isAuthenticated, onLogout, apiStatus, lang, onToggleLang, systemName }) => {
    const isFunctional = apiStatus === ApiStatus.Functional;
    
    const handleOpenKey = async () => {
        if (window.aistudio?.openSelectKey) {
            await window.aistudio.openSelectKey();
        }
    };

    return (
        <nav className="h-16 bg-white border-b border-gray-100 px-4 md:px-6 flex items-center justify-between z-50 shadow-sm sticky top-0 w-full">
            <div className="flex items-center space-x-2 md:space-x-8 rtl:space-x-reverse min-w-0">
                <div className="flex items-center space-x-2 md:space-x-3 rtl:space-x-reverse shrink-0">
                    <div className="bg-slate-900 p-1.5 rounded-lg shadow-sm shrink-0">
                        <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <div className="flex flex-col items-start leading-none overflow-hidden max-w-[100px] xs:max-w-[150px] md:max-w-none">
                        <span className="text-sm md:text-lg font-bold text-slate-900 tracking-tight whitespace-nowrap truncate">{systemName}</span>
                        <span className="text-[8px] md:text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 mt-0.5">
                            ENTERPRISE
                        </span>
                    </div>
                </div>

                <div className="flex bg-gray-100/50 p-1 rounded-xl shrink-0">
                    <button 
                        onClick={() => setView(AppView.Chat)}
                        className={`flex items-center space-x-2 px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${view === AppView.Chat ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        <span className="hidden sm:inline">{lang === 'AR' ? 'دردشة' : 'Chat'}</span>
                    </button>
                    <button 
                        onClick={() => setView(AppView.Admin)}
                        className={`flex items-center space-x-2 px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${view === AppView.Admin ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                        <span className="hidden sm:inline">{lang === 'AR' ? 'إدارة' : 'Admin'}</span>
                    </button>
                </div>
            </div>

            <div className="flex items-center space-x-2 md:space-x-6 rtl:space-x-reverse shrink-0">
                <div className={`flex items-center space-x-1 md:space-x-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold border transition-colors ${isFunctional ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                    <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isFunctional ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                    <span className="hidden xs:inline">{apiStatus}</span>
                    <span className="xs:hidden">{isFunctional ? 'OK' : 'ERR'}</span>
                </div>

                <div className="flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse border-l rtl:border-r pl-2 md:pl-4 rtl:pr-2 md:pr-4 border-gray-100">
                    <button onClick={handleOpenKey} className="p-1.5 md:p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Manage API Key">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                    </button>

                    <button 
                        onClick={onToggleLang} 
                        className="flex items-center space-x-1 md:space-x-2 px-2 py-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all font-bold text-xs md:text-sm border border-transparent hover:border-blue-100"
                        title={lang === 'EN' ? 'Switch to Arabic' : 'Switch to English'}
                    >
                        <svg className="w-4 h-4 md:w-5 md:h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9h18" />
                        </svg>
                        {/* Always show the NEXT language so user knows where they are going */}
                        <span className="hidden md:inline">{lang === 'EN' ? 'العربية' : 'English'}</span>
                        <span className="md:hidden">{lang === 'EN' ? 'AR' : 'EN'}</span>
                    </button>

                    {isAuthenticated && (
                        <button onClick={onLogout} className="p-1.5 md:p-2 text-red-400 hover:text-red-600 transition-colors" title="Logout">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
