import { useMemo } from 'react';
import { useAssessorStore } from '../../store/useAssessorStore';

export const InspectorPanel = () => {
  const { assets, selectedNodeIds, updateAsset } = useAssessorStore((state) => ({
    assets: state.assets,
    selectedNodeIds: state.selectedNodeIds,
    updateAsset: state.updateAsset
  }));

  const selectedAsset = useMemo(() => {
    const id = selectedNodeIds[0]?.replace('node-', '');
    return assets.find((asset) => asset.id === id);
  }, [assets, selectedNodeIds]);

  return (
    <aside className="panel h-full p-4">
      <h2 className="text-sm font-semibold text-slate-700 mb-3">Inspector</h2>
      {!selectedAsset ? (
        <p className="text-sm text-slate-500">请选择一个资产节点进行编辑。</p>
      ) : (
        <div className="space-y-3">
          <label className="block text-xs text-slate-600">
            名称
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
              value={selectedAsset.name}
              onChange={(event) => updateAsset(selectedAsset.id, { name: event.target.value })}
            />
          </label>

          <label className="block text-xs text-slate-600">
            IP
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
              value={selectedAsset.ip}
              onChange={(event) => updateAsset(selectedAsset.id, { ip: event.target.value })}
            />
          </label>

          <label className="block text-xs text-slate-600">
            型号
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
              value={selectedAsset.model ?? ''}
              onChange={(event) => updateAsset(selectedAsset.id, { model: event.target.value })}
            />
          </label>
        </div>
      )}
    </aside>
  );
};
