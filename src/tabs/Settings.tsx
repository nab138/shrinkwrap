import { IDockviewPanelProps } from "dockview";
import { usePrefs } from "../utils/PrefsContext";
import { Theme } from "@tauri-apps/api/window";

const Settings: React.FC<IDockviewPanelProps<{ title: string }>> = () => {
  const { theme, setTheme, connectionIP, setConnectionIP } = usePrefs();

  return (
    <div className="pageContainer">
      <h1>Settings</h1>
      <ul
        style={{
          listStyleType: "none",
          textAlign: "center",
          paddingLeft: "0px",
          lineHeight: "3em",
        }}
      >
        <li>
          <input
            id="ip"
            onChange={(e) => setConnectionIP(e.target.value)}
            placeholder="Connection IP..."
            value={connectionIP}
          />
        </li>
        <li>
          <label>Theme: </label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as Theme)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="abyss">Abyss</option>
          </select>
        </li>
      </ul>
    </div>
  );
};

export default Settings;
