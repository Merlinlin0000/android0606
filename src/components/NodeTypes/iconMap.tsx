import { Database, Monitor, Network, Server, ShieldCheck } from 'lucide-react';
import type { AssetType } from '../../types/diagram';

export const assetTypeIconMap: Record<AssetType, typeof Server> = {
  Firewall: ShieldCheck,
  Switch: Network,
  Server,
  Database,
  Terminal: Monitor,
  Custom: Server,
};
