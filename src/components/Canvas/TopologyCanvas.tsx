import { useCallback, useEffect, useMemo, useRef, type DragEvent } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  SelectionMode,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type NodeMouseHandler,
  type OnNodesChange,
  type Viewport,
} from 'reactflow';
import { useAppStore } from '../../store/useAppStore';
import { nodeTypes } from '../NodeTypes';
import type { DiagramNode } from '../../types/diagram';
import { ASSET_DND_MIME } from '../../constants/dnd';
import { buildFutureSmartEdge } from '../../utils/edgeRouting';
import SeparatedStepEdge from './SeparatedStepEdge';

const toFlowNode = (node: DiagramNode, focusedNodeId?: string): Node => {
  if (node.type === 'zone') {
    return {
      id: node.id,
      type: 'zone',
      position: node.position,
      data: node.data,
      style: { width: node.size.width, height: node.size.height },
      resizable: true,
      draggable: true,
      selectable: true,
      zIndex: -10,
    };
  }

  return {
    id: node.id,
    type: 'asset',
    position: node.position,
    data: {
      ...node.data,
      status: node.id === focusedNodeId ? 'selected' : 'default',
    },
    draggable: true,
    selectable: true,
    zIndex: 10,
  };
};

const TopologyCanvas = () => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const { screenToFlowPosition, setCenter, setViewport, fitView, getViewport } = useReactFlow();

  const nodes = useAppStore((state) => state.nodes);
  const edges = useAppStore((state) => state.edges);
  const viewport = useAppStore((state) => state.viewport);
  const setNodes = useAppStore((state) => state.setNodes);
  const setViewportState = useAppStore((state) => state.setViewport);
  const addEdgeFromConnection = useAppStore((state) => state.addEdgeFromConnection);
  const removeEdge = useAppStore((state) => state.removeEdge);
  const recomputeOwnershipForAll = useAppStore((state) => state.recomputeOwnershipForAll);
  const createNodeFromAsset = useAppStore((state) => state.createNodeFromAsset);
  const setSelectedNodeId = useAppStore((state) => state.setSelectedNodeId);
  const setSelectedEdgeId = useAppStore((state) => state.setSelectedEdgeId);
  const selectedEdgeId = useAppStore((state) => state.selectedEdgeId);
  const focusedNodeId = useAppStore((state) => state.focusedNodeId);
  const clearFocusedNode = useAppStore((state) => state.clearFocusedNode);
  const pendingFitViewForExport = useAppStore((state) => state.pendingFitViewForExport);
  const clearFitViewForExport = useAppStore((state) => state.clearFitViewForExport);

  const flowNodes = useMemo(() => nodes.map((node) => toFlowNode(node, focusedNodeId)), [nodes, focusedNodeId]);
  const flowEdges = useMemo(() => {
    const targetLaneCounter = new Map<string, number>();

    return edges.map((edge): Edge => {
      const laneIndex = targetLaneCounter.get(edge.target) ?? 0;
      targetLaneCounter.set(edge.target, laneIndex + 1);

      const laneOffset = (laneIndex - (targetLaneCounter.get(edge.target)! - 1) / 2) * 20;

      return {
        ...edge,
        type: 'separatedStep',
        data: { laneOffset },
        zIndex: 5,
        selected: selectedEdgeId === edge.id,
        style:
          selectedEdgeId === edge.id
            ? { stroke: '#475569', strokeWidth: 2.2 }
            : { stroke: '#94a3b8', strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: selectedEdgeId === edge.id ? '#475569' : '#94a3b8' },
      };
    });
  }, [edges, selectedEdgeId]);

  const handleNodesChange: OnNodesChange = (changes) => {
    const positionChanges = new Map<string, { x: number; y: number }>();

    changes.forEach((change: NodeChange) => {
      if (change.type === 'position' && change.position) {
        positionChanges.set(change.id, change.position);
      }
    });

    if (positionChanges.size === 0) return;

    const nextNodes = nodes.map((node) => {
      const nextPosition = positionChanges.get(node.id);
      if (!nextPosition) return node;

      return {
        ...node,
        position: nextPosition,
      };
    });

    setNodes(nextNodes);
  };

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const assetId = event.dataTransfer.getData(ASSET_DND_MIME);
      if (!assetId || !wrapperRef.current) return;

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

      createNodeFromAsset({ assetId, position });
      recomputeOwnershipForAll();
    },
    [createNodeFromAsset, recomputeOwnershipForAll, screenToFlowPosition],
  );

  const onNodeClick: NodeMouseHandler = (event, node) => {
    event.stopPropagation();
    setSelectedNodeId(node.id);
    setSelectedEdgeId(undefined);
    clearFocusedNode();
  };

  useEffect(() => {
    const current = getViewport();
    const changed =
      Math.abs(current.x - viewport.x) > 0.5 ||
      Math.abs(current.y - viewport.y) > 0.5 ||
      Math.abs(current.zoom - viewport.zoom) > 0.001;

    if (changed) {
      setViewport(viewport, { duration: 0 });
    }
  }, [getViewport, setViewport, viewport]);

  useEffect(() => {
    if (!focusedNodeId) return;

    const target = nodes.find((node) => node.id === focusedNodeId);
    if (!target) return;

    setCenter(target.position.x + 120, target.position.y + 40, {
      zoom: 1.2,
      duration: 300,
    });
    setSelectedNodeId(focusedNodeId);
  }, [focusedNodeId, nodes, setCenter, setSelectedNodeId]);


  useEffect(() => {
    if (!pendingFitViewForExport) return;
    fitView({ padding: 0.2, duration: 280 });
    const timer = window.setTimeout(() => clearFitViewForExport(), 320);
    return () => window.clearTimeout(timer);
  }, [clearFitViewForExport, fitView, pendingFitViewForExport]);
  return (
    <section id="topology-canvas-export" className="h-full rounded-2xl border border-slate-200 bg-white/70 shadow-mica backdrop-blur-sm">
      <div ref={wrapperRef} className="h-full w-full" onDragOver={onDragOver} onDrop={onDrop}>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          edgeTypes={{ separatedStep: SeparatedStepEdge }}
          selectionOnDrag
          panOnDrag
          zoomOnScroll
          zoomOnPinch
          panOnScroll
          selectionMode={SelectionMode.Partial}
          fitView
          deleteKeyCode={null}
          defaultEdgeOptions={{ type: 'separatedStep', style: { stroke: '#94a3b8', strokeWidth: 1.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' } }}
          onConnect={(connection: Connection) => {
            buildFutureSmartEdge(connection);
            addEdgeFromConnection(connection);
          }}
          onMoveEnd={(_, nextViewport: Viewport) => setViewportState(nextViewport)}
          onNodesChange={handleNodesChange}
          onNodeDragStop={() => recomputeOwnershipForAll()}
          onNodeClick={onNodeClick}
          onEdgeClick={(event, edge) => {
            event.stopPropagation();
            setSelectedEdgeId(edge.id);
            setSelectedNodeId(undefined);
          }}
          onEdgeDoubleClick={(_, edge) => removeEdge(edge.id)}
          onPaneClick={(event) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest('.react-flow__node') || target?.closest('.react-flow__edge')) return;
            setSelectedNodeId(undefined);
            setSelectedEdgeId(undefined);
            clearFocusedNode();
          }}
          className="rounded-2xl"
        >
          <Background color="#cbd5e1" size={1.2} gap={24} />
          <Controls showInteractive={false} position="bottom-right" />
          <MiniMap pannable zoomable className="!bg-white/90" />
        </ReactFlow>
      </div>
    </section>
  );
};

export default TopologyCanvas;
