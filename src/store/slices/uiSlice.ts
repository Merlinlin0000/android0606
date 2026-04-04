import type { StateCreator } from 'zustand';
import type { AppStore } from '../useAppStore';
import type { DiagramNode } from '../../types/diagram';

export interface UISlice {
  selectedNodeId?: string;
  selectedEdgeId?: string;
  selectedAssetId?: string;
  focusedNodeId?: string;
  hoveredNodeId?: string;
  clipboardNode?: DiagramNode;
  rightPanelTab: 'node' | 'asset' | 'zone' | 'edge';
  pendingFitViewForExport: boolean;
  setSelectedNodeId: (nodeId?: string) => void;
  setSelectedEdgeId: (edgeId?: string) => void;
  setHoveredNodeId: (nodeId?: string) => void;
  setRightPanelTab: (tab: UISlice['rightPanelTab']) => void;
  focusAssetInstances: (assetId: string) => void;
  locateAssetInstance: (nodeId: string) => void;
  clearFocusedNode: () => void;
  setClipboardNode: (node?: DiagramNode) => void;
  requestFitViewForExport: () => void;
  clearFitViewForExport: () => void;
}

export const createUISlice: StateCreator<AppStore, [], [], UISlice> = (set) => ({
  selectedNodeId: undefined,
  selectedEdgeId: undefined,
  selectedAssetId: undefined,
  focusedNodeId: undefined,
  hoveredNodeId: undefined,
  clipboardNode: undefined,
  rightPanelTab: 'node',
  pendingFitViewForExport: false,
  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId, selectedEdgeId: undefined }),
  setSelectedEdgeId: (edgeId) => set({ selectedEdgeId: edgeId, selectedNodeId: undefined, rightPanelTab: edgeId ? 'edge' : 'node' }),
  setHoveredNodeId: (nodeId) => set({ hoveredNodeId: nodeId }),
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  focusAssetInstances: (assetId) => set({ selectedAssetId: assetId, rightPanelTab: 'asset' }),
  locateAssetInstance: (nodeId) => set({ focusedNodeId: nodeId, selectedNodeId: nodeId, selectedEdgeId: undefined, rightPanelTab: 'node' }),
  clearFocusedNode: () => set({ focusedNodeId: undefined }),
  setClipboardNode: (node) => set({ clipboardNode: node }),
  requestFitViewForExport: () => set({ pendingFitViewForExport: true }),
  clearFitViewForExport: () => set({ pendingFitViewForExport: false }),
});
