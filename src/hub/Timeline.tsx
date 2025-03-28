import { useCallback, useContext, useEffect, useRef } from "react";
import "./Timeline.css";
import { useStore } from "../utils/StoreContext";
import NTContext from "../ntcore-react/NTContext";
import useNTConnected from "../ntcore-react/useNTConnected";
import {
  BiFastForwardCircle,
  BiPlayCircle,
  BiPauseCircle,
} from "react-icons/bi";
import useNTWritable from "../ntcore-react/useNTWritable";
import useNTPlaybackControls from "../ntcore-react/useNTPlaybackControls";

const Timeline: React.FC = () => {
  const client = useContext(NTContext);
  const connected = useNTConnected();
  const log = useNTWritable();
  const [playing, setPlaying] = useNTPlaybackControls();

  const [theme] = useStore<string>("theme", "light");

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const liveButtonRef = useRef<HTMLDivElement>(null);

  const animationFrameRef = useRef<number | null>(null);
  const hoverXRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) return;

    const context = canvas.getContext("2d");
    if (!context) return;
    contextRef.current = context;

    const render = () => {
      const context = contextRef.current;
      const container = containerRef.current;
      const canvas = canvasRef.current;

      if (!canvas || !context || !container || !client || !(connected || log))
        return;

      const width = container.clientWidth;
      const height = container.clientHeight;
      const light = theme === "light";

      canvas.width = width;
      canvas.height = height;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, width, height);

      const timeRange: [number, number] = [
        client.getConnectedTimestamp() / 1000000,
        client.getCurrentTimestamp() / 1000000,
      ];
      const stepSize = calcAxisStepSize(timeRange, width, 100);
      context.lineWidth = 0.5;
      context.strokeStyle = light ? "#222" : "#eee";
      context.fillStyle = light ? "#222" : "#eee";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.globalAlpha = 0.5;
      let stepPos = Math.ceil(cleanFloat(timeRange[0] / stepSize)) * stepSize;
      while (stepPos <= timeRange[1]) {
        const x = scaleValue(stepPos, timeRange, [0, width]);

        const text = cleanFloat(stepPos).toString() + "s";
        const textWidth = context.measureText(text).width;
        const textX = clampValue(
          x,
          textWidth / 2 + 3,
          width - textWidth / 2 - 3
        );
        context.fillText(text, textX, height / 2);
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();

        stepPos += stepSize;
      }

      let enabledIntervals: [number, number][] = [];
      let enabledChanges = client
        .getRawData()
        .get("/AdvantageKit/DriverStation/Enabled");
      if (enabledChanges) {
        for (let [timestamp, value] of enabledChanges) {
          if (value) {
            enabledIntervals.push([timestamp, -1]);
          } else if (enabledIntervals.length > 0) {
            enabledIntervals[enabledIntervals.length - 1][1] = timestamp;
          }
        }
      }
      enabledIntervals = enabledIntervals.filter(
        (interval, i) =>
          !(i !== enabledIntervals.length - 1 && interval[1] === -1)
      );

      if (enabledIntervals.length > 0) {
        let lastInterval = enabledIntervals[enabledIntervals.length - 1];
        if (lastInterval[1] === -1)
          lastInterval[1] = client.getCurrentTimestamp();
      }

      // Scale the value to pixels and draw the enabled intervals
      enabledIntervals = enabledIntervals.map((interval) => {
        return [
          scaleValue(interval[0] / 1000000, timeRange, [0, width]),
          scaleValue(interval[1] / 1000000, timeRange, [0, width]),
        ];
      });

      context.globalAlpha = 0.2;
      context.fillStyle = light ? "#0f0" : "#0f0";
      for (let interval of enabledIntervals) {
        context.fillRect(interval[0], 0, interval[1] - interval[0], height);
      }

      if (!client.isLive()) {
        let selectedX = scaleValue(
          client.getSelectedTimestamp() / 1000000,
          timeRange,
          [0, width]
        );
        context.strokeStyle = light ? "#000" : "#fff";
        context.globalAlpha = 1;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(selectedX, 0);
        context.lineTo(selectedX, height);
        context.stroke();

        liveButtonRef.current?.classList.remove("live-button-active");
      } else {
        liveButtonRef.current?.classList.add("live-button-active");
      }

      if (hoverXRef.current !== null) {
        context.strokeStyle = light ? "#00f" : "#88f";
        context.lineWidth = 0.5;
        context.beginPath();
        context.moveTo(hoverXRef.current, 0);
        context.lineTo(hoverXRef.current, height);
        context.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [theme, client, connected, log]);

  const handleMouseMove = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    hoverXRef.current = x;

    if (isDraggingRef.current) {
      onMouseUp(clientX);
    }
  };

  const handleMouseLeave = () => {
    hoverXRef.current = null;
  };

  const onMouseDown = () => {
    isDraggingRef.current = true;
  };

  const onMouseUp = useCallback(
    (clientX: number) => {
      if (!client) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const timeRange: [number, number] = [
        client.getConnectedTimestamp() / 1000000,
        client.getCurrentTimestamp() / 1000000,
      ];
      const selectedTime = scaleValue(x, [0, rect.width], timeRange);
      client.setSelectedTimestamp(selectedTime * 1000000);
    },
    [client]
  );

  return (
    <div className="timeline-container">
      <div ref={containerRef} className="timeline">
        <canvas
          ref={canvasRef}
          className="timeline-canvas"
          onTouchMove={(e) => handleMouseMove(e.touches[0].clientX)}
          onMouseUp={(e) => {
            isDraggingRef.current = false;
            onMouseUp(e.clientX);
          }}
          onTouchEnd={(e) => {
            isDraggingRef.current = false;
            onMouseUp(e.touches[0].clientX);
          }}
          onTouchStart={onMouseDown}
          onMouseDown={onMouseDown}
          onMouseMove={(e) => handleMouseMove(e.clientX)}
          onMouseLeave={handleMouseLeave}
        />
      </div>
      <div className="live-button live-button-container" ref={liveButtonRef}>
        {!playing && (
          <BiPlayCircle
            className="live-button"
            onClick={() => {
              if (client && client.isLive()) return;
              if ((!client || !connected) && !log) return;
              setPlaying(true);
            }}
          />
        )}
        {playing && (
          <BiPauseCircle
            className="live-button"
            onClick={() => {
              setPlaying(false);
            }}
          />
        )}
      </div>
      {(connected || client?.getClient() != null) && (
        <div className="live-button live-button-container" ref={liveButtonRef}>
          <BiFastForwardCircle
            className="live-button"
            onClick={() => {
              if (!client || !connected) return;
              if (!client.isLive()) {
                if (playing) setPlaying(false);
                client.enableLiveMode();
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Timeline;

function calcAxisStepSize(
  dataRange: [number, number],
  pixelRange: number,
  stepSizeTarget: number
): number {
  let stepCount = pixelRange / stepSizeTarget;
  let stepValueApprox = (dataRange[1] - dataRange[0]) / stepCount;
  let roundBase = 10 ** Math.floor(Math.log10(stepValueApprox));
  let multiplierLookup = [0, 1, 2, 2, 5, 5, 5, 5, 5, 10, 10]; // Use friendly numbers if possible
  return roundBase * multiplierLookup[Math.round(stepValueApprox / roundBase)];
}

function cleanFloat(float: number) {
  let output = Math.round(float * 1e6) / 1e6;
  if (Object.is(output, -0)) output = 0;
  return output;
}

function scaleValue(
  value: number,
  oldRange: [number, number],
  newRange: [number, number]
): number {
  return (
    ((value - oldRange[0]) / (oldRange[1] - oldRange[0])) *
      (newRange[1] - newRange[0]) +
    newRange[0]
  );
}

function clampValue(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
