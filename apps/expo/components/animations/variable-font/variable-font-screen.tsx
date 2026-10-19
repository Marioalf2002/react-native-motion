import { useFonts } from 'expo-font';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Marquee } from './marquee';
import { PALETTE } from './palette';
import { PosterFrame } from './poster-frame';
import { useFontAxes } from './use-font-axes';
import { XYPad } from './xy-pad';

export function VariableFontScreen({ isActive = true }: { isActive?: boolean }) {
  const [loaded, error] = useFonts({ RobotoFlex: require('./assets/RobotoFlex.ttf') });
  if (error) throw new Error('Variable Font could not load assets/RobotoFlex.ttf.', { cause: error });
  if (!loaded) return null;
  return <TypePoster isActive={isActive} />;
}

function TypePoster({ isActive }: { isActive: boolean }) {
  const axes = useFontAxes();
  const insets = useSafeAreaInsets();
  const [{ width, height }, setSize] = useState({ width: 0, height: 0 });
  const frame = Math.min(24, width * 0.025);
  const posterWidth = width - frame * 2;
  const posterHeight = height - frame * 2;

  return (
    <View
      style={styles.screen}
      onLayout={({ nativeEvent }) => setSize({ width: nativeEvent.layout.width, height: nativeEvent.layout.height })}
    >
      <PosterFrame inset={frame}>
        <View testID="type-poster" style={styles.poster}>
          {posterWidth > 0 && posterHeight > 0 ? (
            <Marquee width={posterWidth} height={posterHeight} x={axes.x} y={axes.y} isActive={isActive} />
          ) : null}
          <View style={[styles.control, { bottom: Math.max(16, insets.bottom - frame + 12) }]}>
            <XYPad axes={axes} height={140} />
          </View>
        </View>
      </PosterFrame>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PALETTE.paper },
  poster: { flex: 1, backgroundColor: PALETTE.blue, overflow: 'hidden' },
  control: { position: 'absolute', right: 16, width: 164 },
});
