import { nanoid } from 'nanoid';
import type { StateCreator } from 'zustand';
import type { AppStore } from '../useAppStore';
import type { ZoneEntity } from '../../types/diagram';

const ZONE_TEMPLATE_KEY = 'assessor-blade-zone-template-v1';

interface ZoneTemplateItem {
  id: string;
  name: string;
  color: string;
  description?: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  parentId?: string;
}

export interface ZoneSlice {
  zones: Record<string, ZoneEntity>;
  setZones: (zones: ZoneEntity[]) => void;
  upsertZone: (zone: ZoneEntity) => void;
  updateZone: (zoneId: string, patch: Partial<ZoneEntity>) => void;
  removeZone: (zoneId: string) => void;
  saveZoneTemplateToLocal: () => void;
  clearAndReloadZoneTemplate: () => void;
}

const canUseLocalStorage = () => typeof window !== 'undefined' && !!window.localStorage;

export const createZoneSlice: StateCreator<AppStore, [], [], ZoneSlice> = (set, get) => ({
  zones: {
    'zone-prod': {
      id: 'zone-prod',
      name: 'Production Zone',
      color: '#38bdf8',
      description: '核心生产区域',
    },
  },

  setZones: (zones) => {
    set({ zones: Object.fromEntries(zones.map((zone) => [zone.id, zone])) });
  },

  upsertZone: (zone) => {
    set((state) => ({
      zones: {
        ...state.zones,
        [zone.id]: zone,
      },
      nodes: state.nodes.map((node) => {
        if (node.type !== 'zone' || node.data.zoneId !== zone.id) return node;

        return {
          ...node,
          data: {
            ...node.data,
            label: zone.name,
            color: zone.color,
            description: zone.description,
          },
        };
      }),
    }));
  },

  updateZone: (zoneId, patch) => {
    set((state) => {
      const current = state.zones[zoneId];
      if (!current) return state;

      const nextZone = { ...current, ...patch };

      return {
        zones: {
          ...state.zones,
          [zoneId]: nextZone,
        },
        nodes: state.nodes.map((node) => {
          if (node.type !== 'zone' || node.data.zoneId !== zoneId) return node;

          return {
            ...node,
            data: {
              ...node.data,
              label: nextZone.name,
              color: nextZone.color,
              description: nextZone.description,
            },
          };
        }),
      };
    });
  },

  removeZone: (zoneId) => {
    set((state) => {
      const nextZones = { ...state.zones };
      delete nextZones[zoneId];

      return {
        zones: nextZones,
        nodes: state.nodes.filter((node) => !(node.type === 'zone' && node.data.zoneId === zoneId)),
      };
    });
  },

  saveZoneTemplateToLocal: () => {
    if (!canUseLocalStorage()) return;

    const zoneNodes = get().nodes.filter((node) => node.type === 'zone');
    const payload: ZoneTemplateItem[] = zoneNodes.map((node) => ({
      id: node.id,
      name: node.data.label,
      color: node.data.color,
      description: node.data.description,
      position: node.position,
      size: node.size,
      parentId: node.parentId,
    }));

    window.localStorage.setItem(ZONE_TEMPLATE_KEY, JSON.stringify(payload));
  },

  clearAndReloadZoneTemplate: () => {
    if (!canUseLocalStorage()) return;

    const raw = window.localStorage.getItem(ZONE_TEMPLATE_KEY);
    if (!raw) return;

    const template = JSON.parse(raw) as ZoneTemplateItem[];
    const idMap = new Map<string, string>();

    template.forEach((item) => {
      idMap.set(item.id, nanoid(10));
    });

    const reloadedZones: ZoneEntity[] = template.map((item) => ({
      id: idMap.get(item.id)!,
      name: item.name,
      color: item.color,
      description: item.description,
    }));

    const reloadedZoneNodes = template.map((item) => {
      const mappedId = idMap.get(item.id)!;

      return {
        id: mappedId,
        type: 'zone' as const,
        position: item.position,
        size: item.size,
        parentId: item.parentId ? idMap.get(item.parentId) : undefined,
        hierarchyPath: [],
        data: {
          zoneId: mappedId,
          label: item.name,
          color: item.color,
          description: item.description,
          level: 0,
        },
      };
    });

    set((state) => ({
      zones: Object.fromEntries(reloadedZones.map((zone) => [zone.id, zone])),
      nodes: state.nodes.filter((node) => node.type !== 'zone').concat(reloadedZoneNodes),
    }));

    get().recomputeOwnershipForAll();
  },
});
