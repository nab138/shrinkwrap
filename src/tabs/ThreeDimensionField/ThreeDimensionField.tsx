import React, { useState } from "react";
import { IDockviewPanelProps } from "dockview";
import ThreeComponent from "./ThreeComponent";
import Sidebar, { Setting } from "../../hub/Sidebar";
import "./ThreeDimensionField.css";

const ThreeDimensionField: React.FC<
  IDockviewPanelProps<{ title: string }>
> = () => {
  const [settings, setSettings] = useState<Setting[]>([
    { id: "1", label: "Cinematic Mode", type: "boolean", value: false },
    {
      id: "2",
      label: "Select Option",
      type: "string",
      value: "option1",
      options: ["option1", "option2", "option3"],
    },
  ]);

  const handleSettingChange = (
    id: string,
    value: boolean | string | number
  ) => {
    setSettings((prevSettings) =>
      prevSettings.map((setting) =>
        setting.id === id ? { ...setting, value } : setting
      )
    );
  };

  return (
    <div className="pageContainer">
      <div className="fieldContainer">
        <ThreeComponent
          position={[0, 0, 0]}
          field={`Field3d_2024.glb`}
          robot={"KitBot"}
          cinematic={settings[0].value as boolean}
        />
      </div>
      <Sidebar
        title="Field Settings"
        settings={settings}
        onSettingChange={handleSettingChange}
        collapsible={true}
      />
    </div>
  );
};

export default ThreeDimensionField;
