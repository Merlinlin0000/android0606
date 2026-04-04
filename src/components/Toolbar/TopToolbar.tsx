import { useRef, type ChangeEvent } from 'react';
import { Download, FolderPlus, FolderSync, LayoutTemplate, Save, Upload } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { exportCanvasToJpg, exportFailHint, formatPrecheckSummary, runExportPrecheck, type ExportQuality } from '../../utils/exportJpg';

const TopToolbar = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const saveZoneTemplateToLocal = useAppStore((state) => state.saveZoneTemplateToLocal);
  const clearAndReloadZoneTemplate = useAppStore((state) => state.clearAndReloadZoneTemplate);
  const exportDocumentJson = useAppStore((state) => state.exportDocumentJson);
  const diagramName = useAppStore((state) => state.diagramName);
  const importDocumentJson = useAppStore((state) => state.importDocumentJson);
  const nodes = useAppStore((state) => state.nodes);
  const edges = useAppStore((state) => state.edges);
  const requestFitViewForExport = useAppStore((state) => state.requestFitViewForExport);
  const upsertZone = useAppStore((state) => state.upsertZone);
  const createZoneNode = useAppStore((state) => state.createZoneNode);

  const onImportClick = () => fileInputRef.current?.click();
  const createId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    return `zone-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  };

  const onCreateZone = () => {
    const zoneName = window.prompt('请输入区域名称', 'New Zone');
    if (!zoneName) return;

    const zoneColor = window.prompt('请输入区域颜色（HEX）', '#38bdf8') || '#38bdf8';
    const zoneId = createId();

    upsertZone({
      id: zoneId,
      name: zoneName.trim() || 'New Zone',
      color: zoneColor,
      description: '用户新增区域',
    });
    createZoneNode({
      zoneId,
      position: {
        x: 180 + nodes.filter((node) => node.type === 'zone').length * 32,
        y: 120 + nodes.filter((node) => node.type === 'zone').length * 28,
      },
      level: 0,
    });
  };

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const text = await file.text();
    importDocumentJson(text);
  };

  const onExportJpg = async () => {
    const summary = runExportPrecheck(nodes, edges);
    const precheckText = formatPrecheckSummary(summary);
    const proceed = window.confirm(`${precheckText}\n\n是否继续导出 JPG？`);
    if (!proceed) return;

    const qualityInput = window.prompt('请选择导出质量：standard（标准）或 hd（高清）', 'standard');
    const quality: ExportQuality = qualityInput?.toLowerCase() === 'hd' ? 'hd' : 'standard';

    const needFitView = window.confirm('导出前是否执行 fitView 优化画面？');
    if (needFitView) {
      requestFitViewForExport();
      await new Promise((resolve) => window.setTimeout(resolve, 360));
    }

    const element = document.getElementById('topology-canvas-export');
    if (!element) return;

    try {
      await exportCanvasToJpg(element, quality);
    } catch {
      window.alert(exportFailHint);
    }
  };

  const onSaveJson = () => {
    const suggestedName = `${(diagramName || 'diagram').trim() || 'diagram'}.json`;
    const userInput = window.prompt('请输入导出文件名', suggestedName);
    if (userInput === null) return;
    exportDocumentJson(userInput);
  };

  return (
    <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-mica backdrop-blur-md">
      <h1 className="text-base font-semibold text-slate-700">Assessor-Blade</h1>
      <div className="flex items-center gap-2">
        <button onClick={onSaveJson} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
          <Save className="h-4 w-4" />
          Save JSON
        </button>
        <button onClick={onImportClick} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
          <Upload className="h-4 w-4" />
          Load JSON
        </button>
        <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={onFileChange} className="hidden" />
        <button onClick={onExportJpg} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
          <Download className="h-4 w-4" />
          Export JPG
        </button>
        <button onClick={onCreateZone} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
          <FolderPlus className="h-4 w-4" />
          新增区域
        </button>
        <button
          onClick={saveZoneTemplateToLocal}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          <LayoutTemplate className="h-4 w-4" />
          Save Zone Template
        </button>
        <button
          onClick={clearAndReloadZoneTemplate}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          <FolderSync className="h-4 w-4" />
          Reload Zone Template
        </button>
      </div>
    </div>
  );
};

export default TopToolbar;
