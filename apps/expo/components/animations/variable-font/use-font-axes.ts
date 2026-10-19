import { useCallback, useEffect, useState } from 'react';
import { cancelAnimation, useSharedValue, withSpring } from 'react-native-reanimated';

export function useFontAxes() {
  const [announcedPoint, setAnnouncedPoint] = useState({ x: 0.5, y: 0.55 });
  const x = useSharedValue(0.5);
  const y = useSharedValue(0.55);
  const active = useSharedValue(0);

  useEffect(() => () => {
    cancelAnimation(x);
    cancelAnimation(y);
    cancelAnimation(active);
  }, [x, y, active]);

  const reportPoint = useCallback((nextX: number, nextY: number) => {
    setAnnouncedPoint({ x: nextX, y: nextY });
  }, []);

  const moveTo = useCallback((nextX: number, nextY: number) => {
    const targetX = Math.max(0, Math.min(1, nextX));
    const targetY = Math.max(0, Math.min(1, nextY));
    const config = { duration: 400, dampingRatio: 1, overshootClamping: true };
    x.set(withSpring(targetX, config));
    y.set(withSpring(targetY, config));
    reportPoint(targetX, targetY);
  }, [x, y, reportPoint]);

  return { x, y, active, announcedPoint, moveTo, reportPoint };
}

export type FontAxes = ReturnType<typeof useFontAxes>;
