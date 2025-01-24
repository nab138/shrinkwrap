import React, { useRef, useEffect, useState, useMemo } from "react";
import {
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  useReactFlow
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
  const [forceUpdate, setForceUpdate] = useState(false);

  let pathFunction;
  switch (type) {
    case "straight":
      pathFunction = getStraightPath;
      break;
    case "smoothstep":
      pathFunction = getSmoothStepPath;
      break;
    default:
      pathFunction = getBezierPath;
  }

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

      const offset = 10;
      if (Math.abs(segmentSourceX - segmentTargetX) < offset) {
        segmentTargetX += offset;
      }
      if (Math.abs(segmentSourceY - segmentTargetY) < offset) {
        segmentTargetY += offset;
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
  }, [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, positionHandlers, pathFunction, forceUpdate]);

  
  useEffect(() => {
    if (pathRef.current) {
      const totalLength = pathRef.current.getTotalLength();
      const midLength = totalLength / 2;
      const { x, y } = pathRef.current.getPointAtLength(midLength);
      setLabelPos({ x, y });
    }
  }, [edgeSegmentsArray]);

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
            setForceUpdate((prev) => !prev);
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
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelPos.x}px,${labelPos.y}px)`,
              pointerEvents: 'all',
              background: "var(--background-color-2)", // Add background color
              padding: '2px 4px', // Add padding
              borderRadius: '4px', // Add border radius
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)', // Add shadow
            }}
            className="edge-label"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
      <path
        ref={pathRef}
        d={edgeSegmentsArray.map(segment => segment.edgePath).join(' ')}
        style={{ display: 'none' }}
      />
      {positionHandlers.map(({ x, y, active }, handlerIndex) => (
        <EdgeLabelRenderer key={`edge${id}_handler${handlerIndex}`}>
          <div
            className="nopan positionHandlerContainer"
            style={{
              transform: `translate(-50%, -50%) translate(${x}px,${y}px)`,
            }}
          >
            <div
              className={`positionHandlerEventContainer ${active} ${
                `${active ?? -1}` !== "-1" ? "active" : ""
              }`}
              data-active={active ?? -1}
              // mouse move is used to move the handler when its been mousedowned on
              onMouseMove={(event) => {
                let activeEdge = parseInt(event.target.dataset.active ?? -1);
                if (activeEdge === -1) {
                  return;
                }
                const position = reactFlowInstance.screenToFlowPosition({
                  x: event.clientX,
                  y: event.clientY,
                });
                reactFlowInstance.setEdges((edges) => {
                  edges[activeEdge].data.positionHandlers[handlerIndex] = {
                    x: position.x,
                    y: position.y,
                    active: activeEdge,
                  };
                  return edges;
                });
                setForceUpdate((prev) => !prev);
              }}
              // mouse up is used to release all the handlers
              onMouseUp={() => {
                reactFlowInstance.setEdges((edges) => {
                  for (let i = 0; i < edges.length; i++) {
                    const handlersLength =
                      edges[i].data.positionHandlers.length;
                    for (let j = 0; j < handlersLength; j++) {
                      edges[i].data.positionHandlers[j].active = -1;
                    }
                  }

                  return edges;
                });
                setForceUpdate((prev) => !prev);
              }}
            >
              <button
                className="positionHandler"
                data-active={active ?? -1}
                // mouse down is used to activate the handler
                onMouseDown={() => {
                  reactFlowInstance.setEdges((edges) => {
                    const edgeIndex = edges.findIndex((edge) => edge.id === id);
                    edges[edgeIndex].data.positionHandlers[
                      handlerIndex
                    ].active = edgeIndex;
                    return edges;
                  });
                  setForceUpdate((prev) => !prev);
                }}
                // right click is used to delete the handler
                onContextMenu={(event) => {
                  event.preventDefault();
                  reactFlowInstance.setEdges((edges) => {
                    const edgeIndex = edges.findIndex((edge) => edge.id === id);
                    edges[edgeIndex].data.positionHandlers.splice(
                      handlerIndex,
                      1
                    );
                    return edges;
                  });
                  setForceUpdate((prev) => !prev);
                }}
              ></button>
            </div>
          </div>
        </EdgeLabelRenderer>
      ))}
    </>
  );
}