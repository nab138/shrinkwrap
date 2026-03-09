import { IDockviewPanelProps } from "dockview";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { NT4_Topic } from "../ntcore-react/NT4";
import useNTTopics from "../ntcore-react/useNTTopics";
import { useNTValue } from "../ntcore-react/useNTValue";
import { StoreContext, useStore } from "../utils/StoreContext";
import "./MjpegStreams.css";

type StoredMjpegTabState = {
  urls?: string[];
  activeUrls?: string[];
};

type StreamState = "idle" | "loading" | "live" | "failed";

type CameraPublisherCamera = {
  key: string;
  rawTopic: string;
  processedTopic: string;
};

const STREAM_COUNT = 4;
const EMPTY_URLS = Array.from({ length: STREAM_COUNT }, () => "");
const CAMERA_NAME_DEFAULTS = Array.from(
  { length: STREAM_COUNT },
  (_, index) => `Camera ${index + 1}`,
);

const ensureSlots = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [...EMPTY_URLS];
  }

  const strings = value.filter(
    (item): item is string => typeof item === "string",
  );
  return Array.from(
    { length: STREAM_COUNT },
    (_, index) => strings[index] ?? "",
  );
};

const ensureCameraNameSlots = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [...CAMERA_NAME_DEFAULTS];
  }

  return Array.from({ length: STREAM_COUNT }, (_, index) =>
    typeof value[index] === "string" && value[index].trim() !== ""
      ? value[index]
      : CAMERA_NAME_DEFAULTS[index],
  );
};

const withCacheBust = (rawUrl: string): string => {
  const trimmed = rawUrl.trim();
  if (trimmed === "") return "";

  try {
    const parsed = new URL(trimmed);
    parsed.searchParams.set("sw_retry", Date.now().toString());
    return parsed.toString();
  } catch {
    const separator = trimmed.includes("?") ? "&" : "?";
    return `${trimmed}${separator}sw_retry=${Date.now()}`;
  }
};

