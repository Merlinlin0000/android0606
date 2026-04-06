import { nanoid } from 'nanoid';
import type { Connection } from 'reactflow';
import type { StateCreator } from 'zustand';
import type { AppStore } from '../useAppStore';
import type { AssetNodeData, DiagramEdge, DiagramNode, ZoneNodeData } from '../../types/diagram';
import { collectZoneSubtree, recomputeOwnership } from '../../utils/zoneOwnership';

interface HistoryEntry {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  assets: AppStore['assets'];
}

const cloneHistoryEntry = (entry: HistoryEntry): HistoryEntry => ({
  nodes: structuredClone(entry.nodes),
  edges: structuredClone(entry.edges),
  assets: structuredClone(entry.assets),
});

export interface DiagramSlice {
  diagramId: string;
  diagramName: string;
  diagramVersion: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  viewport: { x: number; y: number; zoom: number };
  historyPast: HistoryEntry[];
  historyFuture: HistoryEntry[];
  setDiagramMeta: (patch: { id?: string; name?: string; version?: string }) => void;
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
  setNodes: (nodes: DiagramNode[]) => void;
  setEdges: (edges: DiagramEdge[]) => void;
  addEdgeFromConnection: (connection: Connection) => void;
  createNodeFromAsset: (params: { assetId: string; position: { x: number; y: number }; instanceName?: string }) => string | undefined;
  createZoneNode: (params: { zoneId: string; position: { x: number; y: number }; parentId?: string; level?: number }) => string | undefined;
  duplicateAssetNodeInstance: (nodeId: string, offset?: { x: number; y: number }) => string | undefined;
  updateZoneNodeSize: (zoneNodeId: string, size: { width: number; height: number }) => void;
  updateZoneNodeColor: (zoneNodeId: string, color: string) => void;
  updateNodeInstanceData: (nodeId: string, patch: Partial<AssetNodeData | ZoneNodeData>) => void;
  updateEdgeColor: (edgeId: string, color: string) => void;
  removeNode: (nodeId: string) => void;
  removeEdge: (edgeId: string) => void;
  removeSelectedElement: () => void;
  removeZoneSubtree: (zoneNodeId: string) => void;
  recomputeOwnershipForAll: () => void;
  syncAssetFieldsToNodes: (assetId?: string) => void;
  pushHistoryCheckpoint: () => void;
  undo: () => void;
  redo: () => void;
  exportDocumentJson: (fileName?: string) => void;
  importDocumentJson: (payload: string) => void;
}

const mapAssetFieldsToNodeData = (nodeData: AssetNodeData, asset: AppStore['assets'][string]): AssetNodeData => ({
  ...nodeData,
  label: asset.name,
  type: asset.type,
  ip: asset.ip,
  model: asset.model,
  notes: asset.notes,
  zoneId: nodeData.zoneId,
});

const buildInstanceBaseName = (label: string, ip: string) => `${label}_${ip}`;

const makeNextInstanceName = (baseName: string, usedNames: Set<string>) => {
  if (!usedNames.has(baseName)) return baseName;

  let index = 2;
  while (usedNames.has(`${baseName}_${index}`)) {
    index += 1;
  }

  return `${baseName}_${index}`;
};

