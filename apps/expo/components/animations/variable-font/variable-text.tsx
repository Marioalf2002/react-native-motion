import { forwardRef, type ComponentRef } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';
import Animated, { useAnimatedProps, useAnimatedStyle } from 'react-native-reanimated';

import { getFontVariationSettings } from './font-variations';
import { PALETTE } from './palette';
import type { VariableTextProps } from './variable-text.types';

type NativeAxisProps = TextProps & { fontVariationSettings?: string };

// RN needs a style for the first render; subsequent frames update the native attribute.
const AxisText = forwardRef<ComponentRef<typeof Text>, NativeAxisProps>(function AxisText(
  { fontVariationSettings, style, ...props }, ref,
) {
  return <Text ref={ref} {...props} style={[style, fontVariationSettings ? { fontVariationSettings } : undefined]} />;
});
const AnimatedAxisText = Animated.createAnimatedComponent(AxisText);

export function VariableText({ text, size, frameWidth, x, y, visible }: VariableTextProps) {
  // Reanimated 4.7.1 filters this native style, so animate the prop directly.
  const animatedProps = useAnimatedProps<NativeAxisProps>(() => visible.get() ? ({
    fontVariationSettings: getFontVariationSettings(x.get(), y.get()),
  }) : {});
  const frame = useAnimatedStyle(() => visible.get() ? ({ width: frameWidth.get() }) : {});
  const style = { height: size * 1.18, fontSize: size, lineHeight: size * 1.18, letterSpacing: -size * 0.045, transform: [{ translateY: -size * 0.217 }] };

  return (
    <AnimatedAxisText accessible={false} allowFontScaling={false} numberOfLines={1} ellipsizeMode="clip" animatedProps={animatedProps} style={[styles.text, style, frame]}>
      {text}
    </AnimatedAxisText>
  );
}

const styles = StyleSheet.create({
  text: { color: PALETTE.paper, fontFamily: 'RobotoFlex', includeFontPadding: false, flexShrink: 0 },
});
