import { getFontAxisValues } from './font-variations';

export const WORDS = ["EXPO","VARIABLE FONTS"] as const;

// Roboto Flex advances in em at opsz 144, including the space and letter spacing.
const ADVANCES = [
  [
    [0.766438, 1.823340, 2.942575],
    [1.011546, 1.918066, 3.011451],
    [1.615700, 2.311133, 3.389438],
    [2.255010, 2.739355, 3.802581],
  ],
  [
    [2.290038, 5.475391, 8.693790],
    [2.945442, 5.602832, 8.900219],
    [4.702895, 6.808398, 10.041638],
    [6.487692, 8.041309, 11.210400],
  ],
];

export function getWordAdvance(index: number, x: number, y: number) {
  'worklet';
  const { width, weight } = getFontAxisValues(x, y);
  const column = width < 100 ? 0 : 1;
  const row = Math.min(2, Math.floor((weight - 100) / 300));
  const tx = (width - (50 + column * 50)) / 50;
  const ty = (weight - (100 + row * 300)) / 300;
  const values = ADVANCES[index];
  const low = values[row][column] * (1 - tx) + values[row][column + 1] * tx;
  const high = values[row + 1][column] * (1 - tx) + values[row + 1][column + 1] * tx;
  return low * (1 - ty) + high * ty;
}
