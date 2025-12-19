
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface ProgressBarProps {
  progress: number;
  total: number;
  message: string;
  fileName?: string;
  icon?: React.ReactNode;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, total, message, fileName, icon }) => {
  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;
  const isComplete = percentage === 100 && total > 0;

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        {icon && <div className="mb-8">{icon}</div>}
        <h2 className={`text-2xl font-black mb-2 transition-colors duration-500 ${isComplete ? 'text-green-600' : 'text-slate-800'}`}>
            {message}
        </h2>
        <p className={`font-bold mb-6 h-6 truncate max-w-full px-4 text-sm uppercase tracking-widest transition-colors duration-500 ${isComplete ? 'text-green-500' : 'text-blue-500'}`} title={fileName}>
            {isComplete ? 'Success' : (fileName || 'Preparing...')}
        </p>
        
        <div className="w-full max-w-md relative">
            <div className={`w-full rounded-full h-6 overflow-hidden shadow-inner transition-colors duration-500 ${isComplete ? 'bg-green-50' : 'bg-slate-100'}`}>
                <div
                    className={`h-full transition-all duration-500 ease-out relative ${isComplete ? 'bg-green-500' : 'bg-blue-600'}`}
                    style={{ width: `${percentage}%` }}
                >
                    {!isComplete && (
                        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-progress-stripes"></div>
                    )}
                </div>
            </div>
            <div className="mt-4 flex justify-between items-end">
                <span className={`text-4xl font-black transition-colors duration-500 ${isComplete ? 'text-green-700' : 'text-slate-900'}`}>
                    {percentage}%
                </span>
                <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-lg transition-colors duration-500 ${isComplete ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                    {progress} / {total} {total === 1 ? 'File' : 'Files'}
                </span>
            </div>
        </div>
    </div>
  );
};

export default ProgressBar;
