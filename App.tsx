
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { KnowledgeBase, AppView, ApiStatus, Language, SystemConfig } from './types';
import * as geminiService from './services/geminiService';
import Navbar from './components/Navbar';
import AdminDashboard from './components/AdminDashboard';
import ChatInterface from './components/ChatInterface';
import LoginScreen from './components/LoginScreen';

const STORAGE_KEY_KB = 'gemini_rag_kb';
const STORAGE_KEY_CONFIG = 'gemini_rag_config';

// Fallback credentials if Env Vars aren't set
const DEFAULT_USER = 'admin';
const DEFAULT_PASS = 'admin123';

const App: React.FC = () => {
    const [view, setView] = useState<AppView>(AppView.Chat); 
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [lang, setLang] = useState<Language>('EN');
    const [apiStatus, setApiStatus] = useState<ApiStatus>(ApiStatus.Checking);
    const [databases, setDatabases] = useState<KnowledgeBase[]>([]);
    const [activeDbId, setActiveDbId] = useState<string | null>(null);
    const [config, setConfig] = useState<SystemConfig>({
        systemName: 'Manual Assistant AI',
        defaultKbId: null,
        admins: [{ id: '1', username: DEFAULT_USER, password: DEFAULT_PASS }]
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
                setConfig(prev => ({ ...prev, ...parsedConfig }));
                if (parsedConfig.defaultKbId) {
                    setActiveDbId(parsedConfig.defaultKbId);
                }
            } catch (e) { console.error(e); }
        }
    }, []);

    useEffect(() => {
        if (!activeDbId && databases.length > 0) {
            setActiveDbId(databases[0].id);
        }
    }, [databases]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_KB, JSON.stringify(databases));
    }, [databases]);

    useEffect(() => {
        const { admins, ...serializableConfig } = config;
        localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(serializableConfig));
    }, [config]);

    useEffect(() => {
        const check = async () => {
            const online = await geminiService.checkConnectivity();
            setApiStatus(online ? ApiStatus.Functional : ApiStatus.Disrupted);
        };
        check();
        const timer = setInterval(check, 60000);
        return () => clearInterval(timer);
    }, []);

    const handleLogin = (u: string, p: string) => {
        // Check against both environment variables and the local config list
        const envUser = process.env.ADMIN_USER || DEFAULT_USER;
        const envPass = process.env.ADMIN_PASS || DEFAULT_PASS;

        const isAdmin = (u === envUser && p === envPass) || 
                        config.admins.some(admin => admin.username === u && admin.password === p);

        if (isAdmin) {
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
            className={`min-h-screen bg-[#fcfdfe] flex flex-col font-sans transition-all duration-500 ${lang === 'AR' ? 'rtl' : 'ltr'}`} 
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
