import React from "react";
import { useComputedNTValue } from "../../ntcore-react/useNTValue";
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
    <div
      className="pageContainer"
      ref={containerRef}
      style={{ padding: 0, margin: 0 }}
    >
      <StateDiagram data={rawData} />
    </div>
  );
};

export default StateVisualizer;
