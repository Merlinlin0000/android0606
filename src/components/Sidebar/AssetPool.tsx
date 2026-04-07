import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Download, LocateFixed, Search, Upload } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { micaPanelClass } from '../../hooks/useMicaPanelClass';
import { cn } from '../../utils/cn';
import { assetTypeColorMap, assetTypeIconMap } from '../NodeTypes/iconMap';
import { downloadAssetExcelTemplate, type ImportMode } from '../../utils/assetExcel';
import { ASSET_DND_MIME } from '../../constants/dnd';

const deploymentText = (count: number) => {
  if (count === 0) return '未部署';
  if (count === 1) return '已部署 1 个实例';
  return `已部署 ${count} 个实例`;
};

const buildBaseInstanceName = (label: string, ip: string) => `${label}_${ip}`;

const AssetPool = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [keyword, setKeyword] = useState('');
  const [mode, setMode] = useState<ImportMode>('append');
  const [importMessage, setImportMessage] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);

  const assetsMap = useAppStore((state) => state.assets);
  const assets = useMemo(() => Object.values(assetsMap), [assetsMap]);
  const nodes = useAppStore((state) => state.nodes);
  const selectedAssetId = useAppStore((state) => state.selectedAssetId);
  const focusedNodeId = useAppStore((state) => state.focusedNodeId);
  const importAssetsFromExcel = useAppStore((state) => state.importAssetsFromExcel);
  const getAssetInstanceCount = useAppStore((state) => state.getAssetInstanceCount);
  const focusAssetInstances = useAppStore((state) => state.focusAssetInstances);
  const locateAssetInstance = useAppStore((state) => state.locateAssetInstance);

  const filteredAssets = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return assets;

    return assets.filter((asset) => {
      const target = [asset.name, asset.ip, asset.type, asset.model ?? '', asset.zoneName ?? '', asset.notes ?? '']
        .join(' ')
        .toLowerCase();

      return target.includes(q);
    });
  }, [assets, keyword]);

  const selectedAssetInstances = useMemo(() => {
    if (!selectedAssetId) return [];

    return nodes.filter((node) => node.type === 'asset' && node.data.assetId === selectedAssetId);
  }, [nodes, selectedAssetId]);

  const instanceDisplayNames = useMemo(() => {
    const used = new Map<string, number>();

    return selectedAssetInstances.map((node) => {
      const base = node.data.instanceName?.trim() || buildBaseInstanceName(node.data.label, node.data.ip);
      const currentCount = (used.get(base) ?? 0) + 1;
      used.set(base, currentCount);
      return currentCount === 1 ? base : `${base}_${currentCount}`;
    });
  }, [selectedAssetInstances]);

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsImporting(true);
    setImportMessage('');

    const result = await importAssetsFromExcel(file, mode);

    if (!result.success) {
      setImportMessage(`导入失败：${result.errors.map((error) => error.message).join('；')}`);
      setIsImporting(false);
      return;
    }

    const emptyRowsHint = result.ignoredEmptyRows > 0 ? `（过滤空行 ${result.ignoredEmptyRows}）` : '';
    setImportMessage(`导入成功：${result.importedCount} 条 ${emptyRowsHint}`);
    setIsImporting(false);
  };

  const handleDragStart = (event: DragEvent<HTMLButtonElement>, assetId: string) => {
    event.dataTransfer.setData(ASSET_DND_MIME, assetId);
    event.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside className={cn('flex h-full flex-col rounded-2xl p-4', micaPanelClass)}>
      <h2 className="text-sm font-semibold text-slate-700">Asset Pool</h2>
      <p className="mt-1 text-xs text-slate-500">拖拽资产到画布创建实例（支持多实例）</p>

      <div className="mt-4 space-y-2">
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索名称 / IP / 类型"
            className="w-full border-none bg-transparent text-sm text-slate-700 outline-none"
          />
        </label>

        <div className="flex items-center gap-2">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as ImportMode)}
            className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-600"
          >
            <option value="append">追加导入</option>
            <option value="overwrite">覆盖导入</option>
          </select>

          <button
            type="button"
            onClick={downloadAssetExcelTemplate}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-600 hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" /> 模板
          </button>

          <button
            type="button"
            onClick={triggerUpload}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-600 hover:bg-slate-50"
            disabled={isImporting}
          >
            <Upload className="h-3.5 w-3.5" /> 上传
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
        </div>

        {importMessage && <div className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600">{importMessage}</div>}
      </div>

      <div className="mt-4 space-y-2 overflow-auto">
        {filteredAssets.map((asset) => {
          const Icon = assetTypeIconMap[asset.type];
          const instanceCount = getAssetInstanceCount(asset.id);

          return (
            <button
              key={asset.id}
              type="button"
              draggable
              onDragStart={(event) => handleDragStart(event, asset.id)}
              onClick={() => focusAssetInstances(asset.id)}
              className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-sky-200 hover:bg-sky-50"
              title="拖拽到画布可创建新实例"
            >
              <span className={`mt-0.5 rounded-lg border p-1 ${assetTypeColorMap[asset.type]}`}><Icon className="h-4 w-4" /></span>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-slate-700">{asset.name}</div>
                <div className="text-xs text-slate-500">{asset.ip}</div>
                <div className="mt-1 text-[11px] text-slate-500">{deploymentText(instanceCount)}</div>
              </div>
            </button>
          );
        })}

        {filteredAssets.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/80 px-3 py-5 text-center text-xs text-slate-500">
            没有匹配的资产
          </div>
        )}
      </div>

      {selectedAssetId && (
        <div className="mt-4 border-t border-slate-200 pt-3">
          <div className="mb-2 text-xs font-semibold text-slate-600">实例定位</div>
          <div className="max-h-44 space-y-1 overflow-auto pr-1">
            {selectedAssetInstances.length === 0 && <div className="text-xs text-slate-500">该资产尚未部署实例</div>}
            {selectedAssetInstances.map((node, index) => (
              <button
                key={node.id}
                type="button"
                onClick={() => locateAssetInstance(node.id)}
                className={cn(
                  'flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-xs',
                  focusedNodeId === node.id
                    ? 'border-sky-300 bg-sky-50 text-sky-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                )}
              >
                <span>{instanceDisplayNames[index]}</span>
                <span className="inline-flex items-center gap-1">
                  <LocateFixed className="h-3 w-3" /> {node.id.slice(-4)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

export default AssetPool;
