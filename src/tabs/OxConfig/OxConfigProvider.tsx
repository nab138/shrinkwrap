import React, { createContext, useContext, useCallback } from "react";
import { useComputedNTValue, useNTValue } from "../../ntcore-react/useNTValue";
import useNTState from "../../ntcore-react/useNTState";
import { decode } from "@msgpack/msgpack";

export type Parameter = {
    key: string;
    values: string[];
    comment: string;
    type: string;
    displayKey?: string;
};

export type ClassParam = {
    prettyName: string;
    key: string;
    type: string;
    values: string[];
};

export type Class = {
    prettyName: string;
    key: string;
    parameters: ClassParam[];
    displayKey?: string;
};

export type ShotData = {
    shots: {
        distance: number;
        hoodPosition: number;
        shooterSpeed: number;
        shotTime: number;
        timestamp: number;
    }[];
}

interface OxConfigContextType {
    modes: string[];
    currentMode: string;
    parameters: Parameter[];
    classes: Class[];
    connectedClients: any;
    raw: string;
    setMode: (value: string) => void;
    setKey: (value: string) => void;
    setCopyAll: (value: string) => void;
    setClass: (value: string) => void;
    azAimData: ShotData | null;
    mzAimData: ShotData | null;
    setAzAim(value: string): void;
    setMzAim(value: string): void;
}

const OxConfigContext = createContext<OxConfigContextType | undefined>(undefined);

export const useOxConfig = () => {
    const context = useContext(OxConfigContext);
    if (!context) {
        throw new Error("useOxConfig must be used within an OxConfigProvider");
    }
    return context;
};

export const OxConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const computeModes = useCallback(
        (val: string) => val.split(",").filter((v) => v !== ""),
        []
    );
    const modes = useComputedNTValue<string, string[]>(
        "/OxConfig/Modes",
        computeModes,
        ""
    );

    const currentMode = useNTValue<string>("/OxConfig/CurrentMode", "");

    const computeParameters = useCallback((params: string) => {
        if (params == "") return [];
        let paramsRaw = JSON.parse(params);
        let parametersMap: Parameter[] = [];
        for (let paramRaw of paramsRaw) {
            if (paramRaw[0] == "root/mode") continue;
            let key = paramRaw[0];
            let comment = paramRaw[1];
            let type = paramRaw[2].toLowerCase();
            parametersMap.push({ key, values: paramRaw.slice(3), comment, type });
        }
        return parametersMap;
    }, []);

    const parameters = useComputedNTValue<string, Parameter[]>(
        "/OxConfig/Params",
        computeParameters,
        ""
    );

    const computeClasses = useCallback((classesRaw: string) => {
        if (classesRaw == "") return [];
        let parsed: [string, string, ...string[][]][] = JSON.parse(classesRaw);
        let classes: Class[] = [];
        for (let cls of parsed) {
            let prettyName = cls.shift() as string;
            let key = cls.shift() as string;
            let parameters: ClassParam[] = [];
            for (let param of cls) {
                if (typeof param === "string") {
                    console.error("Invalid class parameter (not string[])", param);
                    continue;
                }
                let prettyName = param.shift();
                let key = param.shift();
                let type = param.shift();
                if (
                    prettyName === undefined ||
                    key === undefined ||
                    type === undefined
                ) {
                    console.error("Invalid class parameter", param);
                    continue;
                }
                parameters.push({ prettyName, key, type, values: param });
            }
            classes.push({ prettyName, key, parameters });
        }
        return classes;
    }, []);

    const classes = useComputedNTValue<string, Class[]>(
        "/OxConfig/Classes",
        computeClasses,
        ""
    );

    const computeConnectedClients = useCallback((val: Uint8Array) => {
        try {
            if (val instanceof Uint8Array) {
                return decode(val);
            } else {
                console.error("Expected Uint8Array but received:", val);
                return [];
            }
        } catch (error) {
            return [];
        }
    }, []);

    const connectedClients = useComputedNTValue<any, any>(
        "$clients",
        computeConnectedClients,
        new Uint8Array()
    );

    const raw = useNTValue<string>("/OxConfig/Raw", "");

    const [_, setMode] = useNTState<string>("/OxConfig/ModeSetter", "string", "");
    const [__, setKey] = useNTState<string>("/OxConfig/KeySetter", "string", "");
    const [___, setCopyAll] = useNTState<string>("/OxConfig/CopyAll", "string", "");
    const [____, setClass] = useNTState<string>("/OxConfig/ClassSetter", "string", "");

    const computeAutoAimData = useCallback<(d: string) => ShotData | null>((d) => {
        try {
            return JSON.parse(d) as ShotData;
        } catch (e) {
            console.error(e);
            return null;
        }
    }, []);

    const azAimData = useComputedNTValue<string, ShotData | null>("/SmartDashboard/AzAutoAim", computeAutoAimData, "{}");
    const mzAimData = useComputedNTValue<string, ShotData | null>("/SmartDashboard/MzAutoAim", computeAutoAimData, "{}");

    const [_____, setAzAim] = useNTState<string>("/SmartDashboard/AzAutoAimSet", "string", "");
    const [______, setMzAim] = useNTState<string>("/SmartDashboard/MzAutoAimSet", "string", "");
    const value: OxConfigContextType = {
        modes,
        currentMode,
        parameters,
        classes,
        connectedClients,
        raw,
        setMode,
        setKey,
        setCopyAll,
        setClass,
        azAimData,
        mzAimData,
        setAzAim,
        setMzAim
    };

    return (
        <OxConfigContext.Provider value={value}>
            {children}
        </OxConfigContext.Provider>
    );
};
