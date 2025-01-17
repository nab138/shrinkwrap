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
  bumperWidth: number;
  bumperLength: number;
}

const bumperThicknessMult = 0.175;

const Robot: React.FC<RobotProps> = ({
  ntKey,
  calcCoordinates,
  scale,
  bumperWidth,
  bumperLength,
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
  if (scale <= 0 || bumperWidth <= 0 || bumperLength <= 0) {
    return <Text text="Invalid scale or bumper size" />;
  }

  const bumperThickness =
    Math.min(bumperWidth, bumperLength) * bumperThicknessMult;

  return (
    <Group
      x={position[0]}
      y={position[1]}
      offsetX={(scale * bumperWidth) / 2}
      offsetY={(scale * bumperLength) / 2}
      rotation={-rawPosition[2]}
    >
      <Rect
        width={scale * bumperWidth}
        height={scale * bumperLength}
        cornerRadius={scale * 0.05}
        fill={bumperColor}
      />
      <Rect
        offsetX={-(scale * bumperThickness) / 2}
        offsetY={-(scale * bumperThickness) / 2}
        width={scale * bumperWidth - scale * bumperThickness}
        height={scale * bumperLength - scale * bumperThickness}
        cornerRadius={scale * 0.01}
        fill={"#303030"}
      />
      {/* Draw an arrow */}
      <Arrow
        points={[
          scale * bumperWidth * 0.2,
          scale * bumperLength * 0.5,
          scale * bumperWidth * 0.8 - 0.1 * scale * bumperWidth,
          scale * bumperLength * 0.5,
        ]}
        fill={bumperColor}
        stroke={bumperColor}
        strokeWidth={0.1 * scale * Math.min(bumperWidth, bumperLength)}
        pointerWidth={0.15 * scale * Math.min(bumperLength, bumperWidth)}
        pointerLength={0.1 * scale * Math.min(bumperWidth, bumperLength)}
        closed
      />
    </Group>
  );
};

export default Robot;
