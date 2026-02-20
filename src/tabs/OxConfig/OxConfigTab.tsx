import React from "react";
import { IDockviewPanelProps } from "dockview";
import OxConfig from "./OxConfig";

const OxConfigTab: React.FC<IDockviewPanelProps> = (props) => {
    return (
        <OxConfig {...props} />
    );
};

export default OxConfigTab;