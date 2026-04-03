import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  Node,
  SelectionMode
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useMemo, useRef } from 'react';
import { SmartStepEdge } from '@tisoap/react-flow-smart-edge';
import { AssetNode } from '../NodeTypes/AssetNode';
import { ZoneNode } from '../NodeTypes/ZoneNode';
import { useAssessorStore } from '../../store/useAssessorStore';

const nodeTypes = {
  assetNode: AssetNode,
  zoneNode: ZoneNode
};

const edgeTypes = {
  smart: SmartStepEdge
};

const FlowInner = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rf = useReactFlow();
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addAssetNode,
    markNodeInZone,
    setSelection
  } = useAssessorStore();

  const zones = useMemo(() => nodes.filter((node) => node.type === 'zoneNode'), [nodes]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const assetId = event.dataTransfer.getData('application/assessor-asset-id');
      if (!assetId || !wrapperRef.current) return;
      const bounds = wrapperRef.current.getBoundingClientRect();
      const position = rf.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top
      });
      addAssetNode(assetId, position);
    },
    [addAssetNode, rf]
  );

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'zoneNode') return;
      const targetZone = zones.find((zone) => {
        const width = Number(zone.style?.width ?? 420);
        const height = Number(zone.style?.height ?? 260);
        return (
          node.position.x >= zone.position.x &&
          node.position.y >= zone.position.y &&
          node.position.x <= zone.position.x + width &&
          node.position.y <= zone.position.y + height
        );
      });

      markNodeInZone(node.id, targetZone?.id);
    },
    [markNodeInZone, zones]
  );

  return (
    <div ref={wrapperRef} className="h-full w-full" onDrop={onDrop} onDragOver={(event) => event.preventDefault()}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onSelectionChange={({ nodes: n, edges: e }) => setSelection(n.map((item) => item.id), e.map((item) => item.id))}
        defaultEdgeOptions={{
          type: 'smart',
          style: { stroke: '#94a3b8', strokeWidth: 1.6 }
        }}
        fitView
        selectionMode={SelectionMode.Partial}
      >
        <MiniMap />
        <Controls />
        <Background id="dot-grid" color="#cbd5e1" gap={24} size={1.2} variant={BackgroundVariant.Dots} />
      </ReactFlow>
    </div>
  );
};

export const FlowCanvas = () => (
  <ReactFlowProvider>
    <FlowInner />
  </ReactFlowProvider>
);
