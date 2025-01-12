import React, { useContext, useEffect, useState } from "react";
import "./Sidebar.css";
import ItemList, { Item } from "./NetworkArrayConfig";
import { fields } from "../tabs/ThreeDimensionField/Fields";
import { StoreContext } from "../utils/StoreContext";
import { open } from "@tauri-apps/plugin-shell";

export type Setting =
  | BooleanSetting
  | StringSetting
  | NumberSetting
  | DropdownSetting
  | ItemListSetting;

interface SettingBase {
  id: string;
  label: string;
}

interface BooleanSetting extends SettingBase {
  type: "boolean";
  value: boolean;
}

interface StringSetting extends SettingBase {
  type: "string";
  value: string;
}

interface NumberSetting extends SettingBase {
  type: "number";
  value: number;
  stepSize?: number;
}

interface DropdownSetting extends SettingBase {
  type: "dropdown";
  value: string;
  options: string[];
  displaySource?: boolean;
}

interface ItemListSetting extends SettingBase {
  type: "itemList";
  value: Item[];
  options?: string[];
  ntTypes?: string[];
}

export interface SidebarProps {
  title: string;
  settings: Setting[];
  onSettingChange: (
    id: string,
    value: boolean | string | number | Item[]
  ) => void;
  collapsible?: boolean;
  onOpenDidChange?: (open: boolean) => void;
  tabId?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  title,
  settings,
  onSettingChange,
  collapsible = true,
  onOpenDidChange = () => {},
  tabId,
}) => {
  const { store } = useContext(StoreContext);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    onOpenDidChange(!isCollapsed);
  }, [isCollapsed]);

  const handleSettingChange = (
    id: string,
    value: boolean | string | number | Item[]
  ) => {
    onSettingChange(id, value);
  };

  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="titleBar">
        {!isCollapsed && <h2 className="title">{title}</h2>}
        {collapsible && (
          <button
            className="collapseBtn"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? ">" : "<"}
          </button>
        )}
      </div>
      {!isCollapsed && (
        <div className="sidebar-settings">
          {settings.map((setting) => (
            <div key={setting.id} className="sidebar-setting">
              {setting.type != "itemList" && <label>{setting.label}</label>}
              {setting.type === "boolean" && (
                <input
                  type="checkbox"
                  checked={setting.value as boolean}
                  onChange={(e) =>
                    handleSettingChange(setting.id, e.target.checked)
                  }
                />
              )}
              {setting.type === "string" && (
                <input
                  type="text"
                  value={setting.value as string}
                  onChange={(e) =>
                    handleSettingChange(setting.id, e.target.value)
                  }
                />
              )}
              {setting.type === "number" && (
                <input
                  type="number"
                  className="smallInput"
                  value={setting.value as number}
                  onChange={(e) =>
                    handleSettingChange(setting.id, parseFloat(e.target.value))
                  }
                  step={setting.stepSize || 1}
                />
              )}
              {setting.type === "dropdown" && (
                <select
                  style={{
                    marginLeft: "5px",
                  }}
                  value={setting.value as string}
                  onChange={(e) =>
                    handleSettingChange(setting.id, e.target.value)
                  }
                >
                  {setting.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}
              {setting.type === "dropdown" &&
                setting.displaySource &&
                tabId && (
                  <button
                    style={{
                      backgroundColor: "#0000",
                      padding: 0,
                      border: "none",
                      color: "#0000EE",
                      textDecoration: "underline",
                      boxShadow: "none",
                    }}
                    onClick={async () => {
                      let settings = await store?.get<Setting[]>(tabId!);
                      let field: string;
                      if (settings == undefined) field = fields[0].year;
                      else
                        field = settings?.find(
                          (setting) => setting.id === "field"
                        )?.value as string;
                      if (field == undefined) field = fields[0].year;
                      open(fields.find((f) => f.year === field)!.source);
                    }}
                  >
                    Source
                  </button>
                )}
              {setting.type === "itemList" && (
                <ItemList
                  label={setting.label}
                  availableTypes={setting.options || []}
                  items={(setting.value as Item[]) || []}
                  types={setting.ntTypes || null}
                  onItemsChange={(items) =>
                    handleSettingChange(setting.id, items)
                  }
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Sidebar;

export const arrayToObject = (array: Setting[]) =>
  array.reduce((obj, item) => {
    obj[item.id] = item;
    return obj;
  }, {} as { [key: string]: Setting });

export const objectToArray = (obj: { [key: string]: Setting }) =>
  Object.keys(obj).map((key) => obj[key]);
