import React, { createContext, useContext } from "react";
import { useNTValue } from "../../ntcore-react/useNTValue";
import { useStore } from "../../utils/StoreContext";

interface StateMachineContextProps {
  activeState: string;
  lightMode: boolean;
}

const StateMachineContext = createContext<StateMachineContextProps | undefined>(
  undefined
);

export const StateMachineProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const activeState: string = useNTValue(
    "/SmartDashboard/StateMachine/CurrentState",
    "",
    0.01
  );
  const [theme] = useStore<"light" | "dark" | "abyss">("theme", "light");

  return (
    <StateMachineContext.Provider
      value={{ activeState, lightMode: theme === "light" }}
    >
      {children}
    </StateMachineContext.Provider>
  );
};

export const useStateMachine = (): StateMachineContextProps => {
  const context = useContext(StateMachineContext);
  if (!context) {
    throw new Error(
      "useActiveState must be used within an StateMachineProvider"
    );
  }
  return context;
};
