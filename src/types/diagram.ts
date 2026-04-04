export type AssetType = 'Firewall' | 'Switch' | 'Server' | 'Database' | 'Terminal' | 'Custom';

export interface Asset {
  id: string;
  name: string;
  ip: string;
  type: AssetType;
  model?: string;
  notes?: string;
  zoneId?: string;
  zoneName?: string;
  sourceRowIndex?: number;
  sourceFileName?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface ZoneEntity {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface AssetNodeData {
  assetId: string;
  label: string;
  type: Asset['type'];
  ip: string;
  model?: string;
  zoneId?: string;
  instanceName?: string;
  status?: 'default' | 'selected' | 'error';
}

export interface ZoneNodeData {
  zoneId: string;
  label: string;
  color: string;
  description?: string;
  level?: number;
}

export interface AssetNodeEntity {
  id: string;
  type: 'asset';
  data: AssetNodeData;
  position: {
    x: number;
    y: number;
  };
  parentId?: string;
  hierarchyPath?: string[];
}

export interface ZoneNodeEntity {
  id: string;
  type: 'zone';
  data: ZoneNodeData;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  parentId?: string;
  hierarchyPath?: string[];
}

export type DiagramNode = AssetNodeEntity | ZoneNodeEntity;

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface DiagramDocument {
  version: string;
  id: string;
  name: string;
  assets: Asset[];
  zones: ZoneEntity[];
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  updatedAt: string;
}
