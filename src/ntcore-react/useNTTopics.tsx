import { useContext, useEffect, useState } from "react";
import NTContext from "./NTContext";
import { NT4_Topic } from "./NT4";

const useNTTopics = () => {
  const { client } = useContext(NTContext);
  const [topics, setTopics] = useState<Map<string, NT4_Topic>>(new Map());

  useEffect(() => {
    if (client) {
      const cleanup = client.addTopicsListener((connected) => {
        setTopics(connected);
      });
      return () => {
        if (cleanup) {
          cleanup();
        }
      };
    }
  }, [client]);

  return topics;
};

export default useNTTopics;
