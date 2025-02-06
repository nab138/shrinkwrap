import { useContext, useEffect, useState } from "react";
import NTContext from "./NTContext";

const useNTPlaybackControls: () => [
  boolean,
  (playing: boolean) => void
] = () => {
  const client = useContext(NTContext);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  useEffect(() => {
    if (!isPlaying) return;
    if (client) {
      let lastTime = performance.now();
      let interval = setInterval(() => {
        let curTime = performance.now();
        let dt = curTime - lastTime;
        lastTime = curTime;
        if (client.getSelectedTimestamp() >= client.getCurrentTimestamp()) {
          setIsPlaying(false);
          clearInterval(interval);
          return;
        }
        client.setSelectedTimestamp(client.getSelectedTimestamp() + dt * 1000);
      }, 10);
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [client, isPlaying]);

  return [isPlaying, setIsPlaying];
};

export default useNTPlaybackControls;
