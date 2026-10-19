import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  makeMutable,
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { getFontAxisValues } from './font-variations';
import type { FontAxes } from './use-font-axes';
import { VariableText } from './variable-text';

const WORD = 'EXPO';
const CAP_RATIO = 0.76;
const SPEED = 42;
// Axis stops for the loop width table. The worklet interpolates between them.
const WIDTH_STOPS = [50, 75, 100, 125, 150];
const WEIGHT_STOPS = [100, 250, 400, 550, 700, 850, 1000];
const PROBES = WEIGHT_STOPS.flatMap((weight) => WIDTH_STOPS.map((width) => ({
  x: makeMutable((width - 50) / 100),
  y: makeMutable(Math.pow((1000 - weight) / 900, 0.25)),
})));
type FontPoint = Pick<FontAxes, 'x' | 'y'>;

function locate(stops: number[], value: number) {
  'worklet';
  let index = 0;
  while (index < stops.length - 2 && value > stops[index + 1]) index++;
  const t = (value - stops[index]) / (stops[index + 1] - stops[index]);
  return { index, t: Math.max(0, Math.min(1, t)) };
}

function interpolateLoopWidth(table: number[], x: number, y: number) {
  'worklet';
  const { width, weight } = getFontAxisValues(x, y);
  const column = locate(WIDTH_STOPS, width);
  const row = locate(WEIGHT_STOPS, weight);
  const at = (c: number, r: number) => table[r * WIDTH_STOPS.length + c];
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const top = lerp(at(column.index, row.index), at(column.index + 1, row.index), column.t);
  const bottom = lerp(at(column.index, row.index + 1), at(column.index + 1, row.index + 1), column.t);
  return lerp(top, bottom, row.t);
}

// Probe one and two repetitions at fixed axis stops once. Subtracting them keeps the
// spacing between repeats. The worklet interpolates the table, so the loop width
// changes in the same frame as the glyphs instead of after an onLayout round trip.
function useMarqueeWord(viewportWidth: number, x: SharedValue<number>, y: SharedValue<number>, scale: SharedValue<number>) {
  const text = `${WORD}\u00a0`;
  const table = useSharedValue<number[]>([]);
  const probes = useRef({ single: [] as number[], double: [] as number[] });
  const width = useDerivedValue(() => {
    const periods = table.get();
    return periods.length === PROBES.length ? interpolateLoopWidth(periods, x.get(), y.get()) : 0;
  });
  const frameWidth = useDerivedValue(() => viewportWidth / scale.get() + width.get() + 2);
  const phase = useSharedValue(0);
  const onProbeLayout = useCallback((index: number, copies: 'single' | 'double', event: LayoutChangeEvent) => {
    const measuredWidth = event.nativeEvent.layout.width;
    if (!Number.isFinite(measuredWidth) || measuredWidth <= 0) return;
    const { single, double } = probes.current;
    (copies === 'single' ? single : double)[index] = measuredWidth;
    const periods = PROBES.map((_, probe) => double[probe] - single[probe]);
    if (periods.every((period) => period > 0)) table.set(periods);
  }, [table]);
  return useMemo(() => ({ text, width, frameWidth, phase, onProbeLayout }), [text, width, frameWidth, phase, onProbeLayout]);
}

function getPosterSizing(width: number, height: number) {
  const base = Math.min(width * 0.42, height * 0.39);
  return {
    min: Math.max(base * 0.6, height / (12 * CAP_RATIO)),
    max: Math.min(base * 1.5, height / (2.2 * CAP_RATIO)),
  };
}

function getRowText(period: string, repeats: number, index: number) {
  let seed = Math.floor(index / 2) + 1;
  seed = Math.imul(seed ^ (seed >>> 16), 0x21f0aaad);
  seed = Math.imul(seed ^ (seed >>> 15), 0x735a2d97);
  const start = ((seed ^ (seed >>> 15)) >>> 0) % period.length;
  return (period.slice(start) + period.slice(0, start)).repeat(repeats);
}

