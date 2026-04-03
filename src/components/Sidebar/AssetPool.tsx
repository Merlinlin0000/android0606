import { ChangeEvent } from 'react';
import { Download, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { useAssessorStore } from '../../store/useAssessorStore';
import { downloadSurveyTemplate, parseAssetsFromExcel } from '../../utils/excel';

export const AssetPool = () => {
  const { assets, search, setSearch, importAssets } = useAssessorStore(
    useShallow((state) => ({
    assets: state.assets,
    search: state.search,
    setSearch: state.setSearch,
    importAssets: state.importAssets
    }))
  );

  const filtered = assets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(search.toLowerCase()) ||
      asset.ip.toLowerCase().includes(search.toLowerCase()) ||
      asset.type.toLowerCase().includes(search.toLowerCase())
  );

  const onUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const imported = await parseAssetsFromExcel(file);
    importAssets(imported);
  };

  return (
    <aside className="panel h-full p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Asset Pool</h2>
        <button className="text-xs text-slate-600" onClick={downloadSurveyTemplate}>
          <Download className="inline h-4 w-4" /> 模板
        </button>
      </div>

      <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 cursor-pointer">
        <Upload className="h-4 w-4" /> 上传 Excel
        <input type="file" accept=".xlsx,.xls" className="hidden" onChange={onUpload} />
      </label>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
        placeholder="搜索资产/IP/类型"
      />

      <div className="space-y-2 overflow-auto pr-1">
        {filtered.map((asset) => (
          <motion.div
            key={asset.id}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('application/assessor-asset-id', asset.id);
              event.dataTransfer.effectAllowed = 'move';
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 cursor-grab"
            whileHover={{ y: -2 }}
          >
            <p className="text-sm font-medium text-slate-700">{asset.name}</p>
            <p className="text-xs text-slate-500">{asset.ip}</p>
            <div className="mt-1 flex justify-between items-center">
              <span className="text-xs text-slate-500">{asset.type}</span>
              {asset.isDeployed && <span className="text-[11px] rounded bg-emerald-100 px-2 py-0.5 text-emerald-700">已部署</span>}
            </div>
          </motion.div>
        ))}
      </div>
    </aside>
  );
};
