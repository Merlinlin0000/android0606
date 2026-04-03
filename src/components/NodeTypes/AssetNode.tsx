import { Database, Monitor, Network, Server, ShieldCheck } from 'lucide-react';
import { NodeProps } from '@xyflow/react';
import { NodeData } from '../../types';

const iconMap = {
  Firewall: ShieldCheck,
  Switch: Network,
  Server,
  Database,
  Terminal: Monitor
};

export const AssetNode = ({ data, selected }: NodeProps<NodeData>) => {
  const Icon = iconMap[data.type];

  return (
    <div
      className={`rounded-xl border bg-white shadow-sm min-w-40 px-3 py-2 ${selected ? 'ring-2 ring-sky-300' : ''}`}
      style={{ borderColor: '#cbd5e1' }}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-600" />
        <p className="text-sm font-semibold text-slate-700">{data.name}</p>
      </div>
      <p className="text-xs text-slate-500 mt-1">{data.ip}</p>
      {data.zone && <p className="text-xs mt-1 text-teal-700">{data.zone}</p>}
    </div>
  );
};