export const Marquee = memo(function Marquee({ width, height, x, y, isActive = true }: { width: number; height: number; isActive?: boolean } & FontPoint) {
  const axes = useMemo(() => ({ x, y }), [x, y]);
  const reducedAtLaunch = useReducedMotion();
  const [reducedMotion, setReducedMotion] = useState(reducedAtLaunch);
  const running = useSharedValue(isActive && !reducedAtLaunch && AppState.currentState === 'active');
  const sizing = getPosterSizing(width, height);
  const renderSize = sizing.min;
  const fontSize = useDerivedValue(() => sizing.max - y.get() * (sizing.max - sizing.min));
  const rowHeight = useDerivedValue(() => fontSize.get() * CAP_RATIO);
  const scale = useDerivedValue(() => fontSize.get() / renderSize);
  const word = useMarqueeWord(width, x, y, scale);
  const repeats = Math.ceil(width / renderSize) * 4 + 2;
  const rowCount = Math.ceil(height / (sizing.min * CAP_RATIO)) + 2;

  useEffect(() => {
    let mounted = true;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReducedMotion(enabled);
    });
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    running.set(isActive && !reducedMotion && AppState.currentState === 'active');
    const subscription = AppState.addEventListener('change', (state) => running.set(isActive && !reducedMotion && state === 'active'));
    return () => subscription.remove();
  }, [isActive, reducedMotion, running]);

  useFrameCallback(({ timeSincePreviousFrame }) => {
    if (running.get()) {
      const travel = Math.min(timeSincePreviousFrame ?? 0, 32) * SPEED / 1000;
      const period = word.width.get() * scale.get();
      if (period > 0) word.phase.set((word.phase.get() + travel / period) % 1);
    }
  });

  return (
    <View pointerEvents="none" accessible accessibilityRole="image" accessibilityLabel="Moving Expo typography on alternating rows. Adjacent rows travel in opposite directions." style={StyleSheet.absoluteFill}>
      <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.measurement, { width: renderSize * word.text.length * 4 }]}>
        {PROBES.flatMap((probe, index) => [
          <VariableText key={`${index}-single`} text={word.text} size={renderSize} x={probe.x} y={probe.y} onLayout={(event) => word.onProbeLayout(index, 'single', event)} />,
          <VariableText key={`${index}-double`} text={word.text.repeat(2)} size={renderSize} x={probe.x} y={probe.y} onLayout={(event) => word.onProbeLayout(index, 'double', event)} />,
        ])}
      </View>
      {[0, 1].map((index) => (
        <MarqueeGroup key={index} index={index} word={word} repeats={repeats} scale={scale} rowHeight={rowHeight} rowCount={rowCount} renderSize={renderSize} viewportHeight={height} axes={axes} />
      ))}
    </View>
  );
});

type Word = ReturnType<typeof useMarqueeWord>;

const MarqueeGroup = memo(function MarqueeGroup({ index, word, repeats, scale, rowHeight, rowCount, renderSize, viewportHeight, axes }: {
  index: number;
  word: Word;
  repeats: number;
  scale: SharedValue<number>;
  rowHeight: SharedValue<number>;
  rowCount: number;
  renderSize: number;
  viewportHeight: number;
  axes: FontPoint;
}) {
  const trackStyle = useAnimatedStyle(() => {
    const offset = (word.phase.get() + (index % 2 ? 0.22 : 0.12)) % 1;
    const shift = (index % 2 ? -offset : offset - 1) * word.width.get();
    return { opacity: word.width.get() > 0 ? 1 : 0, transform: [{ scale: scale.get() }, { translateX: shift }] };
  });
  const text = word.text.repeat(repeats);

  return (
    <Animated.View testID={`marquee-track-${index}`} aria-hidden importantForAccessibility="no-hide-descendants" style={[styles.track, { width: renderSize * text.length * 1.5, height: rowCount * renderSize * CAP_RATIO }, trackStyle]}>
      {Array.from({ length: Math.ceil((rowCount - index) / 2) }, (_, row) => row * 2 + index).map((row) => (
        <MarqueeRow key={row} index={row} text={getRowText(word.text, repeats, row)} frameWidth={word.frameWidth} rowHeight={rowHeight} renderSize={renderSize} viewportHeight={viewportHeight} axes={axes} />
      ))}
    </Animated.View>
  );
});

const MarqueeRow = memo(function MarqueeRow({ index, text, frameWidth, rowHeight, renderSize, viewportHeight, axes }: {
  index: number;
  text: string;
  frameWidth: SharedValue<number>;
  rowHeight: SharedValue<number>;
  renderSize: number;
  viewportHeight: number;
  axes: FontPoint;
}) {
  const visible = useDerivedValue(() => (index - 0.8) * rowHeight.get() < viewportHeight + rowHeight.get());
  return (
    <View testID={`marquee-row-${index}`} style={[styles.row, { top: (index - 0.8) * renderSize * CAP_RATIO, height: renderSize * 1.18 }]}>
      <VariableText text={text} frameWidth={frameWidth} size={renderSize} x={axes.x} y={axes.y} visible={visible} />
    </View>
  );
});

const styles = StyleSheet.create({
  measurement: { position: 'absolute', opacity: 0 },
  row: { position: 'absolute', top: 0, left: 0, right: 0 },
  track: { position: 'absolute', top: 0, left: 0, flexDirection: 'row', alignItems: 'flex-start', transformOrigin: 'top left' },
});
