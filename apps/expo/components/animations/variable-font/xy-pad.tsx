import { StyleSheet, View, type ViewProps } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { describeFontAxes } from './font-variations';
import { PALETTE } from './palette';
import type { FontAxes } from './use-font-axes';

const HANDLE_INSET = 24;
const TICKS = Array.from({ length: 7 }, (_, index) => (index + 1) / 8);

export function XYPad({ axes, height }: {
  axes: FontAxes;
  height: number;
}) {
  const { x, y, active, reportPoint, moveTo, announcedPoint } = axes;
  const valueText = describeFontAxes(announcedPoint.x, announcedPoint.y);
  const bounds = useSharedValue({ width: 1, height: 1 });
  const update = (touchX: number, touchY: number) => {
    'worklet';
    x.set(Math.max(0, Math.min(1, (touchX - HANDLE_INSET) / bounds.get().width)));
    y.set(Math.max(0, Math.min(1, (touchY - HANDLE_INSET) / bounds.get().height)));
  };
  const pan = usePanGesture({
    minDistance: 0,
    maxPointers: 1,
    shouldCancelWhenOutside: false,
    onBegin: (event) => {
      'worklet';
      cancelAnimation(x);
      cancelAnimation(y);
      active.set(withSpring(1, { duration: 200, dampingRatio: 1 }));
      update(event.x, event.y);
    },
    onUpdate: (event) => {
      'worklet';
      update(event.x, event.y);
    },
    onActivate: (event) => {
      'worklet';
      update(event.x, event.y);
    },
    onFinalize: (event) => {
      'worklet';
      if (!event.canceled) update(event.x, event.y);
      active.set(withSpring(0, { duration: 400, dampingRatio: 1 }));
      scheduleOnRN(reportPoint, x.get(), y.get());
    },
  });
  const pointStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.get() * bounds.get().width },
      { translateY: y.get() * bounds.get().height },
      { scale: 1 + active.get() * 0.12 },
    ],
  }));
  const keyboardProps: Pick<ViewProps, 'onKeyDown'> = {
    onKeyDown: (event) => {
      const { key, shiftKey } = event.nativeEvent;
      const step = shiftKey ? 0.1 : 0.025;
      const directions: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
      };
      if (key === 'Home') {
        event.preventDefault();
        moveTo(0.5, 0.5);
      } else if (directions[key]) {
        event.preventDefault();
        const [dx, dy] = directions[key];
        moveTo(x.get() + dx, y.get() + dy);
      }
    },
  };

  return (
    <GestureDetector gesture={pan} touchAction="none" userSelect="none">
      <View
        {...keyboardProps}
        collapsable={false}
        testID="xy-pad"
        accessibilityRole="adjustable"
        accessibilityLabel="Font XY pad"
        accessibilityHint="Drag left and right for width. Drag up for larger, heavier text, or down for smaller, lighter text. Use arrow keys on a keyboard."
        accessibilityValue={{ text: valueText }}
        aria-valuetext={valueText}
        accessibilityActions={[
          { name: 'increment', label: 'Move up' }, { name: 'decrement', label: 'Move down' },
          { name: 'right', label: 'Move right' }, { name: 'left', label: 'Move left' },
        ]}
        onAccessibilityAction={({ nativeEvent }) => {
          if (nativeEvent.actionName === 'increment') moveTo(x.get(), y.get() - 0.05);
          if (nativeEvent.actionName === 'decrement') moveTo(x.get(), y.get() + 0.05);
          if (nativeEvent.actionName === 'right') moveTo(x.get() + 0.05, y.get());
          if (nativeEvent.actionName === 'left') moveTo(x.get() - 0.05, y.get());
        }}
        tabIndex={0}
        onLayout={({ nativeEvent }) => bounds.set({
          width: Math.max(1, nativeEvent.layout.width - HANDLE_INSET * 2),
          height: Math.max(1, nativeEvent.layout.height - HANDLE_INSET * 2),
        })}
        style={[styles.pad, { height }]}
      >
        <View pointerEvents="none" style={styles.grid}>
          {TICKS.map((tick) => <View key={`x${tick}`} style={[styles.gridVertical, { left: `${tick * 100}%` }]} />)}
          {TICKS.map((tick) => <View key={`y${tick}`} style={[styles.gridHorizontal, { top: `${tick * 100}%` }]} />)}
        </View>
        <View pointerEvents="box-none" style={styles.plot}>
          <Animated.View testID="xy-handle" style={[styles.handle, pointStyle]}>
            <View style={styles.handleCore}><View style={styles.handleDot} /></View>
          </Animated.View>
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  pad: { backgroundColor: PALETTE.blue, borderWidth: 1, borderColor: PALETTE.border, borderRadius: 22, overflow: 'hidden' },
  plot: { position: 'absolute', top: HANDLE_INSET, right: HANDLE_INSET, bottom: HANDLE_INSET, left: HANDLE_INSET },
  grid: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 21, overflow: 'hidden' },
  gridVertical: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: PALETTE.grid },
  gridHorizontal: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: PALETTE.grid },
  handle: { position: 'absolute', top: -23, left: -23, width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: PALETTE.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#cecbdf18' },
  handleCore: { width: 28, height: 28, borderRadius: 14, backgroundColor: PALETTE.lavender, alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px #cecbdf30' },
  handleDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: PALETTE.blue },
});
