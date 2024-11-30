import { useContext, useEffect, useRef } from "react";
import "./Timeline.css";
import { useStore } from "../utils/StoreContext";
import NTContext from "../ntcore-react/NTContext";
import useNTConnected from "../ntcore-react/useNTConnected";

const Timeline: React.FC = () => {
  const { client } = useContext(NTContext);
  const connected = useNTConnected();

  const [theme] = useStore<string>("theme", "light");

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    let lastRenderTime = 0;

    const render = (timestamp: number) => {
      if (timestamp - lastRenderTime < 16) {
        intervalRef.current = requestAnimationFrame(render);
        return;
      }
      lastRenderTime = timestamp;

      const canvas = canvasRef.current;

      if (!contextRef.current) {
        contextRef.current = canvas?.getContext("2d") ?? null;
      }
      const context = contextRef.current;
      const container = containerRef.current;
      if (
        !canvas ||
        !context ||
        !container ||
        !client ||
        !connected ||
        !canvas?.checkVisibility()
      ) {
        intervalRef.current = requestAnimationFrame(render);
        return;
      }

      const devicePixelRatio = window.devicePixelRatio;
      const width = container.clientWidth;
      const height = container.clientHeight;
      const light = theme === "light";
      const timeRange: [number, number] = [
        client.getConnectedTimestamp() / 1000000,
        client.getCurrentTimestamp() / 1000000,
      ];
      const stepSize = calcAxisStepSize(timeRange, width, 100);
      canvas.width = width * devicePixelRatio;
      canvas.height = height * devicePixelRatio;
      context.scale(devicePixelRatio, devicePixelRatio);
      context.clearRect(0, 0, width, height);

      context.lineWidth = 0.5;
      context.strokeStyle = light ? "#222" : "#eee";
      context.fillStyle = light ? "#222" : "#eee";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.globalAlpha = 0.5;
      let stepPos = Math.ceil(cleanFloat(timeRange[0] / stepSize)) * stepSize;
      while (true) {
        const x = scaleValue(stepPos, timeRange, [0, width]);
        if (x > width + 1) {
          break;
        }

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
        context.lineTo(x, 8);
        context.moveTo(x, height - 8);
        context.lineTo(x, height);
        context.stroke();
        context.globalAlpha = 0.5;

        stepPos += stepSize;
      }
      context.globalAlpha = 1;

      intervalRef.current = requestAnimationFrame(render);
    };

    intervalRef.current = requestAnimationFrame(render);

    return () => {
      if (intervalRef.current) cancelAnimationFrame(intervalRef.current);
    };
  }, [theme, client, connected]);

  return (
    <div ref={containerRef} className="timeline">
      <canvas ref={canvasRef} className="timeline-canvas"></canvas>
    </div>
  );
};

export default Timeline;

// https://github.com/Mechanical-Advantage/AdvantageScope/blob/26ed5936f6ea875752889e9405886646166ce6b4/src/shared/util.ts
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

/** Cleans up floating point errors. */
function cleanFloat(float: number) {
  let output = Math.round(float * 1e6) / 1e6;
  if (Object.is(output, -0)) output = 0;
  return output;
}

/** Converts a value between two ranges. */
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

/** Clamps a value to a range. */
function clampValue(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
