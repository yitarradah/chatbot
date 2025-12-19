
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useCallback } from 'react';
import UploadCloudIcon from './icons/UploadCloudIcon';
import CarIcon from './icons/CarIcon';
import WashingMachineIcon from './icons/WashingMachineIcon';
import Spinner from './Spinner';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (files: File[]) => void;
}

const sampleDocuments = [
    {
        name: 'Hyundai i10 Manual',
        url: 'https://www.hyundai.com/content/dam/hyundai/in/en/data/connect-to-service/owners-manual/2025/i20&i20nlineFromOct2023-Present.pdf',
        icon: <CarIcon />,
        fileName: 'hyundai-i10-manual.pdf'
    },
    {
        name: 'LG Washer Manual',
        url: 'https://www.lg.com/us/support/products/documents/WM2077CW.pdf',
        icon: <WashingMachineIcon />,
        fileName: 'lg-washer-manual.pdf'
    }
];

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload }) => {
    const [files, setFiles] = useState<File[]>([]);
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
    }, []);

    const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(true);
    }, []);
    
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
            if (!response.ok) {
                throw new Error(`Failed to fetch ${name}: ${response.statusText}`);
            }
            const blob = await response.blob();
            const file = new File([blob], fileName, { type: blob.type });
            setFiles(prev => [...prev, file]);
        } catch (error) {
            console.error("Error fetching sample file:", error);
            alert(`Could not fetch the sample document. This might be due to CORS policy. Please try uploading a local file.`);
        } finally {
            setLoadingSample(null);
        }
    };

    const handleConfirmUpload = () => {
        onUpload(files);
        handleClose();
    };

    const handleClose = () => {
        setFiles([]);
        onClose();
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="upload-title">
            <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-2xl relative">
                <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <h3 id="upload-title" className="text-2xl font-bold mb-6 text-slate-800">Upload Documents</h3>
                
                <div 
                    className={`border-2 border-dashed rounded-2xl p-10 text-center mb-8 transition-all ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                >
                    <UploadCloudIcon />
                    <p className="mt-4 font-semibold text-gray-700">Drop files or click to browse</p>
                    <input type="file" multiple className="hidden" id="modal-file-input" onChange={handleFileChange} />
                    <button onClick={() => document.getElementById('modal-file-input')?.click()} className="mt-2 text-blue-600 hover:underline">Select files</button>
                </div>

                {files.length > 0 && (
                    <div className="mb-8 max-h-40 overflow-y-auto">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Selected Files</p>
                        <ul className="space-y-2">
                            {files.map((f, i) => (
                                <li key={i} className="text-sm bg-gray-50 p-2 rounded flex justify-between">
                                    <span className="truncate">{f.name}</span>
                                    <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 text-xs">Remove</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-8">
                    {sampleDocuments.map(doc => (
                        <button key={doc.name} onClick={() => handleSelectSample(doc.name, doc.url, doc.fileName)} className="flex items-center p-3 border rounded-xl hover:bg-gray-50 transition-all text-left">
                            <div className="w-10 h-10 mr-3 flex items-center justify-center">
                                {loadingSample === doc.name ? <Spinner /> : doc.icon}
                            </div>
                            <span className="text-sm font-medium">{doc.name}</span>
                        </button>
                    ))}
                </div>

                <div className="flex justify-end space-x-3">
                    <button onClick={handleClose} className="px-6 py-2 text-gray-500 font-medium">Cancel</button>
                    <button onClick={handleConfirmUpload} disabled={files.length === 0} className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50">Upload</button>
                </div>
            </div>
        </div>
    );
};

export default UploadModal;
