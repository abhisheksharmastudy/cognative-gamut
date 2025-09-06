import React, { useState, useCallback } from 'react';
import { InputArea } from './components/InputArea';
import { KeywordPanel } from './components/KeywordPanel';
import { ControlPanel } from './components/ControlPanel';
import { VisualizationCanvas } from './components/VisualizationCanvas';
import { Spinner } from './components/common/Spinner';
import type { ExtractedData, Keyword, DiagramType } from './types';
import { extractKeywords } from './services/geminiService';
import { extractTextFromPdf } from './services/pdfService';
import { DiagramType as DiagramTypeEnum } from './types';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<'input' | 'visuals'>('input');
  
  const [diagramType, setDiagramType] = useState<DiagramType>(DiagramTypeEnum.NetworkDiagram);
  const [diagramKey, setDiagramKey] = useState<number>(0); // Key to force re-render of canvas

  const handleTextSubmit = useCallback(async (text: string) => {
    if (!text.trim()) {
      setError('Input text cannot be empty.');
      return;
    }
    setIsLoading(true);
    setLoadingMessage('Extracting keywords with Gemini...');
    setError(null);
    setExtractedData(null);
    setSelectedKeywords([]);
    
    try {
      const data = await extractKeywords(text);
      setExtractedData(data);
      setSelectedKeywords(data.keywords.map(k => k.name)); // Select all by default
      setActiveView('visuals');
    } catch (e) {
      console.error(e);
      setError('Failed to extract keywords. Please check your API key and try again.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);

  const handleFileSubmit = useCallback(async (file: File) => {
    setIsLoading(true);
    setLoadingMessage('Processing PDF file...');
    setError(null);
    try {
      const text = await extractTextFromPdf(file);
      await handleTextSubmit(text);
    } catch (e) {
      console.error(e);
      setError('Failed to process PDF file.');
      setIsLoading(false);
    }
  }, [handleTextSubmit]);
  
  const handleLoadTemplate = useCallback(() => {
    // Incrementing the key will cause the VisualizationCanvas to re-mount with a fresh state
    setDiagramKey(prev => prev + 1);
  }, []);

  const Header = () => (
    <header className="bg-gray-900/80 backdrop-blur-sm p-4 border-b border-blue-500/30 flex justify-between items-center fixed top-0 left-0 right-0 z-20">
      <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
        Cognitive Gamut
      </h1>
      <div className="flex space-x-2">
        <button onClick={() => setActiveView('input')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeView === 'input' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Input & Keywords</button>
        <button onClick={() => setActiveView('visuals')} disabled={!extractedData} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeView === 'visuals' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'}`}>Visualizer</button>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <Header />
      <main className="pt-20">
        {isLoading && <Spinner message={loadingMessage} />}
        {error && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-800/90 text-white p-4 rounded-lg shadow-xl z-30 max-w-md text-center">
            <p>{error}</p>
            <button onClick={() => setError(null)} className="absolute top-1 right-2 text-xl">&times;</button>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 h-[calc(100vh-80px)]">
          <aside className={`lg:col-span-3 flex flex-col gap-4 transition-transform duration-300 ${activeView === 'input' ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 absolute lg:static top-20 bottom-4 left-4 right-4 bg-gray-900 z-10 lg:z-0 p-4 lg:p-0 rounded-lg lg:rounded-none`}>
            <InputArea onTextSubmit={handleTextSubmit} onFileSubmit={handleFileSubmit} isLoading={isLoading} />
            {extractedData && (
              <KeywordPanel
                keywords={extractedData.keywords}
                selectedKeywords={selectedKeywords}
                setSelectedKeywords={setSelectedKeywords}
              />
            )}
          </aside>

          <div className={`lg:col-span-9 flex flex-col gap-4 transition-opacity duration-300 ${activeView === 'visuals' ? 'opacity-100' : 'opacity-0 pointer-events-none'} lg:opacity-100 lg:pointer-events-auto`}>
            <ControlPanel
                selectedDiagramType={diagramType}
                setSelectedDiagramType={setDiagramType}
                onGenerate={handleLoadTemplate}
                isLoading={isLoading}
                hasKeywords={selectedKeywords.length > 0}
            />
            <VisualizationCanvas
              key={diagramKey}
              diagramType={diagramType}
              isLoading={isLoading}
              keywords={extractedData?.keywords.filter(k => selectedKeywords.includes(k.name)) || []}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
