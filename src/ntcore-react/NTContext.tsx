import { createContext } from "react";
import { NetworkTables } from "ntcore-ts-client-monorepo/packages/ntcore-ts-client/src/index";

type NTContextType = { client: NetworkTables | null; topicNames: string[] };

const NTContext = createContext<NTContextType>({
  client: null,
  topicNames: [],
});

export default NTContext;
