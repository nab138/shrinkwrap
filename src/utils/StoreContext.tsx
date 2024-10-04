import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { createStore } from "@tauri-apps/plugin-store";

const StoreContext = createContext<{ [key: string]: any }>({});

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [storeValues, setStoreValues] = useState<{ [key: string]: any }>({});
  const [store, setStore] = useState<any>(null);

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
): [T, (value: T) => void] => {
  const { storeValues, setStoreValue } = useContext(StoreContext);
  const [value, setValue] = useState<T>(storeValues[key] ?? initialValue);

  useEffect(() => {
    setValue(storeValues[key] ?? initialValue);
  }, [storeValues, key, initialValue]);

  const setStoredValue = useCallback(
    (newValue: T) => {
      setValue(newValue);
      setStoreValue(key, newValue);
    },
    [key, setStoreValue]
  );

  return [value, setStoredValue];
};
