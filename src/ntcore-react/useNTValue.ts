import { useContext, useEffect, useState } from "react";
import NTContext from "./NTContext";
import NTTopicTypes from "./NTTopicType";

export const useNTValue = <T extends NTTopicTypes>(
  key: string,
  defaultValue: T,
  period = 1
) => {
  const { client } = useContext(NTContext);
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

      return () => {
        subscription.unsubscribe();
      };
    } else {
      throw new Error(
        "No NTProvider found. Please wrap your application in an NTProvider"
      );
    }
  }, [key, client]);

  return value;
};

// Provide a useComputedNTValue hook that takes a function that returns a value
// and the function is called whenever the value is updated.
// It can return any type, but should still be typesafe (generics)

export const useComputedNTValue = <T extends NTTopicTypes, B>(
  key: string,
  compute: (t: T) => B,
  defaultValue: T,
  period = 1
) => {
  const [computedValue, setComputedValue] = useState<B>(compute(defaultValue));
  const value = useNTValue(key, defaultValue, period);
  useEffect(() => {
    setComputedValue(compute(value));
  }, [value]);

  return computedValue;
};
