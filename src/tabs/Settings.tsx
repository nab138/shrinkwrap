import { IDockviewPanelProps } from "dockview";
import { Theme } from "@tauri-apps/api/window";
import { useStore } from "../utils/StoreContext";
import Card from "../hub/Card";
import "./Settings.css";
import useNTConnected from "../ntcore-react/useNTConnected";

const Settings: React.FC<IDockviewPanelProps<{ title: string }>> = () => {
  const [theme, setTheme] = useStore<Theme>("theme", "light");
  const [connectionIP, setConnectionIP] = useStore<string>(
    "connectionIP",
    "127.0.0.1"
  );
  const [displayConnection, setDisplayConnection] = useStore(
    "displayConnection",
    false
  );
  const connected = useNTConnected();

  return (
    <div className="pageContainer settingsContainer">
      <div className="settings">
        <Card title="NetworkTables">
          <p
            style={{ padding: 0, width: "100%", textAlign: "left", margin: 0 }}
          >
            Status: {connected ? "Connected" : "Disconnected"}
          </p>
          <input
            id="ip"
            onChange={(e) => setConnectionIP(e.target.value)}
            placeholder="Connection IP..."
            value={connectionIP}
            style={{ paddingLeft: "10px" }}
          />
        </Card>
        <Card title="Application Settings">
          <div style={{ width: "fit-content" }}>
            <label>Theme: </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as Theme)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="abyss">Abyss</option>
            </select>
          </div>
        </Card>
        <Card title="Debug">
          <label style={{ display: "flex", justifyContent: "space-between" }}>
            Display Connection Errors
            <input
              type="checkbox"
              checked={displayConnection}
              onChange={(e) => setDisplayConnection(e.target.checked)}
            />
          </label>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
