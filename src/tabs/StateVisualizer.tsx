import React, { useEffect, useMemo } from "react";
import { useComputedNTValue } from "../ntcore-react/useNTValue";
import "./StateVisualizer.css";
import StateDiagram, { StateNode } from "./StateDiagram";

const StateVisualizer: React.FC = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const rawData: StateNode = useComputedNTValue(
    "/SmartDashboard/State Tree",
    JSON.parse,
    "{}"
  );

  return (
    <div className="pageContainer" ref={containerRef}>
      <StateDiagram
        data={rawData}
        width={containerRef.current?.clientWidth || 0}
        height={containerRef.current?.clientHeight || 0}
      />
    </div>
  );
};

export default StateVisualizer;
