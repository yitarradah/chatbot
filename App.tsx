
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

const DEFAULT_USER = 'admin';
const DEFAULT_PASS = 'admin123';

const App: React.FC = () => {
    const [view, setView] = useState<AppView>(AppView.Chat); 
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [lang, setLang] = useState<Language>('EN');
    const [apiStatus, setApiStatus] = useState<ApiStatus>(ApiStatus.Checking);
    const [databases, setDatabases] = useState<KnowledgeBase[]>([]);
    const [activeDbId, setActiveDbId] = useState<string | null>(null);
    const [config, setConfig] = useState<SystemConfig>(() => {
        const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { console.error(e); }
        }
        return {
            systemName: 'Manual Assistant AI',
            defaultKbId: null,
            admins: [{ id: '1', username: DEFAULT_USER, password: DEFAULT_PASS }]
        };
    });

    useEffect(() => {
        const savedKb = localStorage.getItem(STORAGE_KEY_KB);
        if (savedKb) {
            try { 
                const parsed = JSON.parse(savedKb);
                setDatabases(parsed);
            } catch (e) { console.error(e); }
        }
    }, []);

    useEffect(() => {
        if (!activeDbId && databases.length > 0) {
            if (config.defaultKbId && databases.find(d => d.id === config.defaultKbId)) {
                setActiveDbId(config.defaultKbId);
            } else {
                setActiveDbId(databases[0].id);
            }
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
        const timer = setInterval(check, 60000);
        return () => clearInterval(timer);
    }, []);

    const handleLogin = (u: string, p: string) => {
        const isConfigValid = config.admins.some(a => a.username === u && a.password === p);

        if (isConfigValid) {
            setIsAuthenticated(true);
            setView(AppView.Admin);
        } else {
            alert(lang === 'AR' ? "بيانات الدخول غير صحيحة" : "Invalid credentials. Hint: Default is admin / admin123");
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setView(AppView.Chat);
    };

    return (
        <div 
            className={`min-h-screen bg-white flex flex-col font-sans transition-all duration-300 ${lang === 'AR' ? 'rtl' : 'ltr'}`} 
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
