
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import Spinner from './Spinner';
import UploadCloudIcon from './icons/UploadCloudIcon';
import CarIcon from './icons/CarIcon';
import WashingMachineIcon from './icons/WashingMachineIcon';
import TrashIcon from './icons/TrashIcon';

interface WelcomeScreenProps {
    onUpload: () => Promise<void>;
    apiKeyError: string | null;
    files: File[];
    setFiles: React.Dispatch<React.SetStateAction<File[]>>;
    isApiKeySelected: boolean;
    onSelectKey: () => Promise<void>;
    onOpenLibrary: () => void;
}

const sampleDocuments = [
    {
        name: 'Hyundai i10 Manual',
        details: 'Owner\'s guide for 2024 model',
        url: 'https://www.hyundai.com/content/dam/hyundai/in/en/data/connect-to-service/owners-manual/2025/i20&i20nlineFromOct2023-Present.pdf',
        icon: <CarIcon />,
        fileName: 'hyundai-i10-manual.pdf'
    },
    {
        name: 'LG Washing Machine',
        details: 'Installation & User Manual',
        url: 'https://www.lg.com/us/support/products/documents/WM2077CW.pdf',
        icon: <WashingMachineIcon />,
        fileName: 'lg-washer-manual.pdf'
    }
];

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onUpload, apiKeyError, files, setFiles, isApiKeySelected, onSelectKey, onOpenLibrary }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [loadingSample, setLoadingSample] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFiles(prev => [...prev, ...Array.from(event.target.files!)]);
        }
    };
    
    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        if (event.dataTransfer.files) {
            setFiles(prev => [...prev, ...Array.from(event.dataTransfer.files)]);
        }
    }, [setFiles]);

    const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isDragging) setIsDragging(true);
    }, [isDragging]);
    
    const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleSelectSample = async (name: string, url: string, fileName: string) => {
        if (loadingSample) return;
        setLoadingSample(name);
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("CORS or network error");
            const blob = await response.blob();
            const file = new File([blob], fileName, { type: blob.type });
            setFiles(prev => [...prev, file]);
        } catch (error) {
            alert(`Could not fetch sample directly. This is common due to browser security (CORS). Please upload a local PDF instead.`);
        } finally {
            setLoadingSample(null);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 sm:p-12 animate-fade-in bg-gradient-to-b from-white to-gray-50">
            <div className="w-full max-w-4xl">
                <div className="text-center mb-12">
                    <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-4 text-gray-900">
                        Ask the <span className="text-gem-blue">Manual</span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Instant answers from your technical documents. No more scrolling through hundreds of pages.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    {/* Upload Section */}
                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 transition-all hover:shadow-2xl">
                            <h2 className="text-2xl font-bold mb-6 flex items-center">
                                <span className="bg-gem-blue text-white w-8 h-8 rounded-full inline-flex items-center justify-center text-sm mr-3">1</span>
                                Choose Documents
                            </h2>
                            
                            {!isApiKeySelected ? (
                                <div className="space-y-3 mb-4">
                                    <button onClick={onSelectKey} className="w-full bg-blue-50 text-gem-blue border-2 border-dashed border-gem-blue/30 rounded-2xl py-6 font-bold hover:bg-blue-100 transition-all">
                                        Click to Select Gemini API Key
                                    </button>
                                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-xs leading-relaxed">
                                        <p className="font-bold mb-1">⚠️ Paid Project Required</p>
                                        <p>FileSearch is an advanced RAG tool that requires a project with an active billing account. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline font-bold">Learn more about billing.</a></p>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-2xl flex items-center font-medium border border-green-100">
                                    <span className="mr-2">✓</span> API Key Connected
                                    <button onClick={onSelectKey} className="ml-auto text-xs underline opacity-60 hover:opacity-100">Change</button>
                                </div>
                            )}

                            <div 
                                className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${isDragging ? 'border-gem-blue bg-blue-50/50 scale-[0.98]' : 'border-gray-200 hover:border-gem-blue/50'}`}
                                onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                                onClick={() => document.getElementById('file-upload')?.click()}
                            >
                                <UploadCloudIcon />
                                <p className="mt-4 font-semibold text-gray-700">Drop PDF or Click to Browse</p>
                                <p className="text-sm text-gray-400 mt-1">Supports PDF, TXT, MD</p>
                                <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileChange} accept=".pdf,.txt,.md"/>
                            </div>

                            {files.length > 0 && (
                                <div className="mt-6 space-y-2 animate-slide-up">
                                    <div className="flex justify-between items-center text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        <span>Selected Files</span>
                                        <span>{files.length} Total</span>
                                    </div>
                                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                        {files.map((file, i) => (
                                            <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl group border border-gray-100">
                                                <span className="truncate text-sm font-medium text-gray-700" title={file.name}>{file.name}</span>
                                                <button onClick={(e) => { e.stopPropagation(); setFiles(prev => prev.filter((_, idx) => idx !== i)); }} className="text-gray-400 hover:text-red-500 transition-colors">
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onUpload(); }}
                                        disabled={!isApiKeySelected}
                                        className="w-full mt-6 py-4 bg-gem-blue text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:shadow-none"
                                    >
                                        Start Analysis
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <div className="text-center">
                            <button onClick={onOpenLibrary} className="text-gem-blue font-bold hover:underline transition-all">
                                Go to Document Library →
                            </button>
                        </div>
                    </div>

                    {/* Examples Section */}
                    <div className="space-y-6">
                        <div className="bg-gray-50/80 p-8 rounded-3xl border border-gray-100">
                            <h2 className="text-2xl font-bold mb-6 flex items-center">
                                <span className="bg-gray-800 text-white w-8 h-8 rounded-full inline-flex items-center justify-center text-sm mr-3">2</span>
                                Or Try Examples
                            </h2>
                            <div className="space-y-4">
                                {sampleDocuments.map(doc => (
                                    <button
                                        key={doc.name}
                                        onClick={() => handleSelectSample(doc.name, doc.url, doc.fileName)}
                                        disabled={!!loadingSample}
                                        className="w-full bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gem-blue/30 transition-all text-left flex items-center space-x-4 group"
                                    >
                                        <div className="w-16 h-16 flex items-center justify-center flex-shrink-0 bg-blue-50 rounded-2xl group-hover:bg-blue-100 transition-colors">
                                            {loadingSample === doc.name ? <Spinner /> : doc.icon}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="font-bold text-gray-900 truncate">{doc.name}</p>
                                            <p className="text-sm text-gray-500">{doc.details}</p>
                                        </div>
                                        <span className="text-gray-300 group-hover:text-gem-blue transition-colors">→</span>
                                    </button>
                                ))}
                            </div>
                            <div className="mt-8 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                                <p className="text-sm text-blue-800/80 italic leading-relaxed">
                                    "FileSearch allows you to query documents without setting up complex vector databases manually."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {apiKeyError && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white text-red-600 px-6 py-4 rounded-2xl shadow-2xl border border-red-100 max-w-md animate-bounce">
                    <p className="font-bold text-sm mb-1">Access Denied</p>
                    <p className="text-xs">{apiKeyError}</p>
                </div>
            )}
        </div>
    );
};

export default WelcomeScreen;
