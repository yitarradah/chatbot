
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { KnowledgeBase, StoredFile, Language, SystemConfig, AdminUser } from '../types';

interface AdminDashboardProps {
    databases: KnowledgeBase[];
    setDatabases: React.Dispatch<React.SetStateAction<KnowledgeBase[]>>;
    lang: Language;
    config: SystemConfig;
    setConfig: React.Dispatch<React.SetStateAction<SystemConfig>>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ databases, setDatabases, lang, config, setConfig }) => {
    const [tempSystemName, setTempSystemName] = useState(config.systemName);
    const [newDbName, setNewDbName] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    // Admin form state
    const [newAdminUser, setNewAdminUser] = useState('');
    const [newAdminPass, setNewAdminPass] = useState('');
    const [newAdminEmail, setNewAdminEmail] = useState('');

    const handleCreateDb = () => {
        if (!newDbName.trim()) return;
        const newDb: KnowledgeBase = {
            id: Date.now().toString(),
            name: newDbName,
            files: [],
            preferredModel: 'gemini-3-flash-preview'
        };
        setDatabases(prev => [newDb, ...prev]);
        setNewDbName('');
    };

    const handleConfirmRename = () => {
        if (!tempSystemName.trim()) return;
        setConfig(c => ({ ...c, systemName: tempSystemName }));
        const msg = lang === 'AR' ? 'تم تحديث اسم النظام بنجاح' : 'System name updated successfully';
        alert(msg);
    };

    const handleAddAdmin = () => {
        if (!newAdminUser.trim() || !newAdminPass.trim()) {
            alert(lang === 'AR' ? 'يرجى إدخال اسم المستخدم وكلمة المرور' : 'Please enter username and password');
            return;
        }
        const newAdmin: AdminUser = {
            id: Date.now().toString(),
            username: newAdminUser,
            password: newAdminPass,
            email: newAdminEmail || undefined
        };
        setConfig(c => ({ ...c, admins: [...c.admins, newAdmin] }));
        setNewAdminUser('');
        setNewAdminPass('');
        setNewAdminEmail('');
    };

    const handleDeleteAdmin = (id: string) => {
        if (config.admins.length <= 1) {
            alert(lang === 'AR' ? 'لا يمكنك حذف آخر مسؤول' : 'You cannot delete the last administrator');
            return;
        }
        const confirmMsg = lang === 'AR' ? 'هل أنت متأكد من حذف هذا المسؤول؟' : 'Are you sure you want to delete this administrator?';
        if (!confirm(confirmMsg)) return;
        setConfig(c => ({ ...c, admins: c.admins.filter(a => a.id !== id) }));
    };

    const handleDeleteDb = (id: string) => {
        const confirmMsg = lang === 'AR' ? 'هل أنت متأكد من حذف قاعدة البيانات هذه؟' : 'Are you sure you want to delete this database?';
        if (!confirm(confirmMsg)) return;
        setDatabases(prev => prev.filter(db => db.id !== id));
        if (config.defaultKbId === id) setConfig(c => ({ ...c, defaultKbId: null }));
    };

    const handleFileUpload = async (dbId: string, files: FileList) => {
        const newFiles: StoredFile[] = [];
        for (const f of Array.from(files)) {
            const content = await f.text();
            newFiles.push({
                id: Math.random().toString(36).substr(2, 9),
                name: f.name,
                content: content,
                size: f.size,
                chars: content.length,
                type: f.type || 'text/plain',
                uploadedAt: new Date().toISOString()
            });
        }
        setDatabases(prev => prev.map(d => d.id === dbId ? { ...d, files: [...d.files, ...newFiles] } : d));
    };

    return (
        <div className="p-4 md:p-8 lg:p-10 max-w-6xl mx-auto space-y-6 md:space-y-10 overflow-y-auto w-full h-full custom-scrollbar">
            {/* Platform Settings Section */}
            <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                        {lang === 'AR' ? 'إعدادات المنصة' : 'Platform Settings'}
                    </h2>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4 items-end bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex-1 space-y-2 w-full">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{lang === 'AR' ? 'اسم النظام' : 'System Name'}</label>
                        <input 
                            type="text" 
                            value={tempSystemName}
                            onChange={(e) => setTempSystemName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 font-bold transition-all shadow-sm"
                        />
                    </div>
                    <button 
                        onClick={handleConfirmRename}
                        className="w-full md:w-auto px-8 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-black transition-all shadow-lg active:scale-95 shrink-0"
                    >
                        {lang === 'AR' ? 'تحديث الاسم' : 'Update Name'}
                    </button>
                </div>
            </div>

            {/* Administrators Management Section */}
            <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm space-y-8">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                        {lang === 'AR' ? 'إدارة المسؤولين' : 'Administrators Management'}
                    </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">{lang === 'AR' ? 'اسم المستخدم' : 'Username'}</label>
                        <input type="text" value={newAdminUser} onChange={e=>setNewAdminUser(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">{lang === 'AR' ? 'كلمة المرور' : 'Password'}</label>
                        <input type="password" value={newAdminPass} onChange={e=>setNewAdminPass(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">{lang === 'AR' ? 'البريد (اختياري)' : 'Email (Optional)'}</label>
                        <div className="flex gap-2">
                            <input type="email" value={newAdminEmail} onChange={e=>setNewAdminEmail(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-purple-500" />
                            <button onClick={handleAddAdmin} className="bg-purple-600 text-white p-2 rounded-xl hover:bg-purple-700 transition-all shrink-0">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    {config.admins.map(admin => (
                        <div key={admin.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-purple-200 transition-all shadow-sm">
                            <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0">
                                <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                </div>
                                <div className="truncate">
                                    <p className="font-black text-slate-800 text-sm truncate">{admin.username}</p>
                                    {admin.email && <p className="text-[10px] text-slate-400 font-bold">{admin.email}</p>}
                                </div>
                            </div>
                            <button onClick={() => handleDeleteAdmin(admin.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors shrink-0">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Create Database Section */}
            <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm space-y-8">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                        {lang === 'AR' ? 'إنشاء قاعدة بيانات' : 'Create Database'}
                    </h2>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                    <input 
                        type="text" 
                        value={newDbName}
                        onChange={(e) => setNewDbName(e.target.value)}
                        placeholder={lang === 'AR' ? 'اسم قاعدة البيانات الجديد...' : 'Enter database name...'}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 font-bold"
                    />
                    <button 
                        onClick={handleCreateDb}
                        className="px-6 md:px-10 py-4 bg-[#8e97a4] text-white font-black rounded-2xl hover:bg-slate-600 transition-all shadow-xl shadow-slate-100 whitespace-nowrap active:scale-95"
                    >
                        {lang === 'AR' ? 'إنشاء قاعدة بيانات' : 'Create Database'}
                    </button>
                </div>
            </div>

            {/* Databases List Section */}
            <div className="space-y-6 pb-12">
                {databases.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
                        <p className="text-slate-400 font-bold uppercase tracking-widest">{lang === 'AR' ? 'لا يوجد قواعد بيانات بعد' : 'No databases created yet'}</p>
                    </div>
                ) : (
                    databases.map(db => (
                        <div key={db.id} className="bg-white rounded-2xl md:rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden animate-slide-up">
                            <div className="p-4 md:p-6 bg-slate-50/50 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                                <div className="flex items-center space-x-3 md:space-x-5 rtl:space-x-reverse min-w-0">
                                    <div className="p-3 md:p-4 bg-white border border-gray-100 rounded-2xl shadow-sm text-blue-600 shrink-0">
                                        <svg className="w-5 h-5 md:w-7 md:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8-4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg md:text-xl font-black text-slate-900 leading-none truncate">{db.name}</h3>
                                            {config.defaultKbId === db.id && (
                                                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase shrink-0 tracking-tighter">{lang === 'AR' ? 'افتراضي' : 'Default'}</span>
                                            )}
                                        </div>
                                        <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                                            {db.files.length} {lang === 'AR' ? 'ملفات' : 'Files'} • {(db.files.reduce((a, b) => a + b.size, 0) / 1024).toFixed(0)} KB
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 md:space-x-4 rtl:space-x-reverse w-full md:w-auto shrink-0">
                                    <button 
                                        onClick={() => setConfig(c => ({ ...c, defaultKbId: db.id }))}
                                        className={`p-2.5 rounded-xl transition-all shrink-0 ${config.defaultKbId === db.id ? 'bg-amber-100 text-amber-600 shadow-inner' : 'bg-white border border-gray-100 text-slate-300 hover:text-amber-500'}`}
                                        title={lang === 'AR' ? 'تحديد كافتراضي' : "Set as Landing Page Default"}
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                                    </button>
                                    <select 
                                        value={db.preferredModel}
                                        onChange={(e) => setDatabases(prev => prev.map(d => d.id === db.id ? { ...d, preferredModel: e.target.value } : d))}
                                        className="flex-1 md:flex-none bg-white border border-gray-200 rounded-xl text-[10px] md:text-xs font-black py-2.5 px-3 md:px-5 text-slate-600 focus:ring-2 focus:ring-blue-500 min-w-[120px] appearance-none text-center cursor-pointer shadow-sm"
                                    >
                                        <option value="gemini-flash-lite-latest">Flash Lite</option>
                                        <option value="gemini-3-flash-preview">3 Flash</option>
                                        <option value="gemini-3-pro-preview">3 Pro</option>
                                    </select>
                                    <button onClick={() => handleDeleteDb(db.id)} className="p-2.5 text-slate-300 hover:text-red-500 transition-colors shrink-0">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 md:p-10 space-y-6 md:space-y-10">
                                <label 
                                    className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl md:rounded-[2.5rem] py-10 md:py-16 transition-all cursor-pointer ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'}`}
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files) handleFileUpload(db.id, e.dataTransfer.files); }}
                                >
                                    <div className="bg-blue-50 text-blue-600 p-4 md:p-5 rounded-full mb-4 md:mb-6 shadow-sm">
                                        <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                    </div>
                                    <p className="text-lg md:text-xl font-black text-slate-900 text-center">{lang === 'AR' ? 'اختر ملفات لرفعها' : 'Select files to upload'}</p>
                                    <p className="text-[10px] md:text-sm text-slate-400 mt-2 font-bold tracking-tight text-center px-4">{lang === 'AR' ? 'يدعم: جميع الملفات النصية' : 'Supported: All text-based files (Code, Logs, Documents)'}</p>
                                    <input type="file" multiple className="hidden" onChange={(e) => e.target.files && handleFileUpload(db.id, e.target.files)} />
                                </label>

                                {db.files.length > 0 && (
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{lang === 'AR' ? 'الملفات المرفوعة' : 'UPLOADED FILES'}</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                                            {db.files.map(file => (
                                                <div key={file.id} className="bg-white border border-slate-100 p-4 md:p-5 rounded-xl md:rounded-2xl flex items-center space-x-3 md:space-x-4 rtl:space-x-reverse group hover:border-blue-100 transition-colors overflow-hidden shadow-sm">
                                                    <div className="bg-slate-50 p-2 md:p-3 rounded-lg md:rounded-xl text-slate-400 group-hover:text-blue-500 transition-colors shrink-0">
                                                        <svg className="w-5 h-5 md:w-7 md:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs md:text-sm font-black text-slate-900 truncate" title={file.name}>{file.name}</p>
                                                        <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
                                                            {new Date(file.uploadedAt).toLocaleDateString()} • {(file.size / 1024).toFixed(0)} KB
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
