# Assessor-Blade 交付说明（Phase 0 ~ Phase 9）

## 1) 最终目录树

```text
.
├── DELIVERY.md
├── README.md
├── index.html
├── package.json
├── postcss.config.js
├── settings.jar
├── src
│   ├── App.tsx
│   ├── components
│   │   ├── Canvas
│   │   │   ├── CanvasPlaceholder.tsx
│   │   │   └── TopologyCanvas.tsx
│   │   ├── Inspector
│   │   │   └── InspectorPanel.tsx
│   │   ├── NodeTypes
│   │   │   ├── AssetNode.tsx
│   │   │   ├── ZoneNode.tsx
│   │   │   ├── iconMap.tsx
│   │   │   └── index.ts
│   │   ├── Sidebar
│   │   │   └── AssetPool.tsx
│   │   └── Toolbar
│   │       └── TopToolbar.tsx
│   ├── constants
│   │   ├── dnd.ts
│   │   └── layout.ts
│   ├── hooks
│   │   ├── useDiagramShortcuts.ts
│   │   └── useMicaPanelClass.ts
│   ├── index.css
│   ├── main.tsx
│   ├── store
│   │   ├── slices
│   │   │   ├── assetSlice.ts
│   │   │   ├── diagramSlice.ts
│   │   │   ├── uiSlice.ts
│   │   │   └── zoneSlice.ts
│   │   └── useAppStore.ts
│   ├── types
│   │   └── diagram.ts
│   └── utils
│       ├── assetExcel.ts
│       ├── cn.ts
│       ├── edgeRouting.ts
│       ├── exportJpg.ts
│       └── zoneOwnership.ts
├── tailwind.config.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## 2) 关键 Store 说明

### `useAppStore`（组合入口）
- 通过 Zustand 组合四类 slice：
  - `AssetSlice`：资产主数据、Excel 导入、实例计数。
  - `DiagramSlice`：节点/边、连线、复制实例、删除、撤销重做、JSON 导入导出。
  - `ZoneSlice`：Zone 实体与 Zone 模板本地持久化。
  - `UISlice`：当前选中态、焦点态、剪贴板、导出前 fitView 请求标志。

### `AssetSlice`
- 资产主数据以 `Record<string, Asset>` 存储。
- `updateAsset` 修改资产后会调用 `syncAssetFieldsToNodes`，同步全部关联实例。
- `importAssetsFromExcel(file, mode)` 支持覆盖/追加导入。

### `DiagramSlice`
- 维护 `nodes`、`edges`、`viewport`、`diagramVersion`。
- 支持：
  - `addEdgeFromConnection`
  - `createNodeFromAsset`
  - `duplicateAssetNodeInstance`
  - `removeSelectedElement`
  - `undo` / `redo`
  - `exportDocumentJson` / `importDocumentJson`
- 历史快照含 `nodes + edges + assets`，保证资产字段变更也可撤销。

### `ZoneSlice`
- Zone 业务实体管理。
- 支持 Zone 模板：
  - `saveZoneTemplateToLocal`
  - `clearAndReloadZoneTemplate`

### `UISlice`
- 管理选中节点/边、选中资产、焦点节点、复制缓存。
- `pendingFitViewForExport` 用于导出前画面优化。

---

## 3) 关键数据流说明

### 资产拖拽上图
1. `AssetPool` 通过 HTML5 DnD 写入 `ASSET_DND_MIME`。
2. `TopologyCanvas` 在 `onDrop` 读取 assetId，并将屏幕坐标转换为流图坐标。
3. `createNodeFromAsset` 创建实例节点：新 `node.id`、复用 `assetId`。
4. 调用 `recomputeOwnershipForAll` 重新计算 Zone 归属。

### Inspector 双向编辑
- 资产字段（名称/IP/型号/备注/类型）走 `updateAsset`：
  - 更新资产主数据
  - 扇出同步所有关联实例
- 实例字段（如 instanceName）走 `updateNodeInstanceData`：
  - 仅更新当前实例

### 连线数据流
- 画布 `onConnect` -> `addEdgeFromConnection`。
- 边样式统一 StepEdge + arrow + slate-400。
- 选中边后支持删除。

### 导入导出数据流
- JSON 导出：组织 `assets/zones/nodes/edges/viewport/version/updatedAt`。
- JSON 导入：恢复上述全部并清理选中态。

### JPG 导出数据流
1. Toolbar 先执行预检查统计。
2. 用户选择质量（standard / hd）。
3. 可选触发 fitView（通过 UISlice 状态 + Canvas effect）。
4. 调用 `exportCanvasToJpg` 导出。

---

## 4) Excel 字段映射说明

字段别名映射定义在 `src/utils/assetExcel.ts`：

- `name`: `['资产名称', '名称', '设备名称', 'name']`
- `ip`: `['IP地址', 'IP', 'ip']`
- `type`: `['设备类型', '类型', 'type']`
- `model`: `['设备型号', '型号', 'model']`
- `zone`: `['所属安全域', '安全域', 'zone']`
- `notes`: `['备注', '说明', 'notes']`

校验项：
- 缺少必填列
- 空行过滤
- 未识别设备类型
- 重复 IP
- 文件格式错误

---

## 5) JPG 导出实现说明

实现文件：`src/utils/exportJpg.ts`

- 使用 `html-to-image` 的 `toJpeg`。
- 导出质量：
  - `standard`: quality=0.9, pixelRatio=1.5
  - `hd`: quality=0.96, pixelRatio=2.4
- 预检查统计由 `runExportPrecheck` 提供。
- 导出前可选 fitView。
- 失败提示引导：缩小范围 / 降低质量 / 分区导出（后续增强）。

---

## 6) 已知限制

1. 目前无自动化测试（单测/E2E）与类型检查 CI。
2. smart-edge 仅保留升级接口，未启用智能避障路由。
3. JSON 导入目前按结构信任输入，缺少严格 schema 校验。
4. 导出前预检查采用同步弹窗，交互可进一步产品化为 Dialog。
5. 复杂超大画布导出仍可能受浏览器内存限制。

---

## 7) 后续增强建议

1. **工程可靠性**
   - 引入 Zod/Valibot 对 JSON 工程文件做 schema 校验。
   - 增加 migration 机制（version 升级路径）。

2. **连线增强**
   - 接入 smart-edge（保留接口已就绪）。
   - 加入边标签编辑、边样式模板。

3. **编辑体验**
   - Inspector 拆分组件并支持校验提示。
   - 多选批量编辑与批量删除。

4. **导出能力**
   - 导出区域选择（分区导出）。
   - 后端无头渲染（稳定高分辨率导出）。

5. **可测试性**
   - 单元测试：store 与 util。
   - E2E：拖拽建图、导入导出、快捷键回归。

---

## 运行提示

```bash
npm install
npm run dev
```

如环境无法访问 npm registry，请先配置可用镜像或内网仓库。