const normalizeStreamUrl = (raw: string): string => {
  const trimmed = raw.trim();
  if (trimmed === "") return "";

  const typedUrl = trimmed.match(/^[a-zA-Z0-9_]+:(https?:\/\/.*)$/);
  if (typedUrl) {
    return typedUrl[1];
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `http://${trimmed}`;
};

const getCameraPublisherUrl = (streams: string[]): string => {
  const preferred = streams[1] ?? streams[0] ?? "";
  return normalizeStreamUrl(preferred);
};

const getStateLabel = (state: StreamState): string => {
  switch (state) {
    case "loading":
      return "Loading";
    case "live":
      return "Live";
    case "failed":
      return "Failed";
    default:
      return "Idle";
  }
};

const parseCameraPublisherCameras = (
  topics: Map<string, NT4_Topic>,
): CameraPublisherCamera[] => {
  const grouped = new Map<string, Partial<CameraPublisherCamera>>();

  topics.forEach((topic) => {
    const topicName = topic.name;
    if (
      !topicName.startsWith("/CameraPublisher/") ||
      !topicName.endsWith("/streams")
    ) {
      return;
    }

    const objectName = topicName
      .replace("/CameraPublisher/", "")
      .replace("/streams", "");
    const lower = objectName.toLowerCase();

    const isInput = lower.endsWith(" input");
    const isOutput = lower.endsWith(" output");
    if (!isInput && !isOutput) {
      return;
    }

    const baseKey = objectName.replace(/\s+(input|output)$/i, "").trim();
    if (baseKey === "") {
      return;
    }

    const current = grouped.get(baseKey) ?? { key: baseKey };
    if (isInput) {
      current.rawTopic = topicName;
    }
    if (isOutput) {
      current.processedTopic = topicName;
    }
    grouped.set(baseKey, current);
  });

  return Array.from(grouped.values())
    .filter(
      (camera): camera is CameraPublisherCamera =>
        typeof camera.key === "string" &&
        typeof camera.rawTopic === "string" &&
        typeof camera.processedTopic === "string",
    )
    .sort((a, b) => a.key.localeCompare(b.key));
};

const CameraPublisherCard: React.FC<{
  camera: CameraPublisherCamera;
  displayName: string;
}> = ({ camera, displayName }) => {
  const rawStreams = useNTValue<string[]>(camera.rawTopic, [], 0.25);
  const processedStreams = useNTValue<string[]>(
    camera.processedTopic,
    [],
    0.25,
  );

  const rawUrl = useMemo(() => getCameraPublisherUrl(rawStreams), [rawStreams]);
  const processedUrl = useMemo(
    () => getCameraPublisherUrl(processedStreams),
    [processedStreams],
  );

  const [rawEnabled, setRawEnabled] = useState(true);
  const [processedEnabled, setProcessedEnabled] = useState(true);
  const [streamState, setStreamState] = useState<StreamState>("idle");
  const [displayUrl, setDisplayUrl] = useState("");

  const activeUrl = useMemo(() => {
    if (processedEnabled && processedUrl !== "") {
      return processedUrl;
    }
    if (rawEnabled && rawUrl !== "") {
      return rawUrl;
    }
    return "";
  }, [processedEnabled, processedUrl, rawEnabled, rawUrl]);

  useEffect(() => {
    if (activeUrl === "") {
      setDisplayUrl("");
      setStreamState("idle");
      return;
    }
    setDisplayUrl(activeUrl);
    setStreamState("loading");
  }, [activeUrl]);

  const retry = () => {
    if (activeUrl === "") return;
    setDisplayUrl(withCacheBust(activeUrl));
    setStreamState("loading");
  };

  return (
    <section className="mjpeg-card">
      <div className="mjpeg-card-header">
        <h3>{displayName}</h3>
        <div className="mjpeg-header-controls">
          <span className={`mjpeg-state mjpeg-state-${streamState}`}>
            {getStateLabel(streamState)}
          </span>
          <button
            className={rawEnabled ? "mjpeg-toggle-on" : "mjpeg-toggle-off"}
            onClick={() => setRawEnabled((value) => !value)}
          >
            Raw {rawEnabled ? "On" : "Off"}
          </button>
          <button
            className={
              processedEnabled ? "mjpeg-toggle-on" : "mjpeg-toggle-off"
            }
            onClick={() => setProcessedEnabled((value) => !value)}
          >
            Processed {processedEnabled ? "On" : "Off"}
          </button>
          <button onClick={retry} disabled={activeUrl === ""}>
            Retry
          </button>
        </div>
      </div>

      <p className="mjpeg-stream-info">
        raw: {rawUrl || "unavailable"} | processed:{" "}
        {processedUrl || "unavailable"}
      </p>

      <div className="mjpeg-preview">
        {displayUrl !== "" ? (
          <img
            src={displayUrl}
            alt={`${displayName} stream`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={() => setStreamState("live")}
            onError={() => setStreamState("failed")}
          />
        ) : (
          <p>Enable Raw or Processed to show a stream.</p>
        )}
      </div>
    </section>
  );
};

const MjpegStreams: React.FC<IDockviewPanelProps<{ id: string }>> = ({
  params,
}) => {
  const tabId = params.id;
  const { store } = useContext(StoreContext);
  const topics = useNTTopics();

  const [cameraDisplayNames] = useStore<string[]>(
    "cameraDisplayNames",
    CAMERA_NAME_DEFAULTS,
  );
  const cameraNames = useMemo(
    () => ensureCameraNameSlots(cameraDisplayNames),
    [cameraDisplayNames],
  );

  const [urls, setUrls] = useState<string[]>([...EMPTY_URLS]);
  const [activeUrls, setActiveUrls] = useState<string[]>([...EMPTY_URLS]);
  const [streamStates, setStreamStates] = useState<StreamState[]>(
    Array.from({ length: STREAM_COUNT }, () => "idle"),
  );

  const discoveredCameras = useMemo(
    () => parseCameraPublisherCameras(topics),
    [topics],
  );

  useEffect(() => {
    let isMounted = true;

    const readSavedState = async () => {
      if (!store) return;

      const savedState = await store.get<StoredMjpegTabState>(tabId);
      if (!savedState || !isMounted) return;

      const savedUrls = ensureSlots(savedState.urls);
      const savedActiveUrls = ensureSlots(savedState.activeUrls);

      setUrls(savedUrls);
      setActiveUrls(savedActiveUrls);
      setStreamStates(
        savedActiveUrls.map((url) => (url.trim() === "" ? "idle" : "loading")),
      );
    };

    readSavedState();

    return () => {
      isMounted = false;
    };
  }, [store, tabId]);

  const persistState = useCallback(
    async (nextUrls: string[], nextActiveUrls: string[]) => {
      if (!store) return;
      await store.set(tabId, {
        urls: nextUrls,
        activeUrls: nextActiveUrls,
      });
      await store.save();
    },
    [store, tabId],
  );

  const updateUrl = (index: number, nextValue: string) => {
    const nextUrls = [...urls];
    nextUrls[index] = nextValue;
    setUrls(nextUrls);
    persistState(nextUrls, activeUrls);
  };

  const loadStream = (index: number) => {
    const nextActiveUrls = [...activeUrls];
    const nextUrl = urls[index].trim();
    nextActiveUrls[index] = nextUrl;
    setActiveUrls(nextActiveUrls);
    setStreamStates((previous) => {
      const next = [...previous];
      next[index] = nextUrl === "" ? "idle" : "loading";
      return next;
    });
    persistState(urls, nextActiveUrls);
  };

  const loadAllStreams = () => {
    const nextActiveUrls = urls.map((url) => url.trim());
    setActiveUrls(nextActiveUrls);
    setStreamStates(
      nextActiveUrls.map((url) => (url === "" ? "idle" : "loading")),
    );
    persistState(urls, nextActiveUrls);
  };

  const clearAllStreams = () => {
    const cleared = [...EMPTY_URLS];
    setUrls(cleared);
    setActiveUrls(cleared);
    setStreamStates(Array.from({ length: STREAM_COUNT }, () => "idle"));
    persistState(cleared, cleared);
  };

  const setStreamState = (index: number, state: StreamState) => {
    setStreamStates((previous) => {
      const next = [...previous];
      next[index] = state;
      return next;
    });
  };

  const streamIndexes = useMemo(
    () => Array.from({ length: STREAM_COUNT }, (_, index) => index),
    [],
  );

  return (
    <div className="pageContainer mjpeg-tab">
      <div className="mjpeg-toolbar">
        <h2>Cameras</h2>
        {discoveredCameras.length === 0 && (
          <div className="mjpeg-toolbar-buttons">
            <button onClick={loadAllStreams}>Load All</button>
            <button onClick={clearAllStreams}>Clear All</button>
          </div>
        )}
      </div>

      {discoveredCameras.length > 0 ? (
        <div className="mjpeg-grid">
          {discoveredCameras.slice(0, STREAM_COUNT).map((camera, index) => (
            <CameraPublisherCard
              key={camera.key}
              camera={camera}
              displayName={cameraNames[index] ?? camera.key}
            />
          ))}
        </div>
      ) : (
        <div className="mjpeg-grid">
          {streamIndexes.map((index) => (
            <section key={index} className="mjpeg-card">
              <div className="mjpeg-card-header">
                <h3>{cameraNames[index]}</h3>
                <div className="mjpeg-header-controls">
                  <span
                    className={`mjpeg-state mjpeg-state-${streamStates[index]}`}
                  >
                    {getStateLabel(streamStates[index])}
                  </span>
                  <button onClick={() => loadStream(index)}>Load</button>
                </div>
              </div>

              <input
                type="text"
                placeholder="http://10.30.44.2:1181/stream.mjpg"
                value={urls[index]}
                onChange={(event) => updateUrl(index, event.target.value)}
              />

              <div className="mjpeg-preview">
                {activeUrls[index] ? (
                  <img
                    src={activeUrls[index]}
                    alt={`${cameraNames[index]} stream`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onLoad={() => setStreamState(index, "live")}
                    onError={() => setStreamState(index, "failed")}
                  />
                ) : (
                  <p>
                    No CameraPublisher streams found. Enter a URL and click
                    Load.
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default MjpegStreams;
