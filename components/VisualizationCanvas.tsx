import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import type { Keyword, DiagramType } from '../types';
import { DiagramType as DiagramTypeEnum } from '../types';
import { PlayIcon } from './common/Icon';
import { ShapePalette } from './common/ShapePalette';

interface VisualizationCanvasProps {
  diagramType: DiagramType;
  isLoading: boolean;
  keywords: Keyword[];
}

export enum FlowchartShape {
  Rectangle = 'Rectangle',
  Oval = 'Oval',
  Diamond = 'Diamond',
  Parallelogram = 'Parallelogram',
}

interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  description: string;
  shape?: FlowchartShape;
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
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  
  const keywordBank = keywords.filter(k => !nodes.some(n => n.id === k.name));
  
  const handleAddNode = useCallback((keyword: Keyword, x?: number, y?: number) => {
      setNodes(prev => [...prev, {
        id: keyword.name,
        description: keyword.description,
        shape: FlowchartShape.Rectangle,
        x,
        y
      }]);
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

  const handleSelectShape = useCallback((shape: FlowchartShape) => {
    if (selectedElement?.type === 'node') {
        const updatedNodes = nodes.map(n =>
            n.id === (selectedElement.data as D3Node).id ? { ...n, shape } : n
        );
        setNodes(updatedNodes);
        // Also update the selected element to re-render with new data
        const updatedSelected = updatedNodes.find(n => n.id === (selectedElement.data as D3Node).id);
        if(updatedSelected) {
            setSelectedElement({type: 'node', data: updatedSelected});
        }
    }
  }, [nodes, selectedElement]);


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

    const renderGrid = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, width: number, height: number) => {
        const gridSize = 20;
        const gridGroup = svg.insert('g', ':first-child')
            .attr('class', 'grid-group')
            .attr('pointer-events', 'none');

        const verticalLines = d3.range(gridSize, width, gridSize);
        const horizontalLines = d3.range(gridSize, height, gridSize);

        gridGroup.selectAll('.vertical-line')
            .data(verticalLines)
            .join('line')
            .attr('class', 'vertical-line')
            .attr('x1', d => d)
            .attr('y1', 0)
            .attr('x2', d => d)
            .attr('y2', height)
            .attr('stroke', '#374151')
            .attr('stroke-width', 0.5);

        gridGroup.selectAll('.horizontal-line')
            .data(horizontalLines)
            .join('line')
            .attr('class', 'horizontal-line')
            .attr('x1', 0)
            .attr('y1', d => d)
            .attr('x2', width)
            .attr('y2', d => d)
            .attr('stroke', '#374151')
            .attr('stroke-width', 0.5);
    };

    const renderFlowchart = () => {
        if (!d3Container.current) return;
        const svg = d3.select(d3Container.current);
        const { width, height } = d3Container.current.getBoundingClientRect();

        svg.selectAll("*").remove(); // Clear previous rendering
        renderGrid(svg, width, height);

        // Define arrowhead marker
        const defs = svg.append('defs');
        defs.append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '-0 -5 10 10')
            .attr('refX', 10)
            .attr('refY', 0)
            .attr('orient', 'auto')
            .attr('markerWidth', 5)
            .attr('markerHeight', 5)
            .append('svg:path')
            .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
            .attr('fill', '#9ca3af');

        // Render links
        const linkGroup = svg.append("g").selectAll("g").data(links).join("g")
            .attr('class', 'links');

        linkGroup.append("line")
            .each(function(d) {
                const line = d3.select(this);
                const source = d.source as D3Node;
                const target = d.target as D3Node;

                if (!source.x || !source.y || !target.x || !target.y) return;

                const dx = target.x - source.x;
                const dy = target.y - source.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance === 0) return;

                const targetPadding = 45;
                const sourcePadding = 15;

                const x1 = source.x + (dx / distance) * sourcePadding;
                const y1 = source.y + (dy / distance) * sourcePadding;
                const x2 = target.x - (dx / distance) * targetPadding;
                const y2 = target.y - (dy / distance) * targetPadding;

                line.attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2);
            })
            .attr("stroke", "#9ca3af")
            .attr("stroke-width", 2)
            .attr("marker-end", "url(#arrowhead)");

        const nodeGroup = svg.append("g").selectAll("g").data(nodes).join("g")
            .attr("id", d => `node-${d.id.replace(/[^a-zA-Z0-9]/g, '-')}`)
            .attr("transform", d => `translate(${d.x || width / 2}, ${d.y || height / 2})`)
            .on('click', (event, d) => {
                if (linkingState && linkingState.source.id !== d.id) {
                    setLinks(prev => [...prev, { source: linkingState.source.id, target: d.id }]);
                    setLinkingState(null);
                } else {
                    setSelectedElement({type: 'node', data: d});
                    setEditingNodeId(null);
                }
                event.stopPropagation();
            })
            .on('dblclick', (event, d) => {
                event.stopPropagation();
                if(event.altKey) { // Alt+DblClick to edit
                    setSelectedElement(null);
                    setEditingNodeId(d.id);
                } else { // DblClick to link
                    setSelectedElement(null);
                    setLinkingState({ source: d });
                }
            })
            .call(d3.drag<any, D3Node>()
                .on("drag", (event, d) => {
                    if (editingNodeId) return;
                    const gridSize = 20;
                    const newX = Math.round(event.x / gridSize) * gridSize;
                    const newY = Math.round(event.y / gridSize) * gridSize;

                    const updatedNodes = nodes.map(n =>
                        n.id === d.id ? { ...n, x: newX, y: newY } : n
                    );
                    setNodes(updatedNodes);
                })
            );

        nodeGroup.each(function(d) {
            const group = d3.select(this);
            const isSelected = selectedElement?.type === 'node' && selectedElement.data.id === d.id;
            const isLinkingSource = linkingState?.source.id === d.id;
            const nodeWidth = 140;
            const nodeHeight = 70;
            let strokeColor = isSelected ? '#3b82f6' : '#6b7280';
            if (isLinkingSource) strokeColor = '#f97316';
            const strokeWidth = isSelected || isLinkingSource ? 3 : 2;
            const nodeColor = '#2d3748';

            const defs = svg.append('defs');
            const filter = defs.append('filter')
                .attr('id', 'drop-shadow')
                .attr('height', '130%');
            filter.append('feGaussianBlur').attr('in', 'SourceAlpha').attr('stdDeviation', 3);
            filter.append('feOffset').attr('dx', 2).attr('dy', 2);
            const feMerge = filter.append('feMerge');
            feMerge.append('feMergeNode');
            feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
            group.style('filter', 'url(#drop-shadow)');

            const drawShape = (shapeType: FlowchartShape | undefined) => {
                switch (shapeType) {
                    case FlowchartShape.Oval: return group.append('ellipse').attr('rx', nodeWidth / 2).attr('ry', nodeHeight / 2);
                    case FlowchartShape.Diamond: return group.append('path').attr('d', `M0,-${nodeHeight/2} L${nodeWidth/2},0 L0,${nodeHeight/2} L-${nodeWidth/2},0 Z`);
                    case FlowchartShape.Parallelogram: return group.append('path').attr('d', `M${nodeWidth*0.15},-${nodeHeight/2} L${nodeWidth/2},-${nodeHeight/2} L-${nodeWidth*0.15},${nodeHeight/2} L-${nodeWidth/2},${nodeHeight/2} Z`);
                    default: return group.append('rect').attr('x', -nodeWidth / 2).attr('y', -nodeHeight / 2).attr('width', nodeWidth).attr('height', nodeHeight).attr('rx', 8);
                }
            }

            drawShape(d.shape).attr('fill', nodeColor).attr('stroke', strokeColor).attr('stroke-width', strokeWidth);

            if (editingNodeId === d.id) {
                group.selectAll('rect, ellipse, path').attr('opacity', 0.1);
                const fo = group.append('foreignObject').attr('x', -nodeWidth/2).attr('y', -nodeHeight/2).attr('width', nodeWidth).attr('height', nodeHeight);
                const form = fo.append('xhtml:form');
                const textarea = form.append('xhtml:textarea').text(d.id)
                    .attr('class', 'bg-transparent text-white text-center w-full h-full resize-none border-2 border-blue-500 rounded-lg focus:outline-none p-2')
                    .style('width', `${nodeWidth}px`).style('height', `${nodeHeight}px`);
                textarea.node()?.select();
                form.on('submit', (event) => {
                    event.preventDefault();
                    const newId = textarea.node()?.value || d.id;
                    const updatedNodes = nodes.map(n => n.id === d.id ? { ...n, id: newId } : n);
                    setNodes(updatedNodes);
                    setEditingNodeId(null);
                });
                textarea.on('blur', () => {
                    const newId = textarea.node()?.value || d.id;
                    const updatedNodes = nodes.map(n => n.id === d.id ? { ...n, id: newId } : n);
                    setNodes(updatedNodes);
                    setEditingNodeId(null);
                });
            } else {
                const text = group.append("text").text(d.id).attr("fill", "#e2e8f0").attr("text-anchor", "middle").attr("alignment-baseline", "middle").style('pointer-events', 'none');
                const textElement = text.node();
                if(textElement) {
                    const words = d.id.split(/\s+/).reverse();
                    let word, line: string[] = [], lineNumber = 0;
                    const lineHeight = 1.2, y = text.attr("y") || 0, dy = 0;
                    let tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
                    while (word = words.pop()) {
                        line.push(word);
                        tspan.text(line.join(" "));
                        if (tspan.node()!.getComputedTextLength() > nodeWidth - 20) {
                            line.pop();
                            tspan.text(line.join(" "));
                            line = [word];
                            tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + "em").text(word);
                        }
                    }
                    const textBlockHeight = textElement.getBBox().height;
                    text.attr('transform', `translate(0, -${textBlockHeight / 4})`);
                }
            }
        });

        if (linkingState) {
            const linkingLine = svg.append('line').attr('class', 'linking-line')
                .attr('x1', linkingState.source.x || 0).attr('y1', linkingState.source.y || 0)
                .attr('x2', linkingState.source.x || 0).attr('y2', linkingState.source.y || 0)
                .attr('stroke', '#f97316').attr('stroke-width', 2).attr('stroke-dasharray', '5, 5')
                .style('pointer-events', 'none');
            svg.on('mousemove.linking', (event) => {
                const [mx, my] = d3.pointer(event);
                linkingLine.attr('x2', mx).attr('y2', my);
            });
        }

        svg.on('click', () => {
            setSelectedElement(null);
            setEditingNodeId(null);
            if(linkingState) {
                setLinkingState(null);
                svg.on('mousemove.linking', null);
            }
        });
    };

    switch (diagramType) {
        case DiagramTypeEnum.SWOTAnalysis:
            renderSwotTemplate();
            setupForceDirected(); // also allow nodes on swot
            break;
        case DiagramTypeEnum.Flowchart:
            renderFlowchart();
            break;
        case DiagramTypeEnum.MindMap:
        case DiagramTypeEnum.TreeDiagram:
        case DiagramTypeEnum.NetworkDiagram:
        case DiagramTypeEnum.ConceptMap:
        case DiagramTypeEnum.SemanticMap:
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
      {diagramType === DiagramTypeEnum.Flowchart && selectedElement?.type === 'node' && (
        <ShapePalette
          onSelectShape={handleSelectShape}
          currentShape={(selectedElement.data as D3Node).shape}
        />
      )}
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