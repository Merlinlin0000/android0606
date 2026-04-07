import { toJpeg } from 'html-to-image';
import type { DiagramEdge, DiagramNode } from '../types/diagram';

export type ExportQuality = 'standard' | 'hd';

export interface ExportPrecheckSummary {
  unassignedAssetCount: number;
  topLevelZoneCount: number;
  maxZoneDepth: number;
  totalNodes: number;
  totalEdges: number;
}

export const runExportPrecheck = (nodes: DiagramNode[], edges: DiagramEdge[]): ExportPrecheckSummary => {
  const assetNodes = nodes.filter((node) => node.type === 'asset');
  const zoneNodes = nodes.filter((node) => node.type === 'zone');

  return {
    unassignedAssetCount: assetNodes.filter((node) => !node.parentId).length,
    topLevelZoneCount: zoneNodes.filter((node) => !node.parentId).length,
    maxZoneDepth: zoneNodes.reduce((max, zone) => Math.max(max, zone.hierarchyPath?.length ?? 0), 0),
    totalNodes: nodes.length,
    totalEdges: edges.length,
  };
};

const qualityConfig: Record<ExportQuality, { quality: number; pixelRatio: number }> = {
  standard: { quality: 0.9, pixelRatio: 1.5 },
  hd: { quality: 0.96, pixelRatio: 2.4 },
};

export const exportCanvasToJpg = async (element: HTMLElement, quality: ExportQuality) => {
  const config = qualityConfig[quality];

  const dataUrl = await toJpeg(element, {
    quality: config.quality,
    pixelRatio: config.pixelRatio,
    backgroundColor: '#f8fafc',
    cacheBust: true,
  });

  const link = document.createElement('a');
  link.download = `topology-${Date.now()}.jpg`;
  link.href = dataUrl;
  link.click();
};

export const formatPrecheckSummary = (summary: ExportPrecheckSummary) => {
  return [
    '导出预检查摘要：',
    `- 未归属资产数量：${summary.unassignedAssetCount}`,
    `- 顶层 Zone 数量：${summary.topLevelZoneCount}`,
    `- Zone 最大嵌套层级：${summary.maxZoneDepth}`,
    `- 节点总数：${summary.totalNodes}`,
    `- 连线总数：${summary.totalEdges}`,
  ].join('\n');
};

export const exportFailHint =
  '导出失败：请尝试缩小画布范围、降低导出质量，或分区导出（后续增强方向）。';
