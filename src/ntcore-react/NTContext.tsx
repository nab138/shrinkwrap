import { createContext } from "react";
import { NetworkTables, NetworkTablesTypeInfo } from "ntcore-ts-client";

export type TopicInfo = {
  name: string;
  type: NetworkTablesTypeInfo;
};

type NTContextType = {
  client: NetworkTables | null;
  topics: TopicInfo[];
};

const NTContext = createContext<NTContextType>({
  client: null,
  topics: [],
});

export default NTContext;
