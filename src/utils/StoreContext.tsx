import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { createStore, Store } from "@tauri-apps/plugin-store";

export const StoreContext = createContext<{
  storeValues: { [key: string]: any };
  setStoreValue: (key: string, value: any) => void;
}>({ storeValues: {}, setStoreValue: () => {} });

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [storeValues, setStoreValues] = useState<{ [key: string]: any }>({});
  const [store, setStore] = useState<Store | null>(null);

  useEffect(() => {
    const initializeStore = async () => {
      const storeInstance = await createStore("prefs.bin");
      setStore(storeInstance);

      const keys = await storeInstance.keys();
      const values: { [key: string]: any } = {};
      for (const key of keys) {
        values[key] = await storeInstance.get(key);
      }
      setStoreValues(values);
    };

    initializeStore();
  }, []);

  const setStoreValue = useCallback(
    async (key: string, value: any) => {
      if (!store) return;

      setStoreValues((prevValues) => ({
        ...prevValues,
        [key]: value,
      }));
      await store.set(key, value);
      await store.save();
    },
    [store]
  );

  const contextValue = useMemo(
    () => ({ storeValues, setStoreValue }),
    [storeValues, setStoreValue]
  );

  if (!store) {
    return null;
  }

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = <T,>(
  key: string,
  initialValue: T
): [T, (value: T | ((oldValue: T) => T)) => void] => {
  const { storeValues, setStoreValue } = useContext(StoreContext);
  const [value, setValue] = useState<T>(storeValues[key] ?? initialValue);

  useEffect(() => {
    if (storeValues[key] !== undefined && storeValues[key] !== value) {
      setValue(storeValues[key] ?? initialValue);
    }
  }, [storeValues, key, initialValue, value]);

  const setStoredValue = useCallback(
    (newValue: T | ((oldValue: T) => T)) => {
      const valueToStore =
        typeof newValue === "function"
          ? (newValue as (oldValue: T) => T)(value)
          : newValue;
      setValue(valueToStore);
      setStoreValue(key, valueToStore);
    },
    [key, setStoreValue, value]
  );

  return [value, setStoredValue];
};
