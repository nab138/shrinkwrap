import React, { createContext, useContext, useEffect, useState } from "react";
import { NTClient, NTTopic } from "./NT4";

export enum NetworkTablesStatus {
  IDLE,
  CONNECTING,
  CONNECTED,
  DISCONNECTED,
}

// export const STRUCT_PREFIX = "struct:";
// export const PROTO_PREFIX = "proto:";

let client: NTClient | null = null;

type NetworkTablesContextType = {
  status: NetworkTablesStatus;
  statusText: string;
  ip: string;
  topics: NTTopic[];
  createClient: (ip: string) => void;
  connect: () => Promise<void>;
};

const NetworkTablesContext = createContext<
  NetworkTablesContextType | undefined
>(undefined);

export const NetworkTablesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [status, setStatus] = useState(NetworkTablesStatus.IDLE);
  const [ip, setIP] = useState("");
  const [topics, setTopics] = useState<NTTopic[]>([]);

  useEffect(() => {
    return () => {
      if (client !== null) {
        client.disconnect();
      }
    };
  }, []);

  const onConnect = () => {
    setStatus(NetworkTablesStatus.CONNECTED);
  };

  const onDisconnect = () => {
    setStatus(NetworkTablesStatus.DISCONNECTED);
  };

  const onAnnounce = (topic: NTTopic) => {
    if (topic.name === "") return;
    // let structuredType: string | null = null;
    // if (topic.type.startsWith(STRUCT_PREFIX)) {
    //   structuredType = topic.type.split(STRUCT_PREFIX)[1];
    //   if (structuredType.endsWith("[]")) {
    //     structuredType = structuredType.slice(0, -2);
    //   }
    // } else if (topic.type.startsWith(PROTO_PREFIX)) {
    //   structuredType = ProtoDecoder.getFriendlySchemaType(
    //     topic.type.split(PROTO_PREFIX)[1]
    //   );
    // } else if (topic.type === "msgpack") {
    //   structuredType = "MessagePack";
    // } else if (topic.type === "json") {
    //   structuredType = "JSON";
    // }
    setTopics((prevTopics) => {
      if (!prevTopics.find((t) => t.name === topic.name)) {
        return [...prevTopics, topic];
      }
      return prevTopics;
    });
  };

  const onUnannounce = (topic: NTTopic) => {
    setTopics((prevTopics) => {
      return prevTopics.filter((t) => t.name !== topic.name);
    });
  };

  const createClient = (ip: string) => {
    if (client !== null) {
      client.disconnect();
    }
    setTopics([]);
    client = new NTClient(
      ip,
      "ShrinkWrap",
      onAnnounce,
      onUnannounce,
      () => {},
      onConnect,
      onDisconnect
    );
    setIP(ip);
  };

  const connect = async () => {
    if (client === null) {
      throw new Error("Client not created");
    }
    client.connect();
    client.subscribeTopicsOnly([""], true);
    setStatus(NetworkTablesStatus.CONNECTING);
  };

  const statusText = getStatusText(status, ip);

  return (
    <NetworkTablesContext.Provider
      value={{ status, statusText, ip, topics, createClient, connect }}
    >
      {children}
    </NetworkTablesContext.Provider>
  );
};

export const useNetworktables = (): NetworkTablesContextType => {
  const context = useContext(NetworkTablesContext);
  if (context === undefined) {
    throw new Error(
      "useNetworktables must be used within a NetworkTablesProvider"
    );
  }
  return context;
};

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
