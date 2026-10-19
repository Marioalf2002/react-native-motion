import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, AppState, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import type { FontAxes } from './use-font-axes';
import { VariableText } from './variable-text';

const WORDS = ['EXPO', 'VARIABLE FONTS'] as const;
const CAP_RATIO = 0.76;
const SPEED = 42;
type FontPoint = Pick<FontAxes, 'x' | 'y'>;

function useMarqueeWord(index: number, viewportWidth: number, scale: SharedValue<number>) {
  const text = `${WORDS[index].replaceAll(' ', '\u00a0')}\u00a0`;
  const width = useSharedValue(0);
  const frameWidth = useDerivedValue(() => viewportWidth / scale.get() + width.get() + 2);
  const phase = useSharedValue(0);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const measuredWidth = event.nativeEvent.layout.width;
    if (Number.isFinite(measuredWidth) && measuredWidth > 0) width.set(measuredWidth);
  }, [width]);
  return useMemo(() => ({ text, width, frameWidth, phase, onLayout }), [text, width, frameWidth, phase, onLayout]);
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
  const expo = useMarqueeWord(0, width, scale);
  const variableFonts = useMarqueeWord(1, width, scale);
  const words = useMemo(() => [expo, variableFonts], [expo, variableFonts]);
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
      for (const word of words) {
        const period = word.width.get() * scale.get();
        if (period > 0) word.phase.set((word.phase.get() + travel / period) % 1);
      }
    }
  });

  return (
    <View pointerEvents="none" accessible accessibilityRole="image" accessibilityLabel="Moving Expo and Variable Fonts typography on alternating rows. Adjacent rows travel in opposite directions." style={StyleSheet.absoluteFill}>
      <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.measurement, { width: renderSize * Math.max(...WORDS.map((word) => word.length)) * 2 }]}>
        {words.map((word, index) => (
          <VariableText key={index} text={word.text} size={renderSize} x={x} y={y} onLayout={word.onLayout} />
        ))}
      </View>
      {words.map((word, index) => (
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
