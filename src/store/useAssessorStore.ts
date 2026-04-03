import { create } from 'zustand';
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  XYPosition
} from '@xyflow/react';
import { Asset, AssetType } from '../types';

interface AssessorState {
  assets: Asset[];
  search: string;
  nodes: Node[];
  edges: Edge[];
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  setSearch: (value: string) => void;
  importAssets: (assets: Asset[]) => void;
  updateAsset: (id: string, partial: Partial<Asset>) => void;
  addAssetNode: (assetId: string, position: XYPosition) => void;
  addZoneNode: () => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  markNodeInZone: (nodeId: string, zoneId?: string) => void;
  setSelection: (nodeIds: string[], edgeIds: string[]) => void;
  deleteSelection: () => void;
  duplicateSelection: () => void;
  loadZoneTemplate: () => void;
  saveZoneTemplate: () => void;
  clearCanvas: () => void;
}

const defaultAssets: Asset[] = [
  { id: 'asset-1', name: 'FW-Core', ip: '10.0.0.1', type: 'Firewall', isDeployed: false },
  { id: 'asset-2', name: 'SW-Access', ip: '10.0.1.2', type: 'Switch', isDeployed: false },
  { id: 'asset-3', name: 'DB-Prod', ip: '10.0.2.33', type: 'Database', isDeployed: false }
];

const assetTypeColor: Record<AssetType, string> = {
  Firewall: '#f97316',
  Switch: '#0ea5e9',
  Server: '#475569',
  Database: '#14b8a6',
  Terminal: '#6366f1'
};

export const useAssessorStore = create<AssessorState>((set, get) => ({
  assets: defaultAssets,
  search: '',
  nodes: [],
  edges: [],
  selectedNodeIds: [],
  selectedEdgeIds: [],
  setSearch: (value) => set({ search: value }),
  importAssets: (assets) => set({ assets }),
  updateAsset: (id, partial) =>
    set((state) => ({
      assets: state.assets.map((asset) => (asset.id === id ? { ...asset, ...partial } : asset)),
      nodes: state.nodes.map((node) =>
        node.data?.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                ...partial,
                label: partial.name ?? node.data.label
              }
            }
          : node
      )
    })),
  addAssetNode: (assetId, position) => {
    const state = get();
    const asset = state.assets.find((item) => item.id === assetId);
    if (!asset || asset.isDeployed) return;
    const nodeId = `node-${asset.id}`;
    set({
      assets: state.assets.map((item) => (item.id === assetId ? { ...item, isDeployed: true } : item)),
      nodes: state.nodes.concat({
        id: nodeId,
        type: 'assetNode',
        position,
        data: {
          ...asset,
          label: asset.name,
          onDataChange: (id: string, newData: Partial<Asset>) => get().updateAsset(id, newData)
        },
        style: {
          borderColor: assetTypeColor[asset.type]
        }
      })
    });
  },
  addZoneNode: () =>
    set((state) => ({
      nodes: state.nodes.concat({
        id: `zone-${Date.now()}`,
        type: 'zoneNode',
        position: { x: 180, y: 120 },
        data: {
          title: `安全域 ${state.nodes.filter((node) => node.type === 'zoneNode').length + 1}`,
          color: '#94a3b8'
        },
        style: { width: 420, height: 260 },
        zIndex: -1
      })
    })),
  onNodesChange: (changes) => set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) })),
  onEdgesChange: (changes) => set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),
  onConnect: (connection) =>
    set((state) => ({
      edges: addEdge(
        {
          ...connection,
          type: 'smart',
          markerEnd: { type: 'arrowclosed' },
          style: { stroke: '#94a3b8' }
        },
        state.edges
      )
    })),
  markNodeInZone: (nodeId, zoneId) =>
    set((state) => {
      const zone = zoneId ? state.nodes.find((node) => node.id === zoneId) : undefined;
      const zoneName = (zone?.data as { title?: string } | undefined)?.title;
      return {
        nodes: state.nodes.map((node) =>
          node.id === nodeId ? { ...node, parentId: zoneId, extent: zoneId ? 'parent' : undefined } : node
        ),
        assets: state.assets.map((asset) =>
          `node-${asset.id}` === nodeId ? { ...asset, zone: zoneName, isDeployed: true } : asset
        )
      };
    }),
  setSelection: (nodeIds, edgeIds) => set({ selectedNodeIds: nodeIds, selectedEdgeIds: edgeIds }),
  deleteSelection: () =>
    set((state) => ({
      edges: state.edges.filter((edge) => !state.selectedEdgeIds.includes(edge.id)),
      nodes: state.nodes.filter((node) => !state.selectedNodeIds.includes(node.id)),
      assets: state.assets.map((asset) =>
        state.selectedNodeIds.includes(`node-${asset.id}`) ? { ...asset, isDeployed: false, zone: undefined } : asset
      ),
      selectedNodeIds: [],
      selectedEdgeIds: []
    })),
  duplicateSelection: () =>
    set((state) => {
      const selectedNodes = state.nodes.filter((node) => state.selectedNodeIds.includes(node.id));
      const copies = selectedNodes.map((node) => ({
        ...node,
        id: `${node.id}-copy-${Date.now()}`,
        position: { x: node.position.x + 28, y: node.position.y + 28 }
      }));
      return { nodes: state.nodes.concat(copies) };
    }),
  saveZoneTemplate: () => {
    const zones = get().nodes
      .filter((node) => node.type === 'zoneNode')
      .map((node) => ({ id: node.id, position: node.position, data: node.data, style: node.style }));
    localStorage.setItem('assessor-zone-template', JSON.stringify(zones));
  },
  loadZoneTemplate: () => {
    const raw = localStorage.getItem('assessor-zone-template');
    if (!raw) return;
    const zones = JSON.parse(raw) as Node[];
    set((state) => ({
      nodes: state.nodes.filter((node) => node.type !== 'zoneNode').concat(zones)
    }));
  },
  clearCanvas: () =>
    set((state) => ({
      nodes: [],
      edges: [],
      selectedEdgeIds: [],
      selectedNodeIds: [],
      assets: state.assets.map((asset) => ({ ...asset, isDeployed: false, zone: undefined }))
    }))
}));
