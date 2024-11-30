import { createContext } from "react";
import { NTClient } from "./NT4UserFriendly";

const NTContext = createContext<NTClient | null>(null);

export default NTContext;
