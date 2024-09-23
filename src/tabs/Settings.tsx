import { IDockviewPanelProps } from "dockview";
import {
  connect,
  createClient,
  useStatus,
} from "../networktables/NetworkTables";

const Settings: React.FC<IDockviewPanelProps<{ title: string }>> = () => {
  const status = useStatus();

  return (
    <div className="container">
      <h1>Settings</h1>

      <input
        id="ip"
        onChange={(e) => createClient(e.target.value)}
        placeholder="Connection IP..."
      />
      <button onClick={connect}>Connect</button>

      <p>{status}</p>
    </div>
  );
};

export default Settings;
