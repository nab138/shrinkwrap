export type Field = {
  year: string;
  fieldX: number;
  fieldY: number;
  fieldRot: number;
  source: string;
  imageData: {
    topLeft: [number, number];
    bottomRight: [number, number];
    widthInches: number;
    heightInches: number;
  };
};

export const fields: Field[] = [
  {
    year: "2026",
    fieldX: 16.540988,
    fieldY: 8.0689958,
    fieldRot: 180,
    source: "https://www.chiefdelphi.com/t/2026-rebuilt-high-resolution-field-image/510611",
    imageData: {
      topLeft: [524, 95],
      bottomRight: [3378, 1489],
      widthInches: 651.220,
      heightInches: 317.677
    }
  },
  {
    year: "2025",
    fieldX: 17.548249,
    fieldY: 8.0518,
    fieldRot: 180,
    source:
      "https://www.chiefdelphi.com/t/4k-field-image-2025-reefscape/478797",
    imageData: {
      topLeft: [421, 91],
      bottomRight: [3352, 1437],
      widthInches: 690.875,
      heightInches: 317,
    },
  },
  {
    year: "2024",
    fieldX: 16.55,
    fieldY: 8.21,
    fieldRot: 0,
    source:
      "https://www.chiefdelphi.com/t/2024-crescendo-top-down-field-renders/447764",
    imageData: {
      topLeft: [513, 78],
      bottomRight: [3327, 1475],
      widthInches: 651.25,
      heightInches: 323.25,
    },
  },
  {
    year: "2022",
    fieldX: 16.4592,
    fieldY: 8.2296,
    fieldRot: 0,
    source: "https://www.chiefdelphi.com/t/2022-top-down-field-renders/399031",
    imageData: {
      topLeft: [884, 149],
      bottomRight: [6160, 2786],
      widthInches: 648,
      heightInches: 324,
    },
  },
];
