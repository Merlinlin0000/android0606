import type { StateCreator } from 'zustand';
import type { AppStore } from '../useAppStore';
import type { Asset } from '../../types/diagram';
import { parseAssetExcelFile, type AssetExcelParseError, type ImportMode } from '../../utils/assetExcel';

export interface AssetImportResult {
  success: boolean;
  importedCount: number;
  ignoredEmptyRows: number;
  errors: AssetExcelParseError[];
}

export interface AssetSlice {
  assets: Record<string, Asset>;
  setAssets: (assets: Asset[]) => void;
  upsertAsset: (asset: Asset) => void;
  updateAsset: (assetId: string, patch: Partial<Asset>) => void;
  removeAsset: (assetId: string) => void;
  getAssetInstanceCount: (assetId: string) => number;
  importAssetsFromExcel: (file: File, mode: ImportMode) => Promise<AssetImportResult>;
}

export const createAssetSlice: StateCreator<AppStore, [], [], AssetSlice> = (set, get) => ({
  assets: {
    'asset-fw-1': {
      id: 'asset-fw-1',
      name: 'HQ Firewall',
      ip: '10.10.0.1',
      type: '防火墙',
      model: 'PA-VM',
      tags: ['edge', 'security'],
    },
    'asset-db-1': {
      id: 'asset-db-1',
      name: 'Order DB',
      ip: '10.20.1.15',
      type: '数据库',
      model: 'PostgreSQL',
      tags: ['core'],
    },
  },

  setAssets: (assets) => {
    get().pushHistoryCheckpoint();
    const nextAssets = Object.fromEntries(assets.map((asset) => [asset.id, asset]));

    set({ assets: nextAssets });
    get().syncAssetFieldsToNodes();
  },

  upsertAsset: (asset) => {
    get().pushHistoryCheckpoint();
    set((state) => ({
      assets: {
        ...state.assets,
        [asset.id]: asset,
      },
    }));

    get().syncAssetFieldsToNodes(asset.id);
  },

  updateAsset: (assetId, patch) => {
    get().pushHistoryCheckpoint();
    const current = get().assets[assetId];
    if (!current) return;

    set((state) => ({
      assets: {
        ...state.assets,
        [assetId]: {
          ...current,
          ...patch,
        },
      },
    }));

    get().syncAssetFieldsToNodes(assetId);
  },

  removeAsset: (assetId) => {
    get().pushHistoryCheckpoint();
    set((state) => {
      const next = { ...state.assets };
      delete next[assetId];

      return {
        assets: next,
        nodes: state.nodes.filter((node) => node.type !== 'asset' || node.data.assetId !== assetId),
      };
    });
  },

  getAssetInstanceCount: (assetId) => {
    return get().nodes.filter((node) => node.type === 'asset' && node.data.assetId === assetId).length;
  },

  importAssetsFromExcel: async (file, mode) => {
    const parsed = await parseAssetExcelFile(file);
    const existingAssets = Object.values(get().assets);
    const existingIpSet = new Set(existingAssets.map((asset) => asset.ip.trim().toLowerCase()));

    const duplicateWithExisting = parsed.assets.filter((asset) => existingIpSet.has(asset.ip.trim().toLowerCase()));

    const duplicateErrors: AssetExcelParseError[] =
      mode === 'append'
        ? duplicateWithExisting.map((asset) => ({
            type: 'duplicate_ip',
            message: `重复 IP（已存在资产）: ${asset.ip}`,
          }))
        : [];

    const errors = [...parsed.errors, ...duplicateErrors];
    if (errors.length > 0) {
      return {
        success: false,
        importedCount: 0,
        ignoredEmptyRows: parsed.ignoredEmptyRows,
        errors,
      };
    }

    get().pushHistoryCheckpoint();

    if (mode === 'overwrite') {
      set({ assets: Object.fromEntries(parsed.assets.map((asset) => [asset.id, asset])) });
    } else {
      set((state) => ({
        assets: {
          ...state.assets,
          ...Object.fromEntries(parsed.assets.map((asset) => [asset.id, asset])),
        },
      }));
    }

    get().syncAssetFieldsToNodes();

    return {
      success: true,
      importedCount: parsed.assets.length,
      ignoredEmptyRows: parsed.ignoredEmptyRows,
      errors: [],
    };
  },
});
