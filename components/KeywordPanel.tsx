
import React, { useCallback } from 'react';
import type { Keyword } from '../types';

interface KeywordPanelProps {
  keywords: Keyword[];
  selectedKeywords: string[];
  setSelectedKeywords: React.Dispatch<React.SetStateAction<string[]>>;
}

export const KeywordPanel: React.FC<KeywordPanelProps> = ({ keywords, selectedKeywords, setSelectedKeywords }) => {
  const handleToggleKeyword = useCallback((keywordName: string) => {
    setSelectedKeywords(prev =>
      prev.includes(keywordName)
        ? prev.filter(k => k !== keywordName)
        : [...prev, keywordName]
    );
  }, [setSelectedKeywords]);
  
  const handleSelectAll = () => {
    setSelectedKeywords(keywords.map(k => k.name));
  };

  const handleDeselectAll = () => {
    setSelectedKeywords([]);
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-blue-500/20 flex flex-col h-1/2">
      <h2 className="text-lg font-semibold mb-2 text-blue-300">Extracted Keywords</h2>
       <div className="flex items-center justify-between mb-3 text-sm">
          <span className="text-gray-400">{selectedKeywords.length} / {keywords.length} selected</span>
          <div className="space-x-2">
            <button onClick={handleSelectAll} className="text-blue-400 hover:text-blue-300">All</button>
            <button onClick={handleDeselectAll} className="text-gray-400 hover:text-gray-300">None</button>
          </div>
        </div>
      <div className="overflow-y-auto space-y-2 pr-2 -mr-2">
        {keywords.map(keyword => (
          <div
            key={keyword.name}
            className="flex items-start bg-gray-900/50 p-2 rounded-md group"
            title={keyword.description}
          >
            <input
              type="checkbox"
              id={`keyword-${keyword.name}`}
              checked={selectedKeywords.includes(keyword.name)}
              onChange={() => handleToggleKeyword(keyword.name)}
              className="mt-1 h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
            />
            <label htmlFor={`keyword-${keyword.name}`} className="ml-3 text-sm text-gray-300 group-hover:text-white cursor-pointer w-full">
              {keyword.name}
              <p className="text-xs text-gray-500 group-hover:text-gray-400">{keyword.description}</p>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};
