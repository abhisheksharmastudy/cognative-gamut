import React from 'react';
import { FlowchartShape } from '../VisualizationCanvas';

interface ShapePaletteProps {
  onSelectShape: (shape: FlowchartShape) => void;
  currentShape?: FlowchartShape;
}

const ShapeIcon: React.FC<{ shape: FlowchartShape; isSelected: boolean }> = ({ shape, isSelected }) => {
  const baseClasses = "w-8 h-8 transition-colors duration-200";
  const selectedClasses = "bg-blue-600 text-white";
  const unselectedClasses = "bg-gray-700 hover:bg-gray-600 text-gray-300";

  const iconSvg = () => {
    switch (shape) {
      case FlowchartShape.Rectangle:
        return <rect x="4" y="8" width="24" height="16" rx="2" />;
      case FlowchartShape.Oval:
        return <ellipse cx="16" cy="16" rx="12" ry="8" />;
      case FlowchartShape.Diamond:
        return <path d="M16 8 L24 16 L16 24 L8 16 Z" />;
      case FlowchartShape.Parallelogram:
        return <path d="M8 8 L28 8 L24 24 L4 24 Z" />;
    }
  };

  return (
    <svg viewBox="0 0 32 32" className={`${baseClasses} ${isSelected ? selectedClasses : unselectedClasses} rounded-md p-1`}>
      {iconSvg()}
    </svg>
  );
};

export const ShapePalette: React.FC<ShapePaletteProps> = ({ onSelectShape, currentShape }) => {
    const shapes = Object.values(FlowchartShape);

    return (
        <div className="absolute top-28 left-2 bg-gray-800/80 backdrop-blur-sm border border-blue-500/20 p-2 rounded-lg shadow-lg flex flex-col gap-2 z-20">
            <h4 className="text-xs text-gray-400 font-semibold mb-1 px-1">Shapes</h4>
            {shapes.map(shape => (
                <button key={shape} onClick={() => onSelectShape(shape)} title={shape}>
                    <ShapeIcon shape={shape} isSelected={currentShape === shape} />
                </button>
            ))}
        </div>
    );
};
