import { useContext, useEffect, useState } from "react";
import NTContext from "./NTContext";
import NTTopicTypes from "./NTTopicType";

const useNTState = <T extends NTTopicTypes>(
  key: string,
  type: string,
  defaultValue: T,
  unretained = false
): [T, (value: T) => void] => {
  const { client } = useContext(NTContext);
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    if (client) {
      const listener = (value: T | null) => {
        setValue(value ?? defaultValue);
      };
      const subscription = client.subscribe(key, listener);
      client.publish(key, type);
      if (unretained) client.getClient().setRetained(key, false);

      return () => {
        subscription.unsubscribe();
      };
    } else {
      throw new Error(
        "No NTProvider found. Please wrap your application in an NTProvider"
      );
    }
  }, [key, client]);

  /**
   * Set the value of the topic
   *
   * Will likely throw an error if multiple apps try to set the value at the same time
   * @param value Value to set
   * @param publishProperties Properties to pass to the publish method
   */
  const setNTValue = (value: T) => {
    if (!client) return;
    client.publish(key, type);
    if (unretained) client.getClient().setRetained(key, false);
    client.setValue(key, value);
    setValue(value);
  };

  return [value, setNTValue];
};

export default useNTState;
