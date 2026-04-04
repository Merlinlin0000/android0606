import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';
import type { AssetNodeData } from '../../types/diagram';
import { assetTypeIconMap } from './iconMap';

const AssetNode = ({ data, selected }: NodeProps<AssetNodeData>) => {
  const isFocused = data.status === 'selected';
  const Icon = assetTypeIconMap[data.type];

  return (
    <div
      className={`min-w-[220px] rounded-xl border px-3 py-2 shadow-sm backdrop-blur-sm transition ${
        selected || isFocused
          ? 'border-sky-400 bg-white shadow-sky-100 ring-2 ring-sky-100'
          : 'border-slate-200 bg-white/95 hover:border-sky-200'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !bg-slate-400" />
      <div className="flex items-start gap-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-1.5">
          <Icon className="h-4 w-4 text-slate-600" />
        </div>

        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-700">{data.label}</div>
          <div className="mt-0.5 text-xs text-slate-500">{data.ip}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !bg-slate-400" />
    </div>
  );
};

export default AssetNode;
