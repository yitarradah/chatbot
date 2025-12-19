
import React, { useState } from 'react';
import { Language } from '../types';

interface LoginScreenProps {
    onLogin: (u: string, p: string) => void;
    lang: Language;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, lang }) => {
    const [u, setU] = useState('');
    const [p, setP] = useState('');

    const t = {
        EN: { title: 'Admin Control Center', u: 'Username', p: 'Password', btn: 'Authenticate' },
        AR: { title: 'مركز تحكم المسؤول', u: 'اسم المستخدم', p: 'كلمة المرور', btn: 'تسجيل الدخول' }
    };

    return (
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
            <div className="w-full max-w-md bg-white p-10 rounded-3xl border border-gray-100 shadow-xl space-y-8 animate-slide-up">
                <div className="text-center">
                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t[lang].title}</h2>
                </div>
                
                <div className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">{t[lang].u}</label>
                        <input 
                            type="text" 
                            value={u} 
                            onChange={e=>setU(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold"
                            placeholder={lang === 'AR' ? 'أدخل اسم المستخدم' : 'Enter username'}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">{t[lang].p}</label>
                        <input 
                            type="password" 
                            value={p} 
                            onChange={e=>setP(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold"
                            placeholder={lang === 'AR' ? 'أدخل كلمة المرور' : 'Enter password'}
                        />
                    </div>
                </div>

                <button 
                    onClick={() => onLogin(u, p)}
                    className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all text-lg"
                >
                    {t[lang].btn}
                </button>
            </div>
        </div>
    );
};

export default LoginScreen;
