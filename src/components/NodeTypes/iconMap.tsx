import { Database, Monitor, Network, Server, Shield } from 'lucide-react';
import type { AssetType } from '../../types/diagram';

export const assetTypeIconMap: Record<AssetType, typeof Server> = {
  Firewall: Shield,
  Switch: Network,
  Server,
  Database,
  Terminal: Monitor,
  Custom: Server,
};

export const assetTypeColorMap: Record<AssetType, string> = {
  Firewall: 'text-rose-600 bg-rose-50 border-rose-200',
  Switch: 'text-sky-600 bg-sky-50 border-sky-200',
  Server: 'text-violet-600 bg-violet-50 border-violet-200',
  Database: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  Terminal: 'text-amber-600 bg-amber-50 border-amber-200',
  Custom: 'text-slate-600 bg-slate-50 border-slate-200',
};
