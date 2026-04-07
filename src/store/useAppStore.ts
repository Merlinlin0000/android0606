import { create } from 'zustand';
import { createAssetSlice, type AssetSlice } from './slices/assetSlice';
import { createDiagramSlice, type DiagramSlice } from './slices/diagramSlice';
import { createUISlice, type UISlice } from './slices/uiSlice';
import { createZoneSlice, type ZoneSlice } from './slices/zoneSlice';

export type AppStore = AssetSlice & DiagramSlice & ZoneSlice & UISlice;

export const useAppStore = create<AppStore>()((...args) => ({
  ...createAssetSlice(...args),
  ...createDiagramSlice(...args),
  ...createZoneSlice(...args),
  ...createUISlice(...args),
}));
