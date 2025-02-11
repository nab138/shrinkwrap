import { useContext, useEffect, useState } from "react";
import NTContext from "./NTContext";

const useNTLive = () => {
  const client = useContext(NTContext);
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (client) {
      const cleanup = client.addLiveModeListener((live) => {
        setLive(live);
      });
      return () => {
        if (cleanup) {
          cleanup();
        }
      };
    }
  }, [client]);

  return live;
};

export default useNTLive;
