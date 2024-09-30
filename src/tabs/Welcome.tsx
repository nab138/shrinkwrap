import React from "react";
import { IDockviewPanelProps } from "dockview";

const Welcome: React.FC<IDockviewPanelProps<{ title: string }>> = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Welcome to ShrinkWrap!</h1>
      <p>
        This build should've been published automatically through github
        actions, no confirmation required
      </p>
    </div>
  );
};

export default Welcome;
