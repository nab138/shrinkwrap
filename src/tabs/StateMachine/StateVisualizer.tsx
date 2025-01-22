import React, { useEffect, useState } from "react";
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

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight - 20,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    handleResize(); // Initial call to set dimensions

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  return (
    <div
      className="pageContainer"
      ref={containerRef}
      style={{ padding: 0, margin: 0 }}
    >
      <StateDiagram
        data={rawData}
        width={dimensions.width}
        height={dimensions.height}
      />
    </div>
  );
};

export default StateVisualizer;
