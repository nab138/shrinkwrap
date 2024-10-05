import { NetworkTablesTypeInfo } from "ntcore-ts-client-monorepo/packages/ntcore-ts-client/src/index";
import { useContext, useEffect, useState } from "react";
import NTContext from "./NTContext";
import NTTopicTypes from "./NTTopicType";

const useNTValue = <T extends NTTopicTypes>(
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
      const subscriptionUID = clientTopic.subscribe(listener, true, {
        periodic: period,
      });

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

export default useNTValue;
