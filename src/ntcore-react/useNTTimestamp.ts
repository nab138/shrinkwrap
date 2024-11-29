import { useContext, useEffect, useState } from "react";
import NTContext from "./NTContext";

const useNTTimestamp = () => {
  const client = useContext(NTContext);
  const [connectedTimestamp, setConnectedTimestamp] = useState(0);
  const [selectedTimestamp, setSelectedTimestamp] = useState(0);

  useEffect(() => {
    if (client) {
        const updateConnectedTimestamp = () => {
            setConnectedTimestamp(client.getConnectedTimestamp());
        };
    
    }
  }, [client]);

  return {
    connectedTimestamp,
    selectedTimestamp,
    setSelectedTimestamp
  }
};

export default useNTTimestamp;
