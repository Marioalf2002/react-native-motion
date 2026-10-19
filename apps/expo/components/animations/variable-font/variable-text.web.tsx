import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { getFontVariationSettings } from './font-variations';
import { PALETTE } from './palette';
import type { VariableTextProps } from './variable-text.types';

export function VariableText({ text, size, frameWidth, x, y, visible, onLayout }: VariableTextProps) {
  const style = useAnimatedStyle(() => !visible || visible.get() ? ({
    ...(frameWidth ? { width: frameWidth.get() } : {}),
    fontVariationSettings: getFontVariationSettings(x.get(), y.get()),
  }) : {});
  return (
    <Animated.Text accessible={false} allowFontScaling={false} numberOfLines={1} ellipsizeMode="clip" onLayout={onLayout} style={[styles.text, { height: size * 0.76, fontSize: size, lineHeight: size * 0.76, letterSpacing: -size * 0.045 }, style]}>{text}</Animated.Text>
  );
}

const styles = StyleSheet.create({
  text: { color: PALETTE.paper, fontFamily: 'RobotoFlex', flexShrink: 0, alignSelf: 'flex-start' },
});
