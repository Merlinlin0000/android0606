import { NodeProps, NodeResizer } from '@xyflow/react';

export const ZoneNode = ({ data, selected }: NodeProps<{ title: string; color: string }>) => {
  return (
    <div className="h-full w-full rounded-xl border-2 border-dashed" style={{ borderColor: data.color, background: `${data.color}20` }}>
      <NodeResizer minWidth={280} minHeight={160} isVisible={selected} lineStyle={{ borderColor: '#64748b' }} />
      <div className="rounded-t-xl border-b px-3 py-1 text-xs font-semibold text-slate-700" style={{ backgroundColor: `${data.color}30` }}>
        {data.title}
      </div>
    </div>
  );
};
