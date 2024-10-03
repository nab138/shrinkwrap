import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import useSaveLoad from "./saveload";

type Theme = "light" | "dark" | "abyss";

interface PrefsContextType {
  savePrefs: () => Promise<void>;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  connectionIP: string;
  setConnectionIP: (ip: string) => void;
}

const PrefsContext = createContext<PrefsContextType | undefined>(undefined);

export const PrefsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [save, load] = useSaveLoad("preferences.json");
  const [theme, setTheme] = useState<Theme>("light");
  const [connectionIP, setConnectionIP] = useState<string>("127.0.0.1");

  const savePrefs = useCallback(() => {
    return save(JSON.stringify({ theme, connectionIP }));
  }, [save, theme, connectionIP]);

  useEffect(() => {
    savePrefs();
  }, [savePrefs]);

  useEffect(() => {
    if (!load) return;
    (async () => {
      const prefs = await load();
      if (prefs == null) return;
      const { theme, connectionIP } = JSON.parse(prefs);
      setTheme(theme);
      setConnectionIP(connectionIP);
    })();
  }, [load]);

  return (
    <PrefsContext.Provider
      value={{ theme, setTheme, savePrefs, connectionIP, setConnectionIP }}
    >
      {children}
    </PrefsContext.Provider>
  );
};

export const usePrefs = (): PrefsContextType => {
  const context = useContext(PrefsContext);
  if (!context) {
    throw new Error("usePrefs must be used within a PrefsProvider");
  }
  return context;
};
