import { useCallback, useEffect, useMemo } from "react";
import { ShotData, useOxConfig } from "./OxConfig/OxConfigProvider";
import "./RebuiltAutoAim.css";
import { IDockviewPanelProps } from "dockview";
import { ErrorIcon, SuccessIcon, useToast } from "react-toast-plus";
import { useStore } from "../utils/StoreContext";
import useNTConnected from "../ntcore-react/useNTConnected";
import { platform } from "@tauri-apps/plugin-os";
import { invoke } from "@tauri-apps/api/core";
import useNTLive from "../ntcore-react/useNTLive";

const RebuiltAutoAim: React.FC<
    IDockviewPanelProps<{ id: string }>
> = () => {
    const {
        setKey,
        parameters,
        currentMode,
        modes,
        azAimData,
        mzAimData,
        setAzAim,
        setMzAim
    } = useOxConfig();

    const connected = useNTConnected();
    const {
        connectedClients,
    } = useOxConfig();
    const [deployDir] = useStore("deployDir", "");
    const { addToast, removeToast } = useToast();

    useEffect(() => {
        if (isMobile) return;
        if (deployDir === "") {
            let warning = addToast.error(
                "[AutoAim] Deploy directory is unset. Changes will be overwritten on code rebuild."
            );
            return () => {
                removeToast(warning.id);
            };
        }
    }, [deployDir]);

    const modeIndex = useMemo(() => {
        return modes.findIndex((mode) => mode === currentMode);
    }, [currentMode, modes]);

    const aimModeParam = useMemo(() => {
        return parameters.find((param) => param.key === "Shooter Midzone Calibration Mode");
    }, [parameters]);

    const tuningModeParam = useMemo(() => {
        return parameters.find((param) => param.key === "Shooter Calibration Mode");
    }, [parameters]);

    const flywheelSpeedParam = useMemo(() => {
        return parameters.find((param) => param.key === "CalibrationShotFlywheelSpeed");
    }, [parameters]);

    const hoodPositionParam = useMemo(() => {
        return parameters.find((param) => param.key === "CalibrationShotHoodPosition");
    }, [parameters]);

    return <div className="pageContainer">
        <div className="aimbot-header">
            <h2>ProGaming Aimbot</h2>
            {isMobile && (
                <>
                    {connected &&
                        connectedClients.some((client: any) => {
                            if (client === undefined || client === null) return false;
                            if (client.id === undefined || client.id === null)
                                return false;
                            return client.id.includes("ShrinkWrapDesktop");
                        }) ? (
                        <div className="pc-indicator">
                            PC <SuccessIcon />
                        </div>
                    ) : (
                        <div className="pc-indicator">
                            PC <ErrorIcon />
                        </div>
                    )}
                </>
            )}
            <label className="aimbot-checkbox">Tuning enabled:
                <input type="checkbox" checked={tuningModeParam?.values[modeIndex] === "true"} onChange={(e) => setKey([tuningModeParam?.key, tuningModeParam?.comment, ...modes.map(() => e.target.checked ? "true" : "false")].join(","))} />
            </label>
            <label className="aimbot-checkbox">Midzone calibration:
                <input type="checkbox" checked={aimModeParam?.values[modeIndex] === "true"} onChange={(e) => setKey([aimModeParam?.key, aimModeParam?.comment, ...modes.map(() => e.target.checked ? "true" : "false")].join(","))} />
            </label>
            <label>Calibration flywheel speed:
                <input type="number" value={flywheelSpeedParam?.values[modeIndex] ?? ""} onChange={(e) => { const val = parseFloat(e.target.value); if (Number.isFinite(val)) setKey([flywheelSpeedParam?.key, flywheelSpeedParam?.comment, ...modes.map(() => e.target.value)].join(",")) }} />
            </label>
            <label>Calibration hood position:
                <input type="number" value={hoodPositionParam?.values[modeIndex] ?? ""} onChange={(e) => { const val = parseFloat(e.target.value); if (Number.isFinite(val)) setKey([hoodPositionParam?.key, hoodPositionParam?.comment, ...modes.map(() => e.target.value)].join(",")) }} />
            </label>
        </div>
        <div className="aimbot-tables">
            <AutoAimTable data={azAimData} setter={setAzAim} jsonPath="azaim.json" title="Alliance Zone" key={"az"} connected={connected} connectedClients={connectedClients} />
            <AutoAimTable data={mzAimData} setter={setMzAim} jsonPath="mzaim.json" title="Neutral Zone" key={"mz"} connected={connected} connectedClients={connectedClients} />
        </div>
    </div>
};

