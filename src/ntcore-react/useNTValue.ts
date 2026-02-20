import { useContext, useEffect, useState, useMemo } from "react";
import NTContext from "./NTContext";
import NTTopicTypes from "./NTTopicType";

export const useNTValue = <T extends NTTopicTypes>(
  key: string,
  defaultValue: T,
  period = 1
) => {
  const client = useContext(NTContext);
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    if (client) {
      const listener = (value: T | null) => {
        setValue(value ?? defaultValue);
      };
      const subscription = client.subscribe(
        key,
        listener,
        false,
        false,
        period
      );
      // let map = client.getRawData().get(key);
      // if (map) {
      //   let latestEntry = Array.from(map.entries()).sort(
      //     (a, b) => b[0] - a[0]
      //   )[0];
      //   if (latestEntry) {
      //     listener(latestEntry[1] as T);
      //   }
      // }

      return () => {
        subscription?.unsubscribe();
      };
    } else {
      throw new Error(
        "No NTProvider found. Please wrap your application in an NTProvider"
      );
    }
  }, [key, client, defaultValue, period]);

  return value;
};

export const useComputedNTValue = <T extends NTTopicTypes, B>(
  key: string,
  compute: (t: T) => B,
  defaultValue: T,
  period = 1
) => {
  const value = useNTValue(key, defaultValue, period);
  // console.log(key, value)
  const computedValue = useMemo(() => compute(value), [value, compute]);
  return computedValue;
};