export const createDiagramSlice: StateCreator<AppStore, [], [], DiagramSlice> = (set, get) => ({
  diagramId: 'diagram-demo',
  diagramName: 'Untitled Diagram',
  diagramVersion: '1.0.0',
  nodes: [
    {
      id: 'node-zone-1',
      type: 'zone',
      position: { x: 120, y: 80 },
      size: { width: 620, height: 360 },
      data: { zoneId: 'zone-prod', label: 'Production Zone', color: '#38bdf8', description: '核心生产区域', level: 0 },
      hierarchyPath: [],
    },
    {
      id: 'node-asset-1',
      type: 'asset',
      position: { x: 220, y: 170 },
      data: { assetId: 'asset-fw-1', label: 'HQ Firewall', type: 'Firewall', ip: '10.10.0.1', model: 'PA-VM', zoneId: 'node-zone-1', status: 'default' },
      parentId: 'node-zone-1',
      hierarchyPath: ['node-zone-1'],
    },
  ],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  historyPast: [],
  historyFuture: [],

  setDiagramMeta: ({ id, name, version }) => set((state) => ({ diagramId: id ?? state.diagramId, diagramName: name ?? state.diagramName, diagramVersion: version ?? state.diagramVersion })),
  setViewport: (viewport) => set({ viewport }),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  pushHistoryCheckpoint: () => {
    const s = get();
    set((state) => ({ historyPast: [...state.historyPast, cloneHistoryEntry({ nodes: s.nodes, edges: s.edges, assets: s.assets })].slice(-50), historyFuture: [] }));
  },

  addEdgeFromConnection: (connection) => {
    if (!connection.source || !connection.target) return;
    get().pushHistoryCheckpoint();
    set((state) => ({ edges: [...state.edges, { id: nanoid(10), source: connection.source!, target: connection.target!, color: '#94a3b8' }] }));
  },

  createNodeFromAsset: ({ assetId, position, instanceName }) => {
    const state = get();
    const asset = state.assets[assetId];
    if (!asset) return undefined;
    const usedNames = new Set(
      state.nodes
        .filter((node) => node.type === 'asset' && node.data.assetId === assetId)
        .map((node) => node.data.instanceName?.trim() || buildInstanceBaseName(node.data.label, node.data.ip)),
    );
    const resolvedInstanceName = instanceName?.trim() || makeNextInstanceName(buildInstanceBaseName(asset.name, asset.ip), usedNames);

    get().pushHistoryCheckpoint();
    const nodeId = nanoid(10);
    set((state) => ({
      nodes: recomputeOwnership([
        ...state.nodes,
        {
          id: nodeId,
          type: 'asset',
          position,
          data: { assetId, label: asset.name, type: asset.type, ip: asset.ip, model: asset.model, notes: asset.notes, zoneId: undefined, instanceName: resolvedInstanceName, status: 'default' } as AssetNodeData,
        },
      ]),
    }));
    return nodeId;
  },

  createZoneNode: ({ zoneId, position, parentId, level }) => {
    const zone = get().zones[zoneId];
    if (!zone) return undefined;
    get().pushHistoryCheckpoint();
    const nodeId = nanoid(10);
    set((state) => ({
      nodes: recomputeOwnership([
        ...state.nodes,
        { id: nodeId, type: 'zone', position, size: { width: 320, height: 220 }, parentId, data: { zoneId, label: zone.name, color: zone.color, description: zone.description, level } },
      ]),
    }));
    return nodeId;
  },

  duplicateAssetNodeInstance: (nodeId, offset = { x: 40, y: 40 }) => {
    const state = get();
    const source = state.nodes.find((n) => n.id === nodeId);
    if (!source || source.type !== 'asset') return undefined;
    const usedNames = new Set(
      state.nodes
        .filter((node) => node.type === 'asset' && node.data.assetId === source.data.assetId)
        .map((node) => node.data.instanceName?.trim() || buildInstanceBaseName(node.data.label, node.data.ip)),
    );
    const nextInstanceName = makeNextInstanceName(buildInstanceBaseName(source.data.label, source.data.ip), usedNames);

    get().pushHistoryCheckpoint();
    const newNodeId = nanoid(10);
    set((state) => ({
      nodes: recomputeOwnership([
        ...state.nodes,
        { ...source, id: newNodeId, position: { x: source.position.x + offset.x, y: source.position.y + offset.y }, data: { ...source.data, instanceName: nextInstanceName, status: 'default' } },
      ]),
      selectedNodeId: newNodeId,
    }));
    return newNodeId;
  },

  updateZoneNodeSize: (zoneNodeId, size) => {
    get().pushHistoryCheckpoint();
    set((state) => ({ nodes: recomputeOwnership(state.nodes.map((n) => (n.type === 'zone' && n.id === zoneNodeId ? { ...n, size } : n))) }));
  },
  updateZoneNodeColor: (zoneNodeId, color) => {
    get().pushHistoryCheckpoint();
    set((state) => ({ nodes: state.nodes.map((n) => (n.type === 'zone' && n.id === zoneNodeId ? { ...n, data: { ...n.data, color } } : n)) }));
  },
  updateNodeInstanceData: (nodeId, patch) => {
    get().pushHistoryCheckpoint();
    set((state) => ({ nodes: state.nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...patch } as typeof n.data } : n)) }));
  },
  updateEdgeColor: (edgeId, color) => {
    get().pushHistoryCheckpoint();
    set((state) => ({ edges: state.edges.map((edge) => (edge.id === edgeId ? { ...edge, color } : edge)) }));
  },

  removeNode: (nodeId) => {
    get().pushHistoryCheckpoint();
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: state.selectedNodeId === nodeId ? undefined : state.selectedNodeId,
      focusedNodeId: state.focusedNodeId === nodeId ? undefined : state.focusedNodeId,
    }));
  },
  removeEdge: (edgeId) => {
    get().pushHistoryCheckpoint();
    set((state) => ({ edges: state.edges.filter((e) => e.id !== edgeId), selectedEdgeId: state.selectedEdgeId === edgeId ? undefined : state.selectedEdgeId }));
  },
  removeSelectedElement: () => {
    const s = get();
    if (s.selectedEdgeId) return s.removeEdge(s.selectedEdgeId);
    if (!s.selectedNodeId) return;
    const selected = s.nodes.find((n) => n.id === s.selectedNodeId);
    if (selected?.type === 'zone') {
      const confirmed = typeof window !== 'undefined' ? window.confirm('删除该 Zone 将删除整棵子树，是否继续？') : true;
      if (!confirmed) return;
      return s.removeZoneSubtree(selected.id);
    }
    s.removeNode(s.selectedNodeId);
  },
  removeZoneSubtree: (zoneNodeId) => {
    get().pushHistoryCheckpoint();
    set((state) => {
      const deleting = collectZoneSubtree(zoneNodeId, state.nodes);
      return {
        nodes: state.nodes.filter((n) => !deleting.has(n.id)),
        edges: state.edges.filter((e) => !deleting.has(e.source) && !deleting.has(e.target)),
        selectedNodeId: deleting.has(state.selectedNodeId ?? '') ? undefined : state.selectedNodeId,
        focusedNodeId: deleting.has(state.focusedNodeId ?? '') ? undefined : state.focusedNodeId,
      };
    });
  },

  recomputeOwnershipForAll: () => set((state) => ({ nodes: recomputeOwnership(state.nodes) })),
  syncAssetFieldsToNodes: (assetId) => {
    const assets = get().assets;
    set((state) => ({
      nodes: state.nodes.map((n) => {
        if (n.type !== 'asset') return n;
        if (assetId && n.data.assetId !== assetId) return n;
        const asset = assets[n.data.assetId];
        if (!asset) return n;
        return { ...n, data: mapAssetFieldsToNodeData(n.data, asset) };
      }),
    }));
  },

  undo: () => {
    const { historyPast, historyFuture, nodes, edges, assets } = get();
    const prev = historyPast[historyPast.length - 1];
    if (!prev) return;
    set({ nodes: structuredClone(prev.nodes), edges: structuredClone(prev.edges), assets: structuredClone(prev.assets), historyPast: historyPast.slice(0, -1), historyFuture: [...historyFuture, { nodes, edges, assets }] });
  },
  redo: () => {
    const { historyPast, historyFuture, nodes, edges, assets } = get();
    const next = historyFuture[historyFuture.length - 1];
    if (!next) return;
    set({ nodes: structuredClone(next.nodes), edges: structuredClone(next.edges), assets: structuredClone(next.assets), historyPast: [...historyPast, { nodes, edges, assets }], historyFuture: historyFuture.slice(0, -1) });
  },

  exportDocumentJson: (fileName) => {
    if (typeof window === 'undefined') return;
    const state = get();
    const payload = {
      version: state.diagramVersion,
      id: state.diagramId,
      name: state.diagramName,
      assets: Object.values(state.assets),
      zones: Object.values(state.zones),
      nodes: state.nodes,
      edges: state.edges,
      viewport: state.viewport,
      updatedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const trimmed = fileName?.trim();
    const normalizedName = trimmed
      ? trimmed.toLowerCase().endsWith('.json')
        ? trimmed
        : `${trimmed}.json`
      : `${state.diagramName || 'diagram'}.json`;
    a.download = normalizedName;
    a.click();
    URL.revokeObjectURL(url);
  },

  importDocumentJson: (payload) => {
    try {
      const parsed = JSON.parse(payload);
      const nextAssets = Object.fromEntries((parsed.assets ?? []).map((asset: AppStore['assets'][string]) => [asset.id, asset]));
      const nextZones = Object.fromEntries((parsed.zones ?? []).map((zone: AppStore['zones'][string]) => [zone.id, zone]));
      set({
        diagramVersion: parsed.version ?? '1.0.0',
        diagramId: parsed.id ?? 'diagram-imported',
        diagramName: parsed.name ?? 'Imported Diagram',
        assets: nextAssets,
        zones: nextZones,
        nodes: (parsed.nodes ?? []) as DiagramNode[],
        edges: (parsed.edges ?? []) as DiagramEdge[],
        viewport: parsed.viewport ?? { x: 0, y: 0, zoom: 1 },
        selectedNodeId: undefined,
        selectedEdgeId: undefined,
        selectedCanvas: true,
      });
    } catch (error) {
      console.error('Invalid diagram JSON', error);
    }
  },
});
