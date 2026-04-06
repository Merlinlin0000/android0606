export type AssetType =
  | '防火墙'
  | '日志审计'
  | '数据库审计'
  | '堡垒机'
  | 'VPN'
  | 'IPS'
  | 'IDS'
  | 'EDR'
  | '上网行为管理'
  | '态势感知'
  | '探针'
  | '交换机'
  | '路由器'
  | '网关'
  | '单台服务器'
  | '服务器集群'
  | '数据库'
  | '其他设备'
  | 'Firewall'
  | 'Switch'
  | 'Server'
  | 'Database'
  | 'Terminal'
  | 'Custom';

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
  notes?: string;
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
  color?: string;
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
