// Fix: Import d3 types to resolve 'Cannot find namespace 'd3'' error.
import * as d3 from 'd3';

export enum DiagramType {
  MindMap = 'MindMap',
  SemanticMap = 'SemanticMap',
  ConceptMap = 'ConceptMap',
  VennDiagram = 'VennDiagram',
  NetworkDiagram = 'NetworkDiagram',
  Flowchart = 'Flowchart',
  TreeDiagram = 'TreeDiagram',
  SWOTAnalysis = 'SWOTAnalysis',
}


export interface Keyword {
  name: string;
  description: string;
}

export interface ExtractedData {
  keywords: Keyword[];
}
