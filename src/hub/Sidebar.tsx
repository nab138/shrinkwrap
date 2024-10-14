import React, { useState } from "react";
import "./Sidebar.css";
import ItemList, { Item } from "./NetworkArrayConfig";
import { NetworkTablesTypeInfo } from "ntcore-ts-client-monorepo/packages/ntcore-ts-client/src";

export interface Setting {
  id: string;
  label: string;
  type: "boolean" | "string" | "number" | "custom" | "itemList";
  value: boolean | string | number | Item[];
  options?: string[];
  ntTypes?: NetworkTablesTypeInfo[] | null;
}

export interface SidebarProps {
  title: string;
  settings: Setting[];
  onSettingChange: (
    id: string,
    value: boolean | string | number | Item[]
  ) => void;
  collapsible?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  title,
  settings,
  onSettingChange,
  collapsible = true,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

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
              {setting.type === "string" && setting.options ? (
                <select
                  value={setting.value as string}
                  onChange={(e) =>
                    handleSettingChange(setting.id, e.target.value)
                  }
                >
                  {setting.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                setting.type === "string" && (
                  <input
                    type="text"
                    value={setting.value as string}
                    onChange={(e) =>
                      handleSettingChange(setting.id, e.target.value)
                    }
                  />
                )
              )}
              {setting.type === "number" && (
                <input
                  type="number"
                  value={setting.value as number}
                  onChange={(e) =>
                    handleSettingChange(setting.id, parseFloat(e.target.value))
                  }
                />
              )}
              {setting.type === "custom" && (
                <div>Custom input for {setting.label}</div>
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
