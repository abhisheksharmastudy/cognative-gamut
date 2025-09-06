import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import type { Keyword, DiagramType } from '../types';
import { DiagramType as DiagramTypeEnum } from '../types';
import { PlayIcon } from './common/Icon';

interface VisualizationCanvasProps {
  diagramType: DiagramType;
  isLoading: boolean;
  keywords: Keyword[];
}

interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  description: string;
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  source: string | D3Node;
  target: string | D3Node;
}

export const VisualizationCanvas: React.FC<VisualizationCanvasProps> = ({ diagramType, isLoading, keywords }) => {
  const d3Container = useRef<SVGSVGElement | null>(null);
  const [nodes, setNodes] = useState<D3Node[]>([]);
  const [links, setLinks] = useState<D3Link[]>([]);
  
  const [selectedElement, setSelectedElement] = useState<{type: 'node' | 'link', data: D3Node | D3Link} | null>(null);
  const [linkingState, setLinkingState] = useState<{source: D3Node} | null>(null);
  
  const keywordBank = keywords.filter(k => !nodes.some(n => n.id === k.name));
  
  const handleAddNode = useCallback((keyword: Keyword, x?: number, y?: number) => {
      setNodes(prev => [...prev, { id: keyword.name, description: keyword.description, x, y }]);
  }, []);
  
  const handleDelete = useCallback((e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement) {
          if (selectedElement.type === 'node') {
              const nodeId = (selectedElement.data as D3Node).id;
              setNodes(prev => prev.filter(n => n.id !== nodeId));
              setLinks(prev => prev.filter(l => (l.source as D3Node).id !== nodeId && (l.target as D3Node).id !== nodeId));
          } else { // link
              setLinks(prev => prev.filter(l => l !== selectedElement.data));
          }
          setSelectedElement(null);
      }
  }, [selectedElement]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleDelete);
    return () => {
        window.removeEventListener('keydown', handleDelete);
    };
  }, [handleDelete]);


  useEffect(() => {
    if (!d3Container.current) return;
    const svg = d3.select(d3Container.current);
    const { width, height } = d3Container.current.getBoundingClientRect();
    
    svg.selectAll("*").remove(); // Clear previous rendering

    const renderSwotTemplate = () => {
        const categories = [
            { name: 'Strengths', color: '#10b981' }, { name: 'Weaknesses', color: '#f43f5e' },
            { name: 'Opportunities', color: '#3b82f6' }, { name: 'Threats', color: '#f97316' },
        ];
        const gridWidth = width / 2 - 20;
        const gridHeight = height / 2 - 20;

        const container = svg.append('g').attr('transform', `translate(10, 10)`);
        
        const cells = container.selectAll('g').data(categories).join('g')
            .attr('transform', (d, i) => `translate(${(i % 2) * (gridWidth + 20)}, ${Math.floor(i / 2) * (gridHeight + 20)})`);

        cells.append('rect')
            .attr('width', gridWidth).attr('height', gridHeight)
            .attr('fill', '#1f2937').attr('stroke', d => d.color).attr('rx', 8);

        cells.append('text')
            .attr('x', 15).attr('y', 25)
            .text(d => d.name).attr('fill', d => d.color)
            .style('font-size', '18px').style('font-weight', 'bold');
    };

    const setupForceDirected = () => {
        const nodeRadius = 16;
        const simulation = d3.forceSimulation(nodes)
          .force("link", d3.forceLink(links).id((d: any) => d.id).distance(150))
          .force("charge", d3.forceManyBody().strength(-500))
          .force("center", d3.forceCenter(width / 2, height / 2))
          .force("collide", d3.forceCollide().radius(50));

        // Create groups for links to hold a visible line and a hitbox
        const linkGroup = svg.append("g")
            .attr("class", "links")
            .selectAll("g")
            .data(links)
            .join("g")
            .style("cursor", "pointer")
            .on('click', (event, d) => {
                setSelectedElement({type: 'link', data: d});
                setLinkingState(null); // Deselect nodes if a link is clicked
                event.stopPropagation();
            });
        
        // Visible line
        linkGroup.append("line")
            .attr("class", "link-visible")
            .attr("stroke-opacity", 0.7)
            .attr("stroke", d => (selectedElement?.type === 'link' && selectedElement.data === d) ? '#f43f5e' : '#6b7280')
            .attr("stroke-width", d => (selectedElement?.type === 'link' && selectedElement.data === d) ? 5 : 2);

        // Invisible hitbox for easier clicking
        linkGroup.append("line")
            .attr("class", "link-hitbox")
            .attr("stroke", "transparent")
            .attr("stroke-width", 12);

        const nodeGroup = svg.append("g").selectAll("g").data(nodes).join("g")
          .on('click', (event, d) => {
              if (linkingState && linkingState.source.id !== d.id) {
                  setLinks(prev => [...prev, { source: linkingState.source.id, target: d.id }]);
                  setLinkingState(null);
              } else {
                  setSelectedElement({type: 'node', data: d});
                  setLinkingState(null);
              }
              event.stopPropagation();
          })
          .on('dblclick', (event, d) => {
              setLinkingState({ source: d });
              setSelectedElement(null);
              event.stopPropagation();
          })
          .call(d3.drag<any, D3Node>()
              .on("start", (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
              .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
              .on("end", (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));

        nodeGroup.append("circle")
          .attr("r", d => selectedElement?.type === 'node' && selectedElement.data === d ? 16 : 12)
          .attr("fill", d => linkingState?.source.id === d.id ? "#f97316" : "#6366f1")
          .attr("stroke", d => selectedElement?.type === 'node' && selectedElement.data === d ? "#ef4444" : "#a5b4fc")
          .attr("stroke-width", 2);

        nodeGroup.append("text")
          .text(d => d.id).attr("x", 18).attr("y", 6)
          .attr("fill", "#e0e7ff").style("font-size", "14px").style("pointer-events", "none");
          
        nodeGroup.append("title").text(d => d.description);

        simulation.on("tick", () => {
          // Add bounding box constraint
          nodes.forEach(node => {
              node.x = Math.max(nodeRadius, Math.min(width - nodeRadius, node.x!));
              node.y = Math.max(nodeRadius, Math.min(height - nodeRadius, node.y!));
          });
          
          // Fix: Explicitly type `d` as D3Link to resolve TypeScript error where `d` was inferred as `unknown`.
          linkGroup.selectAll('line')
            .attr("x1", (d: D3Link) => (d.source as D3Node).x ?? 0)
            .attr("y1", (d: D3Link) => (d.source as D3Node).y ?? 0)
            .attr("x2", (d: D3Link) => (d.target as D3Node).x ?? 0)
            .attr("y2", (d: D3Link) => (d.target as D3Node).y ?? 0);

          nodeGroup.attr("transform", (d: D3Node) => `translate(${d.x},${d.y})`);
        });
        
        // Add visual feedback for linking
        if (linkingState) {
            const linkingLine = svg.append('line')
                .attr('stroke', '#f97316')
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', '4, 4')
                .style('pointer-events', 'none')
                .attr('x1', linkingState.source.x ?? 0)
                .attr('y1', linkingState.source.y ?? 0)
                .attr('x2', linkingState.source.x ?? 0)
                .attr('y2', linkingState.source.y ?? 0);
            
            svg.on('mousemove', (event) => {
                const [mx, my] = d3.pointer(event);
                linkingLine.attr('x2', mx).attr('y2', my);
            });
            
            simulation.on('tick.linking', () => {
                linkingLine
                    .attr('x1', linkingState.source.x!)
                    .attr('y1', linkingState.source.y!);
            });
        }
        
        svg.on('click', () => {
            setSelectedElement(null);
            setLinkingState(null);
        });
    }

    switch (diagramType) {
        case DiagramTypeEnum.SWOTAnalysis:
            renderSwotTemplate();
            setupForceDirected(); // also allow nodes on swot
            break;
        case DiagramTypeEnum.MindMap:
        case DiagramTypeEnum.TreeDiagram:
        case DiagramTypeEnum.NetworkDiagram:
        case DiagramTypeEnum.ConceptMap:
        case DiagramTypeEnum.SemanticMap:
        case DiagramTypeEnum.Flowchart:
        default:
            setupForceDirected();
            break;
    }

  }, [diagramType, nodes, links, selectedElement, linkingState]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, keyword: Keyword) => {
      const data = JSON.stringify(keyword);
      e.dataTransfer.setData("application/json", data);
      e.dataTransfer.setData("text/plain", data); // Add a fallback for compatibility
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      try {
        // Try to get the data, first from 'application/json', then from 'text/plain' as a fallback.
        let keywordStr = e.dataTransfer.getData("application/json");
        if (!keywordStr) {
            keywordStr = e.dataTransfer.getData("text/plain");
        }
        
        // If there's still no data, exit gracefully.
        if (!keywordStr) {
            console.warn("No keyword data found in drag-and-drop operation.");
            return;
        }

        const keyword = JSON.parse(keywordStr) as Keyword;
        const svgRect = d3Container.current?.getBoundingClientRect();
        if (svgRect) {
            const x = e.clientX - svgRect.left;
            const y = e.clientY - svgRect.top;
            handleAddNode(keyword, x, y);
        }
      } catch (error) {
        // Catch any parsing errors and log them without crashing the app.
        console.error("Failed to parse dropped keyword data:", error);
      }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg border border-blue-500/20 flex-grow relative flex flex-col h-full">
      <div className="p-2 border-b border-blue-500/20">
          <h3 className="text-sm font-semibold text-blue-300 mb-2">Keyword Bank ({keywordBank.length})</h3>
          <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
              {keywordBank.map(kw => (
                  <div key={kw.name} 
                       draggable 
                       onDragStart={(e) => handleDragStart(e, kw)}
                       className="bg-gray-700 hover:bg-gray-600 text-xs text-gray-200 px-2 py-1 rounded-md cursor-grab"
                       title={kw.description}
                  >
                      {kw.name}
                  </div>
              ))}
          </div>
      </div>
      <div className="flex-grow relative" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
        {(keywords.length === 0 && !isLoading) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-gray-500">
            <PlayIcon />
            <p className="mt-4 text-lg">Your interactive canvas is ready.</p>
            <p>First, extract some keywords from your text to begin building.</p>
            </div>
        )}
        <svg
            ref={d3Container}
            className="w-full h-full"
        />
      </div>
    </div>
  );
};