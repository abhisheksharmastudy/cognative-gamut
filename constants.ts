import { DiagramType } from './types';

export const DIAGRAM_TYPES: { value: DiagramType; label: string }[] = [
  { value: DiagramType.NetworkDiagram, label: 'Network Diagram' },
  { value: DiagramType.MindMap, label: 'Mind Map' },
  { value: DiagramType.ConceptMap, label: 'Concept Map' },
  { value: DiagramType.TreeDiagram, label: 'Tree Diagram' },
  { value: DiagramType.Flowchart, label: 'Flowchart' },
  { value: DiagramType.SWOTAnalysis, label: 'SWOT Analysis' },
  // Adding a few more from the user's list as examples
  { value: DiagramType.SemanticMap, label: 'Semantic Map' },
  // Venn diagrams and others require more complex non-node/link rendering logic
  // and are placeholders for future implementation.
  // { value: DiagramType.VennDiagram, label: 'Venn Diagram' },
];