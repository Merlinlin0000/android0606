import type { DiagramNode } from '../types/diagram';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const containsPoint = (rect: Rect, x: number, y: number) => x >= rect.x && y >= rect.y && x <= rect.x + rect.width && y <= rect.y + rect.height;

const isNodeInsideZone = (node: DiagramNode, zone: Extract<DiagramNode, { type: 'zone' }>) => {
  if (node.id === zone.id) return false;

  const probeX = node.position.x;
  const probeY = node.position.y;

  return containsPoint(
    {
      x: zone.position.x,
      y: zone.position.y,
      width: zone.size.width,
      height: zone.size.height,
    },
    probeX,
    probeY,
  );
};

const buildDepth = (zoneId: string, zoneById: Map<string, Extract<DiagramNode, { type: 'zone' }>>) => {
  let depth = 0;
  let current = zoneById.get(zoneId);

  while (current?.parentId) {
    depth += 1;
    current = zoneById.get(current.parentId);
  }

  return depth;
};

const buildHierarchyPath = (zoneId: string | undefined, zoneById: Map<string, Extract<DiagramNode, { type: 'zone' }>>) => {
  if (!zoneId) return [] as string[];

  const path: string[] = [];
  let current = zoneById.get(zoneId);

  while (current) {
    path.unshift(current.id);
    current = current.parentId ? zoneById.get(current.parentId) : undefined;
  }

  return path;
};

export const recomputeOwnership = (nodes: DiagramNode[]): DiagramNode[] => {
  const zoneNodes = nodes.filter((node): node is Extract<DiagramNode, { type: 'zone' }> => node.type === 'zone');
  const zoneById = new Map(zoneNodes.map((z) => [z.id, z]));

  const next = nodes.map((node) => {
    const candidateZones = zoneNodes.filter((zone) => isNodeInsideZone(node, zone));
    candidateZones.sort((a, b) => buildDepth(b.id, zoneById) - buildDepth(a.id, zoneById));

    const deepestZone = candidateZones[0];
    const parentId = deepestZone?.id;
    const hierarchyPath = buildHierarchyPath(parentId, zoneById);

    if (node.type === 'asset') {
      return {
        ...node,
        parentId,
        hierarchyPath,
        data: {
          ...node.data,
          zoneId: parentId,
        },
      };
    }

    return {
      ...node,
      parentId,
      hierarchyPath,
      data: {
        ...node.data,
        zoneId: node.id,
      },
    };
  });

  return next;
};

export const collectZoneSubtree = (zoneId: string, nodes: DiagramNode[]) => {
  const toDelete = new Set<string>([zoneId]);
  let changed = true;

  while (changed) {
    changed = false;

    nodes.forEach((node) => {
      if (node.parentId && toDelete.has(node.parentId) && !toDelete.has(node.id)) {
        toDelete.add(node.id);
        changed = true;
      }
    });
  }

  return toDelete;
};
