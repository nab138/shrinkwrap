import { IDockviewPanelProps } from "dockview";
import { Theme } from "@tauri-apps/api/window";
import { StoreContext, useStore } from "../utils/StoreContext";
import Card from "../hub/Card";
import "./Settings.css";
import useNTConnected from "../ntcore-react/useNTConnected";
import { open } from "@tauri-apps/plugin-dialog";
import { platform } from "@tauri-apps/plugin-os";
import { getVersion } from "@tauri-apps/api/app";
import { useUpdate } from "../utils/UpdateContext";
import { useContext, useEffect, useState } from "react";
import { devModePromise } from "../main";
import { useToast } from "react-toast-plus";
import {
  exportConfig,
  importConfigFromJson,
  importLog,
} from "../utils/MenubarCode";
import NTContext from "../ntcore-react/NTContext";

const isMobile = platform() === "ios" || platform() === "android";

const Settings: React.FC<IDockviewPanelProps<{ id: string }>> = () => {
  const [theme, setTheme] = useStore<Theme>("theme", "light");
  const [autoUpdate, setAutoUpdate] = useStore<boolean>("autoUpdate", true);
  const [connectionIP, setConnectionIP] = useStore<string>(
    "connectionIP",
    "10.30.44.2"
  );
  const [deployDir, setDeployDir] = useStore("deployDir", "");
  const connected = useNTConnected();
  const [appVersion, setAppVersion] = useState<string>("");
  const { checkForUpdates } = useUpdate();
  const { addToast } = useToast();
  const [devMode, setDevMode] = useState(false);
  const [devStoreInstance, setDevStoreInstance] = useState<any>(null);
  const { store } = useContext(StoreContext);
  const client = useContext(NTContext);

  useEffect(() => {
    getVersion().then((version) => setAppVersion(version));
    devModePromise.then(({ devMode, devStoreInstance }) => {
      setDevMode(devMode);
      setDevStoreInstance(devStoreInstance);
    });
  }, []);

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
          <button onClick={() => importLog(client, addToast)}>
            Open Log file
          </button>
        </Card>
        <Card title="Config">
          <button
            onClick={() => {
              let input = document.createElement("input");
              input.type = "file";
              input.onchange = async (_) => {
                let file = input.files?.item(0);
                if (!file) {
                  addToast.error("Failed to read file");
                  return;
                }
                let config = await file?.text();
                if (!config) {
                  addToast.error("Failed to read file");
                  return;
                }
                importConfigFromJson(config, store, addToast);
              };
              input.click();
            }}
          >
            Import Config
          </button>
          <button onClick={() => exportConfig(store, addToast)}>
            Export Config
          </button>
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
            <div style={{ width: "fit-content" }}>
              <label>Check for updates </label>
              <select
                value={autoUpdate ? "auto" : "never"}
                onChange={(e) => setAutoUpdate(e.target.value === "auto")}
              >
                <option value="auto">At Startup</option>
                <option value="never">Manually</option>
              </select>
            </div>
          )}
          {!isMobile && (
            <button onClick={() => checkForUpdates(true)}>
              Check for Updates
            </button>
          )}
        </Card>
        {!isMobile && (
          <Card title="OxConfig">
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

            <p className="settings-text">
              {deployDir === "" ? "Not Set" : deployDir}
            </p>
          </Card>
        )}
        <Card title="Debug">
          <button
            onClick={async () => {
              await devStoreInstance.set("devmode", !devMode);
              await devStoreInstance.save();
              addToast(
                ({ id, onClose }) => (
                  <span>
                    <span>
                      Restart to {devMode ? "disable" : "enable"} developer mode
                    </span>
                    <br />
                    <button
                      style={{
                        marginTop: "10px",
                      }}
                      onClick={() => {
                        onClose(id);
                        window.location.reload();
                      }}
                    >
                      Restart Now
                    </button>
                  </span>
                ),
                "info",
                {
                  lifetime: 5000,
                  autoClose: true,
                  closeButton: { visible: false },
                }
              );
            }}
          >
            {" "}
            {devMode ? "Disable" : "Enable"} Developer Mode
          </button>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
