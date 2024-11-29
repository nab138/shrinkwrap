import { createContext } from "react";
import { NTClient } from "./NT4UserFriendly";

const NTContext = createContext<{
  client: NTClient | null;
  selectedTimestamp: number;
  setSelectedTimestamp: (timestamp: number) => void;
}>({
  client: null,
  selectedTimestamp: -1,
  setSelectedTimestamp: () => {},
});

export default NTContext;
