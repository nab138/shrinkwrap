import React, { useCallback, useState } from "react";
import { IDockviewPanelProps } from "dockview";
import ThreeComponent from "./ThreeComponent";
import Sidebar, { Setting } from "../../hub/Sidebar";
import { Item } from "../../hub/NetworkArrayConfig";
import "./ThreeDimensionField.css";
import { useStore } from "../../utils/StoreContext";
import Timeline from "../../hub/Timeline";
import { fields } from "./Fields";

const ThreeDimensionField: React.FC<IDockviewPanelProps<{ id: string }>> = ({
  params,
}) => {
  const initialSettings: Setting[] = [
    {
      id: "field",
      label: "Field",
      type: "dropdown",
      value: "2025",
      options: fields.map((field) => field.year),
    },
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
        setting.id === id ? { ...setting, value: value as any } : setting
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

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  return (
    <div className="pageContainer">
      <div
        style={{
          width: sidebarOpen ? "calc(100% - 250px)" : "calc(100% - 45px)",
          marginLeft: sidebarOpen ? "250px" : "45px",
          position: "relative",
        }}
      >
        <Timeline />
      </div>
      <div className="fieldContainer">
        <ThreeComponent
          robots={(getSettingValue("elements") as Item[])
            .filter((item) => item.type === "Robot" && item.value != "")
            .map((item) => {
              return { key: item.value, robot: "KitBot" };
            })}
          field={`${getSettingValue("field") ?? 2025}`}
          cinematic={getSettingValue("cinematic") as boolean}
        />
      </div>
      <Sidebar
        title="Field Settings"
        settings={settings}
        onSettingChange={handleSettingChange}
        collapsible={true}
        onOpenDidChange={setSidebarOpen}
      />
    </div>
  );
};

export default ThreeDimensionField;
