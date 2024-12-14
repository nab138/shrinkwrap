import React, { useCallback, useState } from "react";
import { IDockviewPanelProps } from "dockview";
import Sidebar, { Setting } from "../hub/Sidebar";
import { useStore } from "../utils/StoreContext";
import { Item } from "../hub/NetworkArrayConfig";
import Timeline from "../hub/Timeline";
import "./TwoDimensionField.css";

const TwoDimensionField: React.FC<IDockviewPanelProps<{ id: string }>> = ({
  params,
}) => {
  const initialSettings: Setting[] = [
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

export default TwoDimensionField;
