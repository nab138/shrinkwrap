import React, { useEffect, useState } from "react";
import { Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { Field, fields } from "../ThreeDimensionField/Fields";
import { convert } from "../../utils/units";

export interface FieldImageProps {
  field: string;
  width: number;
  height: number;
  setCalcCoordinates: React.Dispatch<
    React.SetStateAction<
      | ((
          translation: [number, number],
          alwaysFlipped: boolean
        ) => [number, number])
      | undefined
    >
  >;
  setFieldScale: React.Dispatch<React.SetStateAction<number>>;
}

const FieldImage: React.FC<FieldImageProps> = ({
  field: fieldName,
  width,
  height,
  setCalcCoordinates,
  setFieldScale,
}) => {
  const [image] = useImage("/2dfields/Field2d_" + fieldName + ".png");
  const [renderValues, setRenderValues] = useState<number[]>([]);

  const [field, setField] = useState<Field | undefined>(
    fields.find((f) => f.year == fieldName)
  );
  useEffect(() => {
    setField(fields.find((f) => f.year == fieldName));
  }, [fieldName]);

  useEffect(() => {
    if (image && field) {
      let fieldWidth =
        field.imageData.bottomRight[0] - field.imageData.topLeft[0];
      let fieldHeight =
        field.imageData.bottomRight[1] - field.imageData.topLeft[1];

      let topMargin = field.imageData.topLeft[1];
      let bottomMargin = image.height - field.imageData.bottomRight[1];
      let leftMargin = field.imageData.topLeft[0];
      let rightMargin = image.width - field.imageData.bottomRight[0];

      let margin = Math.min(topMargin, bottomMargin, leftMargin, rightMargin);
      let extendedFieldWidth = fieldWidth + margin * 2;
      let extendedFieldHeight = fieldHeight + margin * 2;
      let constrainHeight =
        width / height > extendedFieldWidth / extendedFieldHeight;
      let imageScalar: number;
      if (constrainHeight) {
        imageScalar = height / extendedFieldHeight;
      } else {
        imageScalar = width / extendedFieldWidth;
      }

      setFieldScale(
        imageScalar *
          (field.imageData.widthInches / convert(1, "meters", "inches")) *
          10
      );
      let fieldCenterX = fieldWidth * 0.5 + field.imageData.topLeft[0];
      let fieldCenterY = fieldHeight * 0.5 + field.imageData.topLeft[1];
      let renderValues = [
        Math.floor(width * 0.5 - fieldCenterX * imageScalar), // X (normal)
        Math.floor(height * 0.5 - fieldCenterY * imageScalar), // Y (normal)
        Math.ceil(width * -0.5 - fieldCenterX * imageScalar), // X (flipped)
        Math.ceil(height * -0.5 - fieldCenterY * imageScalar), // Y (flipped)
        image.width * imageScalar, // Width
        image.height * imageScalar, // Height
      ];
      setRenderValues(renderValues);

      let canvasFieldLeft =
        renderValues[0] + field.imageData.topLeft[0] * imageScalar;
      let canvasFieldTop =
        renderValues[1] + field.imageData.topLeft[1] * imageScalar;
      let canvasFieldWidth = fieldWidth * imageScalar;
      let canvasFieldHeight = fieldHeight * imageScalar;

      setCalcCoordinates(
        () =>
          (
            translation: [number, number],
            alwaysFlipped = false
          ): [number, number] => {
            if (translation === undefined) return [0, 0];
            let positionInches = [
              convert(translation[0], "meters", "inches"),
              convert(translation[1], "meters", "inches"),
            ];

            positionInches[1] *= -1; // Positive y is flipped on the canvas
            positionInches[1] += field.imageData.heightInches;
            let positionPixels: [number, number] = [
              positionInches[0] *
                (canvasFieldWidth / field.imageData.widthInches),
              positionInches[1] *
                (canvasFieldHeight / field.imageData.heightInches),
            ];
            if (alwaysFlipped) {
              positionPixels[0] =
                canvasFieldLeft + canvasFieldWidth - positionPixels[0];
              positionPixels[1] =
                canvasFieldTop + canvasFieldHeight - positionPixels[1];
            } else {
              positionPixels[0] += canvasFieldLeft;
              positionPixels[1] += canvasFieldTop;
            }
            return positionPixels;
          }
      );
    }
  }, [image, field, width, height]);

  return (
    <>
      {image && renderValues.length > 0 && width > 0 && height > 0 && (
        <KonvaImage
          image={image}
          x={renderValues[0]}
          y={renderValues[1]}
          width={renderValues[4]}
          height={renderValues[5]}
        />
      )}
    </>
  );
};

export default FieldImage;
