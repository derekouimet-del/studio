'use client';

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  NodeTypes,
  Position,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { ReconNode, ReconEdge, NodeType, RiskLevel } from '@/lib/recon-graph/types';

// Custom node component
function ReconNodeComponent({ data }: { data: { label: string; nodeType: NodeType; riskLevel?: RiskLevel; metadata?: Record<string, unknown> } }) {
  const { label, nodeType, riskLevel } = data;

  const getNodeStyles = () => {
    const baseStyles = 'px-3 py-2 rounded-lg border-2 font-medium text-sm transition-all shadow-lg hover:scale-105';
    
    switch (nodeType) {
      case 'root':
        return `${baseStyles} bg-primary text-primary-foreground border-primary min-w-[140px] text-center`;
      case 'subdomain':
        return `${baseStyles} bg-blue-500/20 text-blue-400 border-blue-500/50`;
      case 'ip':
        return `${baseStyles} bg-emerald-500/20 text-emerald-400 border-emerald-500/50`;
      case 'service':
        return `${baseStyles} bg-amber-500/20 text-amber-400 border-amber-500/50`;
      case 'technology':
        return `${baseStyles} bg-purple-500/20 text-purple-400 border-purple-500/50`;
      case 'cve':
        return `${baseStyles} ${getRiskStyles(riskLevel || 'high')}`;
      case 'ssl':
        return `${baseStyles} ${riskLevel === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'}`;
      case 'risk':
        return `${baseStyles} ${getRiskStyles(riskLevel || 'critical')} animate-pulse`;
      default:
        return `${baseStyles} bg-muted text-muted-foreground border-muted`;
    }
  };

  const getRiskStyles = (risk: RiskLevel) => {
    switch (risk) {
      case 'critical':
        return 'bg-red-600/30 text-red-300 border-red-500';
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'low':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      default:
        return '';
    }
  };

  const getIcon = () => {
    switch (nodeType) {
      case 'root':
        return (
          <svg className="size-4 inline mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        );
      case 'subdomain':
        return (
          <svg className="size-4 inline mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        );
      case 'ip':
        return (
          <svg className="size-4 inline mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
          </svg>
        );
      case 'service':
        return (
          <svg className="size-4 inline mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
          </svg>
        );
      case 'technology':
        return (
          <svg className="size-4 inline mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        );
      case 'cve':
        return (
          <svg className="size-4 inline mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case 'ssl':
        return (
          <svg className="size-4 inline mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        );
      case 'risk':
        return (
          <svg className="size-4 inline mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={getNodeStyles()}>
      {getIcon()}
      <span className="truncate max-w-[150px] inline-block align-middle">{label}</span>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  reconNode: ReconNodeComponent,
};

interface ReconFlowGraphProps {
  nodes: ReconNode[];
  edges: ReconEdge[];
  onNodeClick?: (node: ReconNode) => void;
}

export function ReconFlowGraph({ nodes, edges, onNodeClick }: ReconFlowGraphProps) {
  // Convert ReconNodes to ReactFlow nodes with hierarchical layout
  const flowNodes = useMemo(() => {
    const nodesByType: Record<NodeType, ReconNode[]> = {
      root: [],
      subdomain: [],
      ip: [],
      service: [],
      technology: [],
      cve: [],
      ssl: [],
      risk: [],
    };

    // Group nodes by type
    nodes.forEach(node => {
      nodesByType[node.type].push(node);
    });

    const result: Node[] = [];
    let currentY = 50;
    const layerSpacing = 150;
    const nodeSpacing = 200;

    // Layer 1: Root
    nodesByType.root.forEach((node, i) => {
      result.push({
        id: node.id,
        type: 'reconNode',
        position: { x: 400, y: currentY },
        data: { label: node.label, nodeType: node.type, riskLevel: node.riskLevel, metadata: node.metadata },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });
    });
    currentY += layerSpacing;

    // Layer 2: Subdomains + Technologies
    const layer2 = [...nodesByType.subdomain, ...nodesByType.technology, ...nodesByType.ssl, ...nodesByType.risk];
    const layer2Width = layer2.length * nodeSpacing;
    const layer2StartX = 400 - layer2Width / 2 + nodeSpacing / 2;
    layer2.forEach((node, i) => {
      result.push({
        id: node.id,
        type: 'reconNode',
        position: { x: layer2StartX + i * nodeSpacing, y: currentY },
        data: { label: node.label, nodeType: node.type, riskLevel: node.riskLevel, metadata: node.metadata },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });
    });
    if (layer2.length > 0) currentY += layerSpacing;

    // Layer 3: IPs
    const layer3Width = nodesByType.ip.length * nodeSpacing;
    const layer3StartX = 400 - layer3Width / 2 + nodeSpacing / 2;
    nodesByType.ip.forEach((node, i) => {
      result.push({
        id: node.id,
        type: 'reconNode',
        position: { x: layer3StartX + i * nodeSpacing, y: currentY },
        data: { label: node.label, nodeType: node.type, riskLevel: node.riskLevel, metadata: node.metadata },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });
    });
    if (nodesByType.ip.length > 0) currentY += layerSpacing;

    // Layer 4: Services
    const layer4Width = nodesByType.service.length * nodeSpacing;
    const layer4StartX = 400 - layer4Width / 2 + nodeSpacing / 2;
    nodesByType.service.forEach((node, i) => {
      result.push({
        id: node.id,
        type: 'reconNode',
        position: { x: layer4StartX + i * nodeSpacing, y: currentY },
        data: { label: node.label, nodeType: node.type, riskLevel: node.riskLevel, metadata: node.metadata },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });
    });
    if (nodesByType.service.length > 0) currentY += layerSpacing;

    // Layer 5: CVEs
    const layer5Width = nodesByType.cve.length * nodeSpacing;
    const layer5StartX = 400 - layer5Width / 2 + nodeSpacing / 2;
    nodesByType.cve.forEach((node, i) => {
      result.push({
        id: node.id,
        type: 'reconNode',
        position: { x: layer5StartX + i * nodeSpacing, y: currentY },
        data: { label: node.label, nodeType: node.type, riskLevel: node.riskLevel, metadata: node.metadata },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });
    });

    return result;
  }, [nodes]);

  // Convert ReconEdges to ReactFlow edges
  const flowEdges = useMemo(() => {
    return edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      animated: edge.label === 'vulnerable',
      style: { stroke: edge.label === 'vulnerable' ? '#ef4444' : '#525252', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edge.label === 'vulnerable' ? '#ef4444' : '#525252',
      },
      labelStyle: { fill: '#a1a1aa', fontSize: 10 },
      labelBgStyle: { fill: '#1f1f1f', fillOpacity: 0.8 },
    }));
  }, [edges]);

  const [nodesState, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const reconNode = nodes.find(n => n.id === node.id);
    if (reconNode && onNodeClick) {
      onNodeClick(reconNode);
    }
  }, [nodes, onNodeClick]);

  // Reset nodes when data changes
  useMemo(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  return (
    <div className="w-full h-full bg-card rounded-lg border overflow-hidden">
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.3}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#404040" gap={20} size={1} />
        <Controls className="bg-card border rounded-lg overflow-hidden [&>button]:bg-card [&>button]:text-foreground [&>button]:border-border [&>button:hover]:bg-muted" />
        <MiniMap 
          className="bg-card border rounded-lg overflow-hidden"
          nodeColor={(node) => {
            const type = node.data?.nodeType;
            switch (type) {
              case 'root': return 'hsl(238, 53%, 50%)';
              case 'subdomain': return '#3b82f6';
              case 'ip': return '#10b981';
              case 'service': return '#f59e0b';
              case 'technology': return '#a855f7';
              case 'cve': return '#ef4444';
              case 'ssl': return '#06b6d4';
              case 'risk': return '#dc2626';
              default: return '#525252';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.6)"
        />
      </ReactFlow>
    </div>
  );
}
