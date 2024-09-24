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
}

const PrefsContext = createContext<PrefsContextType | undefined>(undefined);

export const PrefsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [save, load] = useSaveLoad("prefs.json");
  const [theme, setTheme] = useState<Theme>("light");

  const savePrefs = useCallback(() => {
    return save(JSON.stringify({ theme }));
  }, [save, theme]);

  useEffect(() => {
    if (!load) return;
    (async () => {
      const prefs = await load();
      if (prefs == null) return;
      const { theme } = JSON.parse(prefs);
      setTheme(theme);
    })();
  }, [load]);

  return (
    <PrefsContext.Provider value={{ theme, setTheme, savePrefs }}>
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
