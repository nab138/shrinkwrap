import { NetworkTablesTypeInfo } from "ntcore-ts-client";
import { useContext, useEffect, useState } from "react";
import NTContext from "./NTContext";
import NTTopicTypes from "./NTTopicType";

export const useNTValue = <T extends NTTopicTypes>(
  key: string,
  ntType: NetworkTablesTypeInfo,
  defaultValue: T,
  period = 1
) => {
  const context = useContext(NTContext);
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    if (context) {
      if (!context.client) return;
      const listener = (value: T | null) => {
        setValue(value ?? defaultValue);
      };
      const clientTopic = context.client.createTopic(key, ntType, defaultValue);
      console.log(clientTopic.isRegular());
      console.log(context.client.client.getTopicFromName(key));
      const subscriptionUID = clientTopic.subscribe(listener, {
        periodic: period,
      });
      console.log("Subscribed to", key);

      return () => {
        if (subscriptionUID && clientTopic) {
          clientTopic.unsubscribe(subscriptionUID);
        }
      };
    } else {
      throw new Error(
        "No NTProvider found. Please wrap your application in an NTProvider"
      );
    }
  }, [key, context, context.client]);

  return value;
};

// Provide a useComputedNTValue hook that takes a function that returns a value
// and the function is called whenever the value is updated.
// It can return any type, but should still be typesafe (generics)

export const useComputedNTValue = <T extends NTTopicTypes, B>(
  key: string,
  ntType: NetworkTablesTypeInfo,
  compute: (t: T) => B,
  defaultValue: T,
  period = 1
) => {
  const [computedValue, setComputedValue] = useState<B>(compute(defaultValue));
  const value = useNTValue(key, ntType, defaultValue, period);
  useEffect(() => {
    setComputedValue(compute(value));
  }, [value]);

  return computedValue;
};
