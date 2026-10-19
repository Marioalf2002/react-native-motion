export function getFontAxisValues(x: number, y: number) {
  'worklet';
  return { width: 50 + x * 100, weight: 1000 - Math.pow(y, 4) * 900 };
}

export function getFontVariationSettings(x: number, y: number) {
  'worklet';
  const { width, weight } = getFontAxisValues(x, y);
  return `"opsz" 144, "wdth" ${width}, "wght" ${weight}`;
}

export function describeFontAxes(x: number, y: number) {
  const { width, weight } = getFontAxisValues(x, y);
  return `Width ${Math.round(width)}, weight ${Math.round(weight)}`;
}
