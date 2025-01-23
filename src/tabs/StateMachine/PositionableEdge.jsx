import React, { useRef, useEffect, useState, useMemo } from "react";
import {
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  useReactFlow,
} from "@xyflow/react";

import ClickableBaseEdge from "./ClickableBaseEdge";
import "./PositionableEdge.css";

export default function PositionableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) {
  const reactFlowInstance = useReactFlow();
  const positionHandlers = data?.positionHandlers ?? [];
  const type = data?.type ?? "default";
  const edgeSegmentsCount = positionHandlers.length + 1;
  const pathRef = useRef(null);
  const [labelPos, setLabelPos] = useState({ x: 0, y: 0 });

  const pathFunction = useMemo(() => {
    switch (type) {
      case "straight":
        return getStraightPath;
      case "smoothstep":
        return getSmoothStepPath;
      default:
        return getBezierPath;
    }
  }, [type]);

  // Memoize the edge segments array to avoid recalculating on every render
  const edgeSegmentsArray = useMemo(() => {
    const segments = [];
    for (let i = 0; i < edgeSegmentsCount; i++) {
      let segmentSourceX, segmentSourceY, segmentTargetX, segmentTargetY;

      if (i === 0) {
        segmentSourceX = sourceX;
        segmentSourceY = sourceY;
      } else {
        const handler = positionHandlers[i - 1];
        segmentSourceX = handler.x;
        segmentSourceY = handler.y;
      }

      if (i === edgeSegmentsCount - 1) {
        segmentTargetX = targetX;
        segmentTargetY = targetY;
      } else {
        const handler = positionHandlers[i];
        segmentTargetX = handler.x;
        segmentTargetY = handler.y;
      }

      const [edgePath, labelX, labelY] = pathFunction({
        sourceX: segmentSourceX,
        sourceY: segmentSourceY,
        sourcePosition,
        targetX: segmentTargetX,
        targetY: segmentTargetY,
        targetPosition,
      });
      segments.push({ edgePath, labelX, labelY });
    }
    return segments;
  }, [
    edgeSegmentsCount,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    positionHandlers,
    pathFunction,
  ]);

  // Adjust the label position
  useEffect(() => {
    if (pathRef.current) {
      const totalLength = pathRef.current.getTotalLength();
      const midLength = totalLength / 2;
      const { x, y } = pathRef.current.getPointAtLength(midLength);
      setLabelPos({ x, y });
    }
  }, [edgeSegmentsArray]); // This will only run when `edgeSegmentsArray` changes

  return (
    <>
      {edgeSegmentsArray.map(({ edgePath }, index) => (
        <ClickableBaseEdge
          onClick={(event) => {
            const position = reactFlowInstance.screenToFlowPosition({
              x: event.clientX,
              y: event.clientY,
            });

            reactFlowInstance.setEdges((edges) => {
              const edgeIndex = edges.findIndex((edge) => edge.id === id);

              edges[edgeIndex].data.positionHandlers.splice(index, 0, {
                x: position.x,
                y: position.y,
              });
              return edges;
            });
          }}
          key={`edge${id}_segment${index}`}
          path={edgePath}
          markerEnd={markerEnd}
          style={style}
        />
      ))}
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelPos.x}px,${labelPos.y}px)`,
              pointerEvents: "all",
              background: "var(--background-color-2)",
              padding: "2px 4px",
              borderRadius: "4px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
            }}
            className="edge-label"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
      <path
        ref={pathRef}
        d={edgeSegmentsArray.map((segment) => segment.edgePath).join(" ")}
        style={{ display: "none" }}
      />
    </>
  );
}
