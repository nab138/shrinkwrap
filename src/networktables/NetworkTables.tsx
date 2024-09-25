import { useEffect, useState } from "react";
import { NTClient } from "./NT4";

export enum NetworkTablesStatus {
  IDLE,
  CONNECTING,
  CONNECTED,
  DISCONNECTED,
}

let client: NTClient | null = null;
let setState: React.Dispatch<React.SetStateAction<NetworkTablesStatus>> | null =
  null;
let setIP: React.Dispatch<React.SetStateAction<string>> | null = null;

function onConnect() {
  if (setState) {
    setState(NetworkTablesStatus.CONNECTED);
  }
}

function onDisconnect() {
  if (setState) {
    setState(NetworkTablesStatus.DISCONNECTED);
  }
}
export function createClient(ip: string) {
  if (client !== null) {
    client.disconnect();
  }
  client = new NTClient(
    ip,
    "ShrinkWrap",
    () => {},
    () => {},
    () => {},
    onConnect,
    onDisconnect
  );
  if (setIP) {
    setIP(ip);
  }
}

export async function connect() {
  if (client === null) {
    throw new Error("Client not created");
  }
  client.connect();
  if (setState) {
    setState(NetworkTablesStatus.CONNECTING);
  }
}
// useStatus hook for react
export function useStatus(): string {
  const [status, updateStatus] = useState(NetworkTablesStatus.IDLE);
  const [ip, updateIp] = useState("");

  useEffect(() => {
    setState = updateStatus;
    setIP = updateIp;
    return () => {
      setState = null;
      setIP = null;
    };
  }, []);

  if (!client) {
    return "Idle";
  }

  switch (status) {
    case NetworkTablesStatus.IDLE:
      return "Idle";
    case NetworkTablesStatus.CONNECTING:
      return `Connecting to ${ip}...`;
    case NetworkTablesStatus.CONNECTED:
      return "Connected to " + ip;
    case NetworkTablesStatus.DISCONNECTED:
      return "Disconnected";
    default:
      return "Unknown";
  }
}
