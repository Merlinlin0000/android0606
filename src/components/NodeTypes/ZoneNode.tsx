import type { ChangeEvent } from 'react';
import type { NodeProps } from 'reactflow';
import { Handle, NodeResizeControl, NodeResizer, Position } from 'reactflow';
import { useAppStore } from '../../store/useAppStore';
import type { ZoneNodeData } from '../../types/diagram';

const ZoneNode = ({ id, data, selected }: NodeProps<ZoneNodeData>) => {
  const updateZoneNodeColor = useAppStore((state) => state.updateZoneNodeColor);
  const updateZoneNodeSize = useAppStore((state) => state.updateZoneNodeSize);

  const onColorChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateZoneNodeColor(id, event.target.value);
  };

  return (
    <div
      className={`h-full w-full overflow-hidden rounded-xl border backdrop-blur-sm ${
        selected ? 'border-sky-300 bg-white/75' : 'border-slate-300 bg-white/55'
      }`}
      style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.35)' }}
    >
      <NodeResizer
        isVisible
        minWidth={220}
        minHeight={140}
        lineClassName="!border-sky-300"
        handleClassName="!h-3.5 !w-3.5 !border-sky-500 !bg-white shadow"
        autoScale
        onResizeEnd={(_, params) => updateZoneNodeSize(id, { width: params.width, height: params.height })}
      />

      <NodeResizeControl
        minWidth={220}
        minHeight={140}
        position="bottom-right"
        className="!h-5 !w-5 !rounded !border !border-sky-500 !bg-white/95 !shadow"
        onResizeEnd={(_, params) => updateZoneNodeSize(id, { width: params.width, height: params.height })}
      >
        <span className="text-[10px] text-sky-700">↘</span>
      </NodeResizeControl>

      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !bg-slate-400" />
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-white/70 px-3 py-1.5">
        <div className="flex items-center">
          <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: data.color }} />
          <span className="text-xs font-semibold text-slate-700">{data.label}</span>
        </div>
        {selected && <input type="color" value={data.color} onChange={onColorChange} className="h-5 w-6 rounded border border-slate-200 p-0" />}
      </div>
      <div className="px-3 py-2 text-[11px] text-slate-500">{data.description ?? 'Zone Container'}</div>
      <div className="px-3 pb-2 text-[10px] text-slate-400">拖拽右下角手柄可缩放区域</div>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !bg-slate-400" />
    </div>
  );
};

export default ZoneNode;
