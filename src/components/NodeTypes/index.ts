import type { NodeTypes } from 'reactflow';
import AssetNode from './AssetNode';
import ZoneNode from './ZoneNode';

export const nodeTypes: NodeTypes = {
  asset: AssetNode,
  zone: ZoneNode,
};
