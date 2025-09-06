import React from 'react';
import { DIAGRAM_TYPES } from '../constants';
import { DiagramType } from '../types';

interface ControlPanelProps {
    selectedDiagramType: DiagramType;
    setSelectedDiagramType: (type: DiagramType) => void;
    onGenerate: () => void;
    isLoading: boolean;
    hasKeywords: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ selectedDiagramType, setSelectedDiagramType, onGenerate, isLoading, hasKeywords }) => {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3 border border-blue-500/20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <label htmlFor="diagram-type" className="text-sm font-medium text-gray-300">Diagram Type:</label>
            <select
                id="diagram-type"
                value={selectedDiagramType}
                onChange={(e) => setSelectedDiagramType(e.target.value as DiagramType)}
                disabled={isLoading}
                className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
            >
                {DIAGRAM_TYPES.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                ))}
            </select>
        </div>
        <button
            onClick={onGenerate}
            disabled={isLoading || !hasKeywords}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-5 rounded-md transition-all duration-300 text-sm"
        >
            Load Template
        </button>
    </div>
  );
};
