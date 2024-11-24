import { IDockviewPanelProps } from "dockview";
import { Theme } from "@tauri-apps/api/window";
import { useStore } from "../utils/StoreContext";
import Card from "../hub/Card";
import "./Settings.css";
import useNTConnected from "../ntcore-react/useNTConnected";
import { open } from "@tauri-apps/plugin-dialog";
import { platform } from "@tauri-apps/plugin-os";
import { getVersion } from "@tauri-apps/api/app";
import { useUpdate } from "../utils/UpdateContext";

const appVersion = await getVersion();
const isMobile = platform() === "ios" || platform() === "android";

const Settings: React.FC<IDockviewPanelProps<{ id: string }>> = () => {
  const [theme, setTheme] = useStore<Theme>("theme", "light");
  const [connectionIP, setConnectionIP] = useStore<string>(
    "connectionIP",
    "127.0.0.1"
  );
  const [displayConnection, setDisplayConnection] = useStore(
    "displayConnection",
    false
  );
  const [deployDir, setDeployDir] = useStore("deployDir", "");
  const connected = useNTConnected();
  const { checkForUpdates } = useUpdate();

  return (
    <div className="pageContainer settingsContainer">
      <div className="settings">
        <Card title="NetworkTables">
          <p className="settings-text">
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
          <p className="settings-text">Version: {appVersion}</p>
          {!isMobile && (
            <button onClick={() => checkForUpdates(true)}>
              Check for Updates
            </button>
          )}
        </Card>
        <Card title="OxConfig">
          {!isMobile && (
            <label
              style={{
                display: "flex",
                justifyContent: "left",
                alignItems: "center",
                gap: "10px",
              }}
            >
              Deploy Directory
              <button
                onClick={async () => {
                  let deployDirNew = await open({ directory: true });
                  if (deployDirNew) setDeployDir(deployDirNew);
                }}
              >
                Select
              </button>
            </label>
          )}
          {!isMobile && (
            <p className="settings-text">
              {deployDir === "" ? "Not Set" : deployDir}
            </p>
          )}
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
