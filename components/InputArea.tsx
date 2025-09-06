
import React, { useState, useCallback } from 'react';
import { FileUploadIcon } from './common/Icon';

interface InputAreaProps {
  onTextSubmit: (text: string) => void;
  onFileSubmit: (file: File) => void;
  isLoading: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onTextSubmit, onFileSubmit, isLoading }) => {
  const [text, setText] = useState('');
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSubmit(file);
    }
  }, [onFileSubmit]);

  const handleSubmit = useCallback(() => {
    onTextSubmit(text);
  }, [onTextSubmit, text]);

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-blue-500/20 flex flex-col h-1/2">
      <div className="flex mb-3 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('text')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'text' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
        >
          Paste Text
        </button>
        <button
          onClick={() => setActiveTab('file')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'file' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
        >
          Upload PDF
        </button>
      </div>

      <div className="flex-grow flex flex-col">
        {activeTab === 'text' && (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your article, notes, or any text here..."
              className="w-full h-full bg-gray-900/70 border border-gray-600 rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              disabled={isLoading}
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading || !text.trim()}
              className="mt-3 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-all duration-300"
            >
              Analyze Text
            </button>
          </>
        )}
        {activeTab === 'file' && (
          <div className="flex-grow flex flex-col items-center justify-center p-4">
            <label htmlFor="file-upload" className="cursor-pointer w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-lg p-6 transition-colors">
              <FileUploadIcon />
              <p className="mt-2 text-sm text-gray-400">
                <span className="font-semibold text-blue-400">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">PDF (MAX. 5MB)</p>
            </label>
            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf" onChange={handleFileChange} disabled={isLoading} />
          </div>
        )}
      </div>
    </div>
  );
};
