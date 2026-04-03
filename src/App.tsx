import { Plus, Save, Upload, FileDown } from 'lucide-react';
import { useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { FlowCanvas } from './components/Canvas/FlowCanvas';
import { InspectorPanel } from './components/Inspector/InspectorPanel';
import { AssetPool } from './components/Sidebar/AssetPool';
import { useCanvasHotkeys } from './hooks/useCanvasHotkeys';
import { useAssessorStore } from './store/useAssessorStore';
import { exportWordByZones } from './utils/report';

const App = () => {
  useCanvasHotkeys();

  const canvasHostRef = useRef<HTMLDivElement>(null);
  const { addZoneNode, saveZoneTemplate, loadZoneTemplate, clearCanvas, nodes, assets } = useAssessorStore(
    useShallow((state) => ({
    addZoneNode: state.addZoneNode,
    saveZoneTemplate: state.saveZoneTemplate,
    loadZoneTemplate: state.loadZoneTemplate,
    clearCanvas: state.clearCanvas,
    nodes: state.nodes,
    assets: state.assets
    }))
  );

  const onExport = async () => {
    if (!canvasHostRef.current) return;
    const zones = nodes.filter((node) => node.type === 'zoneNode');
    await exportWordByZones(canvasHostRef.current, zones, assets);
  };

  return (
    <main className="h-screen bg-slate-50 p-3 flex gap-3">
      <div className="w-[280px] min-w-[280px]">
        <AssetPool />
      </div>

      <section className="flex-1 panel p-2 flex flex-col gap-2">
        <header className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/80 px-3 py-2">
          <h1 className="text-sm font-semibold text-slate-700">Infinite Canvas</h1>
          <div className="flex gap-2">
            <button className="rounded-lg border border-slate-200 px-2 py-1 text-xs" onClick={addZoneNode}>
              <Plus className="inline h-3 w-3" /> 新建安全域
            </button>
            <button className="rounded-lg border border-slate-200 px-2 py-1 text-xs" onClick={saveZoneTemplate}>
              <Save className="inline h-3 w-3" /> 保存模板
            </button>
            <button className="rounded-lg border border-slate-200 px-2 py-1 text-xs" onClick={loadZoneTemplate}>
              <Upload className="inline h-3 w-3" /> 加载模板
            </button>
            <button className="rounded-lg border border-slate-200 px-2 py-1 text-xs" onClick={clearCanvas}>
              清空
            </button>
            <button className="rounded-lg border border-slate-200 px-2 py-1 text-xs" onClick={onExport}>
              <FileDown className="inline h-3 w-3" /> Word 导出
            </button>
          </div>
        </header>
        <div ref={canvasHostRef} className="flex-1 rounded-xl overflow-hidden border border-slate-200">
          <FlowCanvas />
        </div>
      </section>

      <div className="w-[300px] min-w-[300px]">
        <InspectorPanel />
      </div>
    </main>
  );
};

export default App;
