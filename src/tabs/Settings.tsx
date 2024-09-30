import { IDockviewPanelProps } from "dockview";
import { usePrefs } from "../utils/PrefsContext";
import { Theme } from "@tauri-apps/api/window";
import { platform } from "@tauri-apps/plugin-os";
import { useEffect, useState } from "react";
import {
  connect,
  createClient,
  NetworkTablesStatus,
  useNetworktables,
} from "../networktables/NetworkTables";

const Settings: React.FC<IDockviewPanelProps<{ title: string }>> = () => {
  const { theme, setTheme, connectionIP, setConnectionIP } = usePrefs();
  const { status } = useNetworktables();

  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    let getPlatform = async () => {
      const currentPlatform = await platform();
      if (currentPlatform === "ios" || currentPlatform === "android") {
        setMobile(true);
      }
    };
    getPlatform();
  }, []);

  return (
    <div className="pageContainer">
      {mobile && (
        <div>
          <h1>Connection</h1>
          <button
            onClick={() => {
              createClient(connectionIP);
              connect();
            }}
            disabled={status === NetworkTablesStatus.CONNECTING}
          >
            {status === NetworkTablesStatus.CONNECTED
              ? "Connected"
              : status === NetworkTablesStatus.CONNECTING
              ? "Connecting..."
              : status === NetworkTablesStatus.DISCONNECTED
              ? "Reconnecting..."
              : "Connect"}
          </button>
        </div>
      )}
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
