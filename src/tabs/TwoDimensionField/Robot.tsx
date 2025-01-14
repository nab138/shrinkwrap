import { Arrow, Group, Rect, Text } from "react-konva";
import { useComputedNTValue, useNTValue } from "../../ntcore-react/useNTValue";
import { useEffect, useState } from "react";

export interface RobotProps {
  ntKey: string;
  calcCoordinates: (
    translation: [number, number],
    alwaysFlipped: boolean
  ) => [number, number];
  scale: number;
  bumperSize: number;
}

const bumperThicknessMult = 0.175;

const Robot: React.FC<RobotProps> = ({
  ntKey,
  calcCoordinates,
  scale,
  bumperSize,
}) => {
  const rawPosition = useNTValue<[number, number, number]>(
    ntKey,
    [-99, -99, -99],
    0.001
  );
  const [position, setPosition] = useState<[number, number]>([-99, -99]);
  useEffect(() => {
    setPosition(calcCoordinates([rawPosition[0], rawPosition[1]], false));
  }, [rawPosition, calcCoordinates]);

  const bumperColor = useComputedNTValue<boolean, string>(
    "/FMSInfo/IsRedAlliance",
    (isRed) => {
      return isRed ? "red" : "blue";
    },
    true,
    0.1
  );
  if (scale <= 0 || bumperSize <= 0) {
    return <Text text="Invalid scale or bumper size" />;
  }

  const bumperThickness = bumperSize * bumperThicknessMult;

  return (
    <Group
      x={position[0]}
      y={position[1]}
      offsetX={(scale * bumperSize) / 2}
      offsetY={(scale * bumperSize) / 2}
      rotation={-rawPosition[2]}
    >
      <Rect
        width={scale * bumperSize}
        height={scale * bumperSize}
        cornerRadius={scale * 0.05}
        fill={bumperColor}
      />
      <Rect
        offsetX={-(scale * bumperThickness) / 2}
        offsetY={-(scale * bumperThickness) / 2}
        width={scale * bumperSize - scale * bumperThickness}
        height={scale * bumperSize - scale * bumperThickness}
        cornerRadius={scale * 0.01}
        fill={"#303030"}
      />
      {/* Draw an arrow */}
      <Arrow
        points={[
          scale * bumperSize * 0.2,
          scale * bumperSize * 0.5,
          scale * bumperSize * 0.8 - 0.1 * scale * bumperSize,
          scale * bumperSize * 0.5,
        ]}
        fill={bumperColor}
        stroke={bumperColor}
        strokeWidth={0.1 * scale * bumperSize}
        pointerWidth={0.15 * scale * bumperSize}
        pointerLength={0.1 * scale * bumperSize}
        closed
      />
    </Group>
  );
};

export default Robot;
