import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';
import type { AssetNodeData } from '../../types/diagram';
import { assetTypeColorMap, assetTypeIconMap } from './iconMap';

const AssetNode = ({ data, selected }: NodeProps<AssetNodeData>) => {
  const isFocused = data.status === 'selected';
  const Icon = assetTypeIconMap[data.type];
  const iconColorClass = assetTypeColorMap[data.type];

  return (
    <div
      className={`min-w-[240px] rounded-2xl border px-3 py-2 shadow-sm backdrop-blur-sm transition ${
        selected || isFocused
          ? 'border-sky-400 bg-white shadow-sky-100 ring-2 ring-sky-100'
          : 'border-slate-200 bg-white/95 hover:border-sky-200'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !bg-slate-400" />
      <div className="flex items-start gap-3">
        <div className={`rounded-xl border p-2 ${iconColorClass}`}>
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-700">{data.label}</div>
          <div className="mt-0.5 text-xs text-slate-500">{data.ip}</div>
          <div className="mt-1 text-[11px] text-slate-400">{data.type}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !bg-slate-400" />
    </div>
  );
};

export default AssetNode;
