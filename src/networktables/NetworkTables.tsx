import { useEffect, useState } from "react";
import { NTClient, NTTopic } from "./NT4";
import ProtoDecoder from "./ProtoDecoder";

export enum NetworkTablesStatus {
  IDLE,
  CONNECTING,
  CONNECTED,
  DISCONNECTED,
}

export const STRUCT_PREFIX = "struct:";
export const PROTO_PREFIX = "proto:";

let client: NTClient | null = null;
let setState: React.Dispatch<React.SetStateAction<NetworkTablesStatus>> | null =
  null;
let setIP: React.Dispatch<React.SetStateAction<string>> | null = null;

let topics: NTTopic[] = [];

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
    (topic: NTTopic) => {
      if (topic.name === "") return;
      let structuredType: string | null = null;
      if (topic.type.startsWith(STRUCT_PREFIX)) {
        structuredType = topic.type.split(STRUCT_PREFIX)[1];
        if (structuredType.endsWith("[]")) {
          structuredType = structuredType.slice(0, -2);
        }
      } else if (topic.type.startsWith(PROTO_PREFIX)) {
        structuredType = ProtoDecoder.getFriendlySchemaType(
          topic.type.split(PROTO_PREFIX)[1]
        );
      } else if (topic.type === "msgpack") {
        structuredType = "MessagePack";
      } else if (topic.type === "json") {
        structuredType = "JSON";
      }
      if (!topics.find((t) => t.name === topic.name)) {
        topics.push(topic);
      }
    },
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

export type NetworktablesHook = {
  status: NetworkTablesStatus;
  statusText: string;
  ip: string;
};

export function useNetworktables(): NetworktablesHook {
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

  let statusText = "Idle";
  if (client) statusText = getStatusText(status, ip);
  return {
    statusText,
    status,
    ip,
  };
}

function getStatusText(status: NetworkTablesStatus, ip: string): string {
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
