
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { KnowledgeBase, AppView, ApiStatus, Language, SystemConfig, AdminUser } from './types';
import * as geminiService from './services/geminiService';
import Navbar from './components/Navbar';
import AdminDashboard from './components/AdminDashboard';
import ChatInterface from './components/ChatInterface';
import LoginScreen from './components/LoginScreen';

const STORAGE_KEY_KB = 'gemini_rag_kb';
const STORAGE_KEY_CONFIG = 'gemini_rag_config';

const App: React.FC = () => {
    const [view, setView] = useState<AppView>(AppView.Chat); 
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [lang, setLang] = useState<Language>('EN');
    const [apiStatus, setApiStatus] = useState<ApiStatus>(ApiStatus.Checking);
    const [databases, setDatabases] = useState<KnowledgeBase[]>([]);
    const [activeDbId, setActiveDbId] = useState<string | null>(null);
    const [config, setConfig] = useState<SystemConfig>({
        systemName: 'Gemini RAG',
        defaultKbId: null,
        admins: [{ id: '1', username: 'admin123', password: 'admin123' }]
    });

    useEffect(() => {
        const savedKb = localStorage.getItem(STORAGE_KEY_KB);
        const savedConfig = localStorage.getItem(STORAGE_KEY_CONFIG);

        if (savedKb) {
            try {
                const parsedKb = JSON.parse(savedKb);
                setDatabases(parsedKb);
            } catch (e) { console.error(e); }
        }

        if (savedConfig) {
            try {
                const parsedConfig = JSON.parse(savedConfig);
                // Ensure admins array exists even if old config is loaded
                if (!parsedConfig.admins) {
                    parsedConfig.admins = [{ id: '1', username: 'admin123', password: 'admin123' }];
                }
                setConfig(parsedConfig);
                if (parsedConfig.defaultKbId) {
                    setActiveDbId(parsedConfig.defaultKbId);
                }
            } catch (e) { console.error(e); }
        }
    }, []);

    useEffect(() => {
        if (!activeDbId && config.defaultKbId && databases.some(db => db.id === config.defaultKbId)) {
            setActiveDbId(config.defaultKbId);
        } else if (!activeDbId && databases.length > 0) {
            setActiveDbId(databases[0].id);
        }
    }, [databases, config.defaultKbId]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_KB, JSON.stringify(databases));
    }, [databases]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    }, [config]);

    useEffect(() => {
        const check = async () => {
            const online = await geminiService.checkConnectivity();
            setApiStatus(online ? ApiStatus.Functional : ApiStatus.Disrupted);
        };
        check();
        const timer = setInterval(check, 30000);
        return () => clearInterval(timer);
    }, []);

    const handleLogin = (u: string, p: string) => {
        const adminFound = config.admins.find(admin => admin.username === u && admin.password === p);
        if (adminFound) {
            setIsAuthenticated(true);
            setView(AppView.Admin);
        } else {
            alert(lang === 'AR' ? "بيانات الدخول غير صحيحة" : "Invalid credentials");
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setView(AppView.Chat);
    };

    return (
        <div 
            className={`min-h-screen bg-[#f8fafc] flex flex-col font-sans transition-all duration-300 ${lang === 'AR' ? 'rtl' : 'ltr'}`} 
            dir={lang === 'AR' ? 'rtl' : 'ltr'}
        >
            <Navbar 
                view={view} 
                setView={setView} 
                isAuthenticated={isAuthenticated} 
                onLogout={handleLogout}
                apiStatus={apiStatus}
                lang={lang}
                onToggleLang={() => setLang(l => l === 'EN' ? 'AR' : 'EN')}
                systemName={config.systemName}
            />
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {!isAuthenticated && view === AppView.Admin ? (
                    <LoginScreen onLogin={handleLogin} lang={lang} />
                ) : view === AppView.Admin ? (
                    <AdminDashboard 
                        databases={databases} 
                        setDatabases={setDatabases} 
                        lang={lang} 
                        config={config}
                        setConfig={setConfig}
                    />
                ) : (
                    <ChatInterface 
                        databases={databases} 
                        activeDbId={activeDbId} 
                        setActiveDbId={setActiveDbId}
                        lang={lang}
                        apiStatus={apiStatus}
                    />
                )}
            </main>
        </div>
    );
};

export default App;
