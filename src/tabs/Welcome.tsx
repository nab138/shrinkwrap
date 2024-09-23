import React from "react";
import { IDockviewPanelProps } from "dockview";

const Welcome: React.FC<IDockviewPanelProps<{ title: string }>> = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Welcome to ShrinkWrap!</h1>
    </div>
  );
};

export default Welcome;
