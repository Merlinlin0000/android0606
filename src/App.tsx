import AssetPool from './components/Sidebar/AssetPool';
import TopologyCanvas from './components/Canvas/TopologyCanvas';
import InspectorPanel from './components/Inspector/InspectorPanel';
import TopToolbar from './components/Toolbar/TopToolbar';
import { INSPECTOR_WIDTH, SIDEBAR_WIDTH } from './constants/layout';
import { useDiagramShortcuts } from './hooks/useDiagramShortcuts';

const App = () => {
  useDiagramShortcuts();

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
