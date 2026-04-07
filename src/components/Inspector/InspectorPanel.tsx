import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { micaPanelClass } from '../../hooks/useMicaPanelClass';
import { cn } from '../../utils/cn';
import type { AssetType } from '../../types/diagram';

const assetTypeOptions: AssetType[] = [
  '防火墙',
  '日志审计',
  '数据库审计',
  '堡垒机',
  'VPN',
  'IPS',
  'IDS',
  'EDR',
  '上网行为管理',
  '态势感知',
  '探针',
  '交换机',
  '路由器',
  '网关',
  '单台服务器',
  '服务器集群',
  '数据库',
  '其他设备',
];

const InspectorPanel = () => {
  const selectedNodeId = useAppStore((state) => state.selectedNodeId);
  const selectedEdgeId = useAppStore((state) => state.selectedEdgeId);
  const nodes = useAppStore((state) => state.nodes);
  const edges = useAppStore((state) => state.edges);
  const diagramId = useAppStore((state) => state.diagramId);
  const diagramName = useAppStore((state) => state.diagramName);
  const diagramVersion = useAppStore((state) => state.diagramVersion);
  const viewport = useAppStore((state) => state.viewport);
  const setDiagramMeta = useAppStore((state) => state.setDiagramMeta);
  const setViewport = useAppStore((state) => state.setViewport);
  const updateNodeInstanceData = useAppStore((state) => state.updateNodeInstanceData);
  const zones = useAppStore((state) => state.zones);
  const updateZone = useAppStore((state) => state.updateZone);
  const updateEdgeColor = useAppStore((state) => state.updateEdgeColor);
  const removeEdge = useAppStore((state) => state.removeEdge);

  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId), [nodes, selectedNodeId]);
  const selectedEdge = useMemo(() => edges.find((edge) => edge.id === selectedEdgeId), [edges, selectedEdgeId]);
  const selectedZone = useMemo(() => {
    if (!selectedNode || selectedNode.type !== 'zone') return undefined;
    return zones[selectedNode.data.zoneId];
  }, [selectedNode, zones]);

  return (
    <aside className={cn('flex h-full flex-col rounded-2xl p-4', micaPanelClass)}>
      <h2 className="text-sm font-semibold text-slate-700">Inspector</h2>
      <p className="mt-1 text-xs text-slate-500">选中对象属性</p>

      {!selectedNode && !selectedEdge && (
        <div className="mt-4 space-y-3 text-sm">
          <div>
            <label className="mb-1 block text-xs text-slate-500">画布名称</label>
            <input value={diagramName} onChange={(e) => setDiagramMeta({ name: e.target.value })} className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">画布 ID</label>
            <input value={diagramId} onChange={(e) => setDiagramMeta({ id: e.target.value })} className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">版本</label>
            <input value={diagramVersion} onChange={(e) => setDiagramMeta({ version: e.target.value })} className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-xs text-slate-500">视口 X</label>
              <input type="number" value={Math.round(viewport.x)} onChange={(e) => setViewport({ ...viewport, x: Number(e.target.value) || 0 })} className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">视口 Y</label>
              <input type="number" value={Math.round(viewport.y)} onChange={(e) => setViewport({ ...viewport, y: Number(e.target.value) || 0 })} className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">缩放</label>
              <input type="number" step="0.1" value={Number(viewport.zoom.toFixed(2))} onChange={(e) => setViewport({ ...viewport, zoom: Number(e.target.value) || 1 })} className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5" />
            </div>
          </div>
        </div>
      )}

      {selectedNode?.type === 'asset' && (
        <div className="mt-4 space-y-3 text-sm">
          <div className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700">
            当前为“实例级编辑”：只影响当前节点实例，不会同步到同资产的其他实例。
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-500">名称</label>
            <input
              value={selectedNode.data.label}
              onChange={(e) => updateNodeInstanceData(selectedNode.id, { label: e.target.value })}
              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">IP</label>
            <input
              value={selectedNode.data.ip}
              onChange={(e) => updateNodeInstanceData(selectedNode.id, { ip: e.target.value })}
              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">类型（受限）</label>
            <select
              value={selectedNode.data.type}
              onChange={(e) => updateNodeInstanceData(selectedNode.id, { type: e.target.value as AssetType })}
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
              value={selectedNode.data.model ?? ''}
              onChange={(e) => updateNodeInstanceData(selectedNode.id, { model: e.target.value })}
              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">备注</label>
            <textarea
              value={selectedNode.data.notes ?? ''}
              onChange={(e) => updateNodeInstanceData(selectedNode.id, { notes: e.target.value })}
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
              value={selectedNode.data.instanceName ?? `${selectedNode.data.label}_${selectedNode.data.ip}`}
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
            <input
              value={selectedZone?.name ?? selectedNode.data.label}
              onChange={(e) => updateZone(selectedNode.data.zoneId, { name: e.target.value })}
              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">颜色</label>
            <input
              type="color"
              value={selectedZone?.color ?? selectedNode.data.color}
              onChange={(e) => updateZone(selectedNode.data.zoneId, { color: e.target.value })}
              className="h-8 w-full rounded-md border border-slate-200 bg-white p-1"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">描述</label>
            <textarea
              value={selectedZone?.description ?? selectedNode.data.description ?? ''}
              onChange={(e) => updateZone(selectedNode.data.zoneId, { description: e.target.value })}
              className="h-16 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5"
            />
          </div>
          <div className="text-xs text-slate-500">层级路径：{selectedNode.hierarchyPath?.join(' / ') || '(root)'}</div>
        </div>
      )}

      {selectedEdge && (
        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <div>Edge ID: {selectedEdge.id}</div>
          <div>Source: {selectedEdge.source}</div>
          <div>Target: {selectedEdge.target}</div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">连线颜色</label>
            <input
              type="color"
              value={selectedEdge.color ?? '#94a3b8'}
              onChange={(e) => updateEdgeColor(selectedEdge.id, e.target.value)}
              className="h-8 w-full rounded-md border border-slate-200 bg-white p-1"
            />
          </div>
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
