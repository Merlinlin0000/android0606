import { useEffect } from 'react';
import AssetPool from './components/Sidebar/AssetPool';
import TopologyCanvas from './components/Canvas/TopologyCanvas';
import InspectorPanel from './components/Inspector/InspectorPanel';
import TopToolbar from './components/Toolbar/TopToolbar';
import { INSPECTOR_WIDTH, SIDEBAR_WIDTH } from './constants/layout';
import { useDiagramShortcuts } from './hooks/useDiagramShortcuts';
import { useAppStore } from './store/useAppStore';

const DIAGRAM_LOCAL_CACHE_KEY = 'assessor-blade-diagram-autosave-v1';

const App = () => {
  useDiagramShortcuts();
  const importDocumentJson = useAppStore((state) => state.importDocumentJson);
  const diagramId = useAppStore((state) => state.diagramId);
  const diagramName = useAppStore((state) => state.diagramName);
  const diagramVersion = useAppStore((state) => state.diagramVersion);
  const assets = useAppStore((state) => state.assets);
  const zones = useAppStore((state) => state.zones);
  const nodes = useAppStore((state) => state.nodes);
  const edges = useAppStore((state) => state.edges);
  const viewport = useAppStore((state) => state.viewport);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const cached = window.localStorage.getItem(DIAGRAM_LOCAL_CACHE_KEY);
    if (!cached) return;

    importDocumentJson(cached);
  }, [importDocumentJson]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const payload = JSON.stringify({
      version: diagramVersion,
      id: diagramId,
      name: diagramName,
      assets: Object.values(assets),
      zones: Object.values(zones),
      nodes,
      edges,
      viewport,
      updatedAt: new Date().toISOString(),
    });

    window.localStorage.setItem(DIAGRAM_LOCAL_CACHE_KEY, payload);
  }, [assets, diagramId, diagramName, diagramVersion, edges, nodes, viewport, zones]);

  return (
    <div className="flex h-full min-h-screen flex-col bg-slate-50 p-4">
      <TopToolbar />

      <main className="grid flex-1 gap-4" style={{ gridTemplateColumns: `${SIDEBAR_WIDTH}px minmax(0, 1fr) ${INSPECTOR_WIDTH}px` }}>
        <AssetPool />
        <TopologyCanvas />
        <InspectorPanel />
      </main>
    </div>
  );
};

export default App;
