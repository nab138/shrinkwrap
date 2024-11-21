import React, { useCallback } from "react";
import { IDockviewPanelProps } from "dockview";
import ThreeComponent from "./ThreeComponent";
import Sidebar, { Setting } from "../../hub/Sidebar";
import { Item } from "../../hub/NetworkArrayConfig";
import "./ThreeDimensionField.css";
import { useStore } from "../../utils/StoreContext";

const ThreeDimensionField: React.FC<IDockviewPanelProps<{ id: string }>> = ({
  params,
}) => {
  const initialSettings: Setting[] = [
    { id: "cinematic", label: "Cinematic Mode", type: "boolean", value: false },
    {
      id: "elements",
      label: "Elements",
      type: "itemList",
      value: [],
      options: ["Robot"],
      ntTypes: ["double[]"],
    },
  ];

  const [settings, setSettings] = useStore<Setting[]>(
    params.id,
    initialSettings
  );

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
          robots={(getSettingValue("elements") as Item[])
            .filter((item) => item.type === "Robot" && item.value != "")
            .map((item) => {
              return { key: item.value, robot: "KitBot" };
            })}
          field={`Field3d_2024.glb`}
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
