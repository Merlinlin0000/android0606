import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from 'reactflow';

interface EdgeData {
  laneOffset?: number;
}

const SeparatedStepEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  selected,
  data,
}: EdgeProps<EdgeData>) => {
  const laneOffset = data?.laneOffset ?? 0;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
    centerY: (sourceY + targetY) / 2 + laneOffset,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
            className="pointer-events-none absolute rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-white"
          >
            Edge #{id.slice(-4)}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default SeparatedStepEdge;
