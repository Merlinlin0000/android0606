import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { micaPanelClass } from '../../hooks/useMicaPanelClass';
import { cn } from '../../utils/cn';
import type { AssetType } from '../../types/diagram';

const assetTypeOptions: AssetType[] = ['Firewall', 'Switch', 'Server', 'Database', 'Terminal', 'Custom'];

const InspectorPanel = () => {
  const selectedNodeId = useAppStore((state) => state.selectedNodeId);
  const selectedEdgeId = useAppStore((state) => state.selectedEdgeId);
  const nodes = useAppStore((state) => state.nodes);
  const edges = useAppStore((state) => state.edges);
  const assets = useAppStore((state) => state.assets);
  const updateAsset = useAppStore((state) => state.updateAsset);
  const updateNodeInstanceData = useAppStore((state) => state.updateNodeInstanceData);
  const updateZoneNodeColor = useAppStore((state) => state.updateZoneNodeColor);
  const removeEdge = useAppStore((state) => state.removeEdge);

  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId), [nodes, selectedNodeId]);
  const selectedEdge = useMemo(() => edges.find((edge) => edge.id === selectedEdgeId), [edges, selectedEdgeId]);

  const selectedAsset = selectedNode?.type === 'asset' ? assets[selectedNode.data.assetId] : undefined;

  return (
    <aside className={cn('flex h-full flex-col rounded-2xl p-4', micaPanelClass)}>
      <h2 className="text-sm font-semibold text-slate-700">Inspector</h2>
      <p className="mt-1 text-xs text-slate-500">选中对象属性</p>

      {!selectedNode && !selectedEdge && (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white/80 p-4 text-sm text-slate-500">
          未选中对象。
          <div className="mt-2 text-xs text-slate-400">点击资产节点 / Zone / 连线后，这里会显示可编辑属性（名称、IP、备注、颜色、连线删除等）。</div>
        </div>
      )}

      {selectedNode?.type === 'asset' && selectedAsset && (
        <div className="mt-4 space-y-3 text-sm">
          <div>
            <label className="mb-1 block text-xs text-slate-500">名称</label>
            <input
              value={selectedAsset.name}
              onChange={(e) => updateAsset(selectedAsset.id, { name: e.target.value })}
              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">IP</label>
            <input
              value={selectedAsset.ip}
              onChange={(e) => updateAsset(selectedAsset.id, { ip: e.target.value })}
              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">类型（受限）</label>
            <select
              value={selectedAsset.type}
              onChange={(e) => updateAsset(selectedAsset.id, { type: e.target.value as AssetType })}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5"
            >
              {assetTypeOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">型号</label>
            <input
              value={selectedAsset.model ?? ''}
              onChange={(e) => updateAsset(selectedAsset.id, { model: e.target.value })}
              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">备注</label>
            <textarea
              value={selectedAsset.notes ?? ''}
              onChange={(e) => updateAsset(selectedAsset.id, { notes: e.target.value })}
              className="h-16 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">所属安全域（只读）</label>
            <input value={selectedNode.data.zoneId ?? '-'} readOnly className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">当前实例信息</label>
            <input
              value={selectedNode.data.instanceName ?? selectedNode.id}
              onChange={(e) => updateNodeInstanceData(selectedNode.id, { instanceName: e.target.value })}
              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5"
            />
          </div>
        </div>
      )}

      {selectedNode?.type === 'zone' && (
        <div className="mt-4 space-y-3 text-sm">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Zone 名称</label>
            <input value={selectedNode.data.label} readOnly className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">颜色</label>
            <input type="color" value={selectedNode.data.color} onChange={(e) => updateZoneNodeColor(selectedNode.id, e.target.value)} className="h-8 w-full rounded-md border border-slate-200 bg-white p-1" />
          </div>
          <div className="text-xs text-slate-500">层级路径：{selectedNode.hierarchyPath?.join(' / ') || '(root)'}</div>
        </div>
      )}

      {selectedEdge && (
        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <div>Edge ID: {selectedEdge.id}</div>
          <div>Source: {selectedEdge.source}</div>
          <div>Target: {selectedEdge.target}</div>
          <button
            type="button"
            onClick={() => removeEdge(selectedEdge.id)}
            className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700 hover:bg-rose-100"
          >
            删除连线
          </button>
        </div>
      )}
    </aside>
  );
};

export default InspectorPanel;
