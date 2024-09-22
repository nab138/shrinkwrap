import {
  connect,
  createClient,
  useStatus,
} from "../networktables/NetworkTables";

export default function ConnectionManagerTab() {
  const status = useStatus();

  return (
    <div className="container">
      <h1>Welcome to ShrinkWrap</h1>

      <p>The next-generation FRC Suite</p>

      <input
        id="ip"
        onChange={(e) => createClient(e.target.value)}
        placeholder="Connection IP..."
      />
      <button onClick={connect}>Connect</button>

      <p>{status}</p>
    </div>
  );
}
