import { useContext, useEffect, useState } from "react";
import NTContext from "./NTContext";

const useNTTimestamp = () => {
  const { client, selectedTimestamp, setSelectedTimestamp } =
    useContext(NTContext);
  const [connectedTimestamp, setConnectedTimestamp] = useState(0);

  useEffect(() => {
    if (client) {
      setConnectedTimestamp(client.getConnectedTimestamp());
    }
  }, [client]);

  return {
    connectedTimestamp,
    selectedTimestamp,
    setSelectedTimestamp,
  };
};

export default useNTTimestamp;
