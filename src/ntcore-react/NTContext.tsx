import { createContext } from "react";
import { TopicInfo } from "ntcore-ts-client-monorepo/packages/ntcore-ts-client/src/lib/pubsub/pubsub";
import { NetworkTables } from "ntcore-ts-client-monorepo/packages/ntcore-ts-client/src";

type NTContextType = {
  client: NetworkTables | null;
  topicNames: string[];
  topics: TopicInfo[];
};

const NTContext = createContext<NTContextType>({
  client: null,
  topicNames: [],
  topics: [],
});

export default NTContext;
