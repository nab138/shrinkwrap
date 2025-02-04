import { useContext, useEffect, useState } from "react";
import NTContext from "./NTContext";

const useNTWritable = () => {
  const client = useContext(NTContext);
  const [writable, setWritable] = useState(false);
  useEffect(() => {
    if (client) {
      const cleanup = client.addLogModeListener((connected) => {
        setWritable(connected);
      });
      return () => {
        if (cleanup) {
          cleanup();
        }
      };
    }
  }, [client]);

  return writable;
};

export default useNTWritable;
