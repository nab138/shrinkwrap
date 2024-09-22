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
  client = new NTClient(
    ip,
    "ShrinkWrap",
    () => {},
    () => {},
    () => {},
    onConnect,
    onDisconnect
  );
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

  useEffect(() => {
    setState = updateStatus;
    return () => {
      setState = null;
    };
  }, []);

  switch (status) {
    case NetworkTablesStatus.IDLE:
      return "Idle";
    case NetworkTablesStatus.CONNECTING:
      return "Connecting...";
    case NetworkTablesStatus.CONNECTED:
      return "Connected";
    case NetworkTablesStatus.DISCONNECTED:
      return "Disconnected";
    default:
      return "Unknown";
  }
}
