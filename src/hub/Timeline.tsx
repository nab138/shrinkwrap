import { useCallback, useContext, useEffect, useRef } from "react";
import "./Timeline.css";
import { useStore } from "../utils/StoreContext";
import NTContext from "../ntcore-react/NTContext";
import useNTConnected from "../ntcore-react/useNTConnected";

const Timeline: React.FC = () => {
  const client = useContext(NTContext);
  const connected = useNTConnected();

  const [theme] = useStore<string>("theme", "light");

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

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

      if (!canvas || !context || !container || !client || !connected) return;

      const devicePixelRatio = window.devicePixelRatio;
      const width = container.clientWidth;
      const height = container.clientHeight;
      const light = theme === "light";

      // Set canvas dimensions and reset transform
      canvas.width = width;
      canvas.height = height;
      context.setTransform(1, 0, 0, 1, 0, 0); // Reset transformation
      context.scale(devicePixelRatio, devicePixelRatio);

      // Clear the canvas
      context.clearRect(0, 0, width, height);

      // Draw axis
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

        // Draw ticks and labels
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

    // Start rendering
    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [theme, client, connected]);

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
      <button
        onClick={() => {
          client?.enableLiveMode();
        }}
      >
        L
      </button>
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
