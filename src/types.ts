export type AssetType = 'Firewall' | 'Switch' | 'Server' | 'Database' | 'Terminal';

export interface Asset {
  id: string;
  name: string;
  ip: string;
  type: AssetType;
  model?: string;
  zone?: string;
  isDeployed: boolean;
}

export interface NodeData extends Asset {
  label: string;
  onDataChange: (id: string, newData: Partial<Asset>) => void;
}
