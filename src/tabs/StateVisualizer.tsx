import React from "react";
import "./StateVisualizer.css";
import Timeline from "../hub/Timeline";

const StateVisualizer: React.FC = () => {
  return (
    <div className="pageContainer">
      <div
        style={{
          width: "calc(100%)",
          position: "relative",
        }}
      >
        <Timeline />
      </div>
    </div>
  );
};

export default StateVisualizer;