export default RebuiltAutoAim;


const isMobile = platform() === "ios" || platform() === "android";

const AutoAimTable: React.FC<{
    data: ShotData | null;
    setter: (value: string) => void;
    jsonPath: string;
    title: string;
    connected: boolean;
    connectedClients: any;
}> = ({ data, setter, jsonPath, title, connected, connectedClients }) => {
    const { addToast } = useToast();
    const liveMode = useNTLive();
    const [deployDir] = useStore("deployDir", "");

    useEffect(() => {
        if (!connected || isMobile || deployDir === "") return;
        (async () => {
            let result = await invoke("write_autoaim", {
                deploy: deployDir,
                filename: jsonPath,
                data: JSON.stringify(data),
                timestamp: Date.now(),
            });
            if (result === "success") {
                addToast.success("[AutoAim] Wrote config to deploy folder");
            } else if (result === "no-exist") {
                addToast.error(
                    "[AutoAim] Deploy directory missing or doesn't contain config.json"
                );
            } else if (result !== "time") {
                addToast.error("[AutoAim] Failed to save config, check permissions");
            }
        })();
    }, [data, connected, deployDir]);

    useEffect(() => {
        if (!isMobile || !connected || connectedClients.length === 0) return;
        if (
            !connectedClients.some((client: any) => {
                if (client === undefined || client === null) return false;
                if (client.id === undefined || client.id === null) return false;
                return client.id.includes("ShrinkWrapDesktop");
            })
        ) {
            addToast.warning(
                "[AutoAim] Shrinkwrap mobile is unable to save changes to the config file unless a desktop client is connected."
            );
        }
    }, [connected, connectedClients]);

    const updateData = useCallback((newData: ShotData) => {
        let json: string;
        try {
            json = JSON.stringify(newData);
        } catch (e) {
            console.error(e);
            return;
        }
        setter(json);
    }, [setter]);


    if (data == null || data == undefined) return <div>Invalid data</div>;
    if (data.shots === undefined) return <div>No shots recorded</div>;

    return <div className="aimbot-table">
        <h3>{title}</h3>
        <table>
            <thead>
                <tr>
                    <th>Distance</th>
                    <th>Hood Position</th>
                    <th>Shooter Speed</th>
                    <th>Shot Time</th>
                    <th>Timestamp</th>
                    <th>Delete</th>
                </tr>
            </thead>
            <tbody>
                {data.shots.map((shot, index) => (
                    <tr key={index}>
                        <td><input disabled={!connected || !liveMode} type="number" value={shot.distance} onChange={(e) => { const val = parseFloat(e.target.value); if (Number.isFinite(val)) updateData({ shots: data.shots.map((s, i) => i === index ? { ...s, distance: val } : s) }); }} /></td>
                        <td><input disabled={!connected || !liveMode} type="number" value={shot.hoodPosition} onChange={(e) => { const val = parseFloat(e.target.value); if (Number.isFinite(val)) updateData({ shots: data.shots.map((s, i) => i === index ? { ...s, hoodPosition: val } : s) }); }} /></td>
                        <td><input disabled={!connected || !liveMode} type="number" value={shot.shooterSpeed} onChange={(e) => { const val = parseFloat(e.target.value); if (Number.isFinite(val)) updateData({ shots: data.shots.map((s, i) => i === index ? { ...s, shooterSpeed: val } : s) }); }} /></td>
                        <td><input disabled={!connected || !liveMode} type="number" value={shot.shotTime} onChange={(e) => { const val = parseFloat(e.target.value); if (Number.isFinite(val)) updateData({ shots: data.shots.map((s, i) => i === index ? { ...s, shotTime: val } : s) }); }} /></td>
                        <td>{new Date(shot.timestamp).toLocaleString()}</td>
                        <td><button disabled={!connected || !liveMode} onClick={() => updateData({ shots: data.shots.filter((_, i) => i !== index) })}>🗑</button></td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
};