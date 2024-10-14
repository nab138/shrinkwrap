import React from "react";
import { IDockviewPanelProps } from "dockview";

const Welcome: React.FC<IDockviewPanelProps<{ id: string }>> = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Welcome to ShrinkWrap!</h1>
      <p>The best FRC app ever made</p>
    </div>
  );
};

export default Welcome;
