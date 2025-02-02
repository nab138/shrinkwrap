import React from "react";
import { useComputedNTValue } from "../../ntcore-react/useNTValue";
import "./StateVisualizer.css";
import StateDiagram, { StateNode } from "./StateDiagram";
import Timeline from "../../hub/Timeline";

const StateVisualizer: React.FC = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const rawData: StateNode = useComputedNTValue(
    "/AdvantageKit/RealOutputs/StateMachine/Tree",
    JSON.parse,
    "{}"
  );

  return (
    <div
      className="pageContainer"
      ref={containerRef}
      style={{ padding: 0, margin: 0 }}
    >
      <div
        style={{
          width: "100%",
          position: "relative",
        }}
      >
        <Timeline />
      </div>
      <StateDiagram data={rawData} />
    </div>
  );
};

export default StateVisualizer;
