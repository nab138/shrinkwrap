import React, { useState } from "react";
import "./Sidebar.css";
import ItemList from "./NetworkArrayConfig";

export interface Setting {
  id: string;
  label: string;
  type: "boolean" | "string" | "number" | "custom" | "itemList";
  value: boolean | string | number | Item[];
  options?: string[];
}

export interface Item {
  id: string;
  type: string;
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
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSettingChange = (
    id: string,
    value: boolean | string | number | Item[]
  ) => {
    const updatedSettings = localSettings.map((setting) =>
      setting.id === id ? { ...setting, value } : setting
    );
    setLocalSettings(updatedSettings);
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
        <div className="settings">
          {localSettings.map((setting) => (
            <div key={setting.id} className="setting">
              <label>{setting.label}</label>
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
                  availableTypes={setting.options || []}
                  items={(setting.value as Item[]) || []}
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