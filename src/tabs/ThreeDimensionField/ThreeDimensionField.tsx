import React, { useCallback, useState, useContext, useEffect } from "react";
import { IDockviewPanelProps } from "dockview";
import ThreeComponent from "./ThreeComponent";
import Sidebar, { Setting } from "../../hub/Sidebar";
import { Item } from "../../hub/NetworkArrayConfig";
import "./ThreeDimensionField.css";
import { NetworkTablesTypeInfos } from "ntcore-ts-client-monorepo/packages/ntcore-ts-client/src";
import { StoreContext } from "../../utils/StoreContext";

const ThreeDimensionField: React.FC<IDockviewPanelProps<{ id: string }>> = ({
  params,
}) => {
  const { storeValues, setStoreValue } = useContext(StoreContext);
  const initialSettings: Setting[] = [
    { id: "cinematic", label: "Cinematic Mode", type: "boolean", value: false },
    {
      id: "elements",
      label: "Elements",
      type: "itemList",
      value: [],
      options: ["Robot"],
      ntTypes: [NetworkTablesTypeInfos.kDoubleArray],
    },
  ];

  const [settings, setSettings] = useState<Setting[]>(initialSettings);

  useEffect(() => {
    if (params.id === undefined || params.id === "") return;
    if (storeValues[params.id] === undefined) {
      setStoreValue(params.id, settings);
    } else if (settings !== storeValues[params.id]) {
      setSettings(storeValues[params.id]);
    }
  }, [storeValues, params.id]);

  useEffect(() => {
    if (params.id === undefined || params.id === "") return;
    setStoreValue(params.id, settings);
  }, [settings, params.id]);

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
