import React, { useCallback, useState } from "react";
import { IDockviewPanelProps } from "dockview";
import ThreeComponent from "./ThreeComponent";
import Sidebar, { Item, Setting } from "../../hub/Sidebar";
import "./ThreeDimensionField.css";

const ThreeDimensionField: React.FC<
  IDockviewPanelProps<{ title: string }>
> = () => {
  const initialSettings: Setting[] = [
    { id: "cinematic", label: "Cinematic Mode", type: "boolean", value: false },
    {
      id: "elements",
      label: "Elements",
      type: "itemList",
      value: [],
      options: ["Robot"],
    },
  ];

  const [settings, setSettings] = useState<Setting[]>(initialSettings);

  const handleSettingChange = (
    id: string,
    value: boolean | string | number | Item[]
  ) => {
    setSettings((prevSettings) =>
      prevSettings.map((setting) =>
        setting.id === id ? { ...setting, value } : setting
      )
    );
  };

  const getSettingValue = useCallback(
    (id: string) => {
      const setting = settings.find((setting) => setting.id === id);
      return setting ? setting.value : undefined;
    },
    [settings]
  );

  return (
    <div className="pageContainer">
      <div className="fieldContainer">
        <ThreeComponent
          position={[0, 0, 0]}
          field={`Field3d_2024.glb`}
          robot={"KitBot"}
          cinematic={getSettingValue("cinematic") as boolean}
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
