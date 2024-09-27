import React, { useState } from "react";
import "./Sidebar.css";

export interface Setting {
  id: string;
  label: string;
  type: "boolean" | "string" | "number" | "custom";
  value: boolean | string | number;
  options?: string[]; // Optional property for predefined choices
}

export interface SidebarProps {
  title: string;
  settings: Setting[];
  onSettingChange: (id: string, value: boolean | string | number) => void;
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
    value: boolean | string | number
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
