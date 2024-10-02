import React, { createContext, useContext, useEffect, useState } from "react";
import { NTClient, NTTopic } from "./NT4";

export enum NetworkTablesStatus {
  IDLE,
  CONNECTING,
  CONNECTED,
  DISCONNECTED,
}

let client: NTClient | null = null;

type NetworkTablesContextType = {
  status: NetworkTablesStatus;
  statusText: string;
  ip: string;
  topics: NTTopic[];
  topicValues: { [key: string]: unknown };
  createClient: (ip: string) => void;
  connect: () => Promise<void>;
  subscribe: (
    topic: string,
    periodic?: number,
    prefixMode?: boolean,
    sendAll?: boolean
  ) => void;
};

const NetworkTablesContext = createContext<
  NetworkTablesContextType | undefined
>(undefined);

export interface NTSubscriptionInfo {
  topic: string;
  periodic: number;
  prefixMode: boolean;
  sendAll: boolean;
}

export const NetworkTablesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [status, setStatus] = useState(NetworkTablesStatus.IDLE);
  const [ip, setIP] = useState("");
  const [topics, setTopics] = useState<NTTopic[]>([]);
  const [topicValues, setTopicValues] = useState<{ [key: string]: unknown }>(
    {}
  );
  const [subscriptions, setSubscriptions] = useState<NTSubscriptionInfo[]>([]);

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

  const onNewTopicData = (topic: NTTopic, _: number, value: unknown) => {
    setTopicValues((prevValues) => ({
      ...prevValues,
      [topic.name]: value,
    }));
  };

  const createClient = (ip: string) => {
    if (client !== null) {
      client.disconnect();
    }
    setTopics([]);
    setTopicValues({});
    client = new NTClient(
      ip,
      "ShrinkWrap",
      onAnnounce,
      onUnannounce,
      onNewTopicData,
      onConnect,
      onDisconnect
    );
    setIP(ip);
    for (let subscription of subscriptions) {
      client.subscribe(
        [subscription.topic],
        subscription.prefixMode,
        subscription.sendAll,
        subscription.periodic
      );
    }
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

  const subscribe = (
    topic: string,
    periodic: number = 0.01,
    prefixMode: boolean = false,
    sendAll: boolean = false
  ) => {
    if (client === null) {
      throw new Error("Client not created");
    }
    setSubscriptions((prevSubscriptions) => {
      return [...prevSubscriptions, { topic, periodic, prefixMode, sendAll }];
    });
    return client.subscribe([topic], prefixMode, sendAll, periodic);
  };

  return (
    <NetworkTablesContext.Provider
      value={{
        status,
        statusText,
        ip,
        topics,
        topicValues,
        createClient,
        connect,
        subscribe,
      }}
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

export const useTopicValue = (topic: string): unknown => {
  const context = useContext(NetworkTablesContext);
  if (context === undefined) {
    throw new Error(
      "useNetworktables must be used within a NetworkTablesProvider"
    );
  }
  const { topicValues, subscribe } = context;

  const [value, setValue] = useState(topicValues[topic]);
  useEffect(() => {
    subscribe(topic);
  }, [topic, subscribe]);

  useEffect(() => {
    setValue(topicValues[topic]);
  }, [topicValues, topic]);

  return value;
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
