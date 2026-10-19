# Variable Font implementation brief

Build the Expo SDK 58 variable-font poster with expo-font and native Text. Load the bundled Roboto Flex variable TTF, then animate its actual wdth and wght axes through Text.fontVariationSettings. Rows alternate between EXPO and VARIABLE FONTS and scroll in opposite directions. A lower-right XY pad controls width, weight, and displayed size.

Copy the complete [variable-font source folder](https://github.com/SchroederNathan/react-native-motion/tree/main/apps/expo/components/animations/variable-font), including the TTF, license, platform-specific files, word metrics, and Swift generator. The source comes from [Nathan Schroeder's Expo variable font example](https://github.com/SchroederNathan/expo-variable-font).

## Runtime and dependencies

Use Expo SDK 58 with React Native 0.88, Gesture Handler 3, Reanimated 4.7.1, and Worklets 0.13. Install SDK-compatible versions:

```bash
npx expo install expo-font @expo/ui @react-native-masked-view/masked-view react-native-gesture-handler react-native-reanimated react-native-worklets react-native-safe-area-context
```

Use a development build after installing or changing native dependencies. Expo's Babel preset configures the Worklets plugin. Keep the copied components outside Expo Router's route directory. Internal imports are relative, so the example does not need Expo Router or a path alias.

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { VariableFontExample } from './components/variable-font';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <VariableFontExample />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

VariableFontExample is an alias of VariableFontScreen. The screen accepts isActive, defaulting to true. Pass navigation focus to isActive if inactive screens remain mounted. Keep navigation imports in your integration wrapper.

## File structure

| File | Purpose |
| --- | --- |
| index.tsx | Exports VariableFontScreen and VariableFontExample |
| variable-font-screen.tsx | useFonts, poster layout, and XY pad placement |
| poster-frame.ios.tsx | Expo UI ConcentricRectangle mask on iOS 26 and later |
| poster-frame.tsx | Android and web frame fallback |
| poster-frame.types.ts | Shared frame props |
| marquee.tsx | Repeated strings, two moving parents, size, and lifecycle |
| variable-text.tsx | Animated native Text font axes |
| variable-text.web.tsx | Animated browser font axes |
| variable-text.types.ts | Shared renderer props |
| font-variations.ts | Width, weight, and optical-size settings |
| word-metrics.ts | WORDS and their measured font advances |
| generate-metrics.swift | Regenerate word advances |
| use-font-axes.ts | Shared x/y values and accessible state |
| xy-pad.tsx | Gesture Handler 3 usePanGesture, keyboard, and accessibility |
| palette.ts | Poster, frame, and control colors |
| assets/RobotoFlex.ttf | Full Roboto Flex variable font |
| assets/RobotoFlex-OFL.txt | Font license |

## Load the variable TTF

Inside VariableFontScreen, register the bundled TTF through useFonts from expo-font. Wait for loading before rendering the poster, and handle a loading error:

```tsx
import { useFonts } from 'expo-font';

export function VariableFontScreen({ isActive = true }: { isActive?: boolean }) {
  const [loaded, error] = useFonts({
    RobotoFlex: require('./assets/RobotoFlex.ttf'),
  });
  if (error) {
    throw new Error('Variable Font could not load assets/RobotoFlex.ttf.', {
      cause: error,
    });
  }
  if (!loaded) return null;
  return <TypePoster isActive={isActive} />;
}
```

TypePoster is the internal layout component in the same source file. All native rows use fontFamily: 'RobotoFlex'. This loads one variable font with its full axis ranges. fontVariationSettings selects axis values from that family; separate static weight files are unnecessary.

## Map the pad to actual font axes

Use Reanimated shared x and y values, clamped to [0, 1], starting at x=0.5 and y=0.55.

```ts
export function getFontVariationSettings(x: number, y: number) {
  'worklet';
  const width = 50 + x * 100;
  const weight = 1000 - Math.pow(y, 4) * 900;
  return `"opsz" 144, "wdth" ${width}, "wght" ${weight}`;
}
```

- Left to right maps wdth from 50 to 150.
- Bottom to top maps wght from 100 to 1000.
- The fourth-power y curve keeps most of the pad bold.
- Optical size stays fixed at opsz=144.
- Vertical movement also controls uniform displayed size and row spacing.

Native Text renders at the minimum supported font size. A uniform transform changes displayed size. Width and weight change through the actual font axes. Keep the axis updates independent of the parent scale.

Both renderers set allowFontScaling={false} to preserve the measured poster layout. The artwork is exposed as one accessible image.

## Animate native Text correctly

Preserve the native and web renderer files. Reanimated 4.7.1 filters fontVariationSettings out of native animated styles. The native renderer uses useAnimatedProps to update the native attribute. An AxisText wrapper forwards its ref and applies the initial axis settings through Text's style.

The actual native implementation is:

```tsx
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
```

Do not remove either the initial Text style or the animatedProps path. The style initializes the font axes and the animated attribute updates them on subsequent frames. The visible shared value skips updates for rows below the viewport. Native text has a taller line box and a vertical offset so complete capitals draw while rows follow tighter cap-height spacing.

The web file applies fontVariationSettings and frame width through useAnimatedStyle. Keep it beside the native implementation so Metro resolves the right platform renderer.

## Keep the marquee aligned

Rows retain fixed repeating strings during a drag. Native Text evaluates the actual variable font. word-metrics.ts supplies measured advances at width 50/100/150 and weight 100/400/700/1000, with optical size 144 and matching letter spacing. Interpolate these advances in a worklet using the same x/y values as the Text axes. Use the current advance for loop width and row positioning.

Rows moving in the same direction share one animated parent. Only two native transforms update during steady scrolling. Each row has a deterministic seeded starting character, keeping rows staggered without additional moving parents. Limit each Text frame to the viewport plus one word and stop updating font axes below the viewport.

Advance phase by elapsed time at 42 points per second. Cap one frame delta at 32 ms and wrap phase modulo one. Keep the loop, gesture, axis values, and layout on shared values. React only updates the accessible value after release.

Pause automatic scrolling when isActive is false, the app is inactive, or Reduce Motion is enabled. After subscribing to reduceMotionChanged, query AccessibilityInfo.isReduceMotionEnabled() on mount to read the live setting. Guard the asynchronous result after cleanup and remove the subscription on unmount. Keep the graph usable while the marquee is paused.

## Change the poster text

On macOS, run this from the copied example folder:

```bash
swift generate-metrics.swift EXPO "VARIABLE FONTS"
```

The generator updates WORDS and ADVANCES in word-metrics.ts. Swift is a development tool only; the table is bundled for runtime. Update the generator and regenerate advances if you change the font, optical size, axis ranges, or letter spacing. Mismatched advances produce gaps or jumps at loop boundaries.

## Frame and accessible interaction

On iOS 26 and later, Expo UI's static ConcentricRectangle provides a UIKit mask through MaskedView. SwiftUI derives the corners from the device and inset, while animated Text remains in the React Native hierarchy. Older iOS versions, Android, and web retain the fallback frame.

Gesture Handler 3 usePanGesture updates the clamped x/y values directly. Cancel pending axis springs when a drag begins. Use scheduleOnRN to report the released point for the accessible width/weight description.

Expose the pad as an adjustable control with actions for up, down, left, and right. On web, arrow keys move the focused pad, Shift increases the step, and Home restores the center. Give the moving poster one image description and hide repeated rows from the accessibility tree.

## Native build and profiling notes

The original profiling configuration enabled Reanimated's IOS_SYNCHRONOUSLY_UPDATE_UI_PROPS and ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS static flags. They allow the two moving parents to update transforms directly; font axes and Text widths still use the normal layout path while dragging. Changing static flags requires a rebuilt native app.

The original project's 60 Hz iPhone and Worklets frame-rate settings are optional profiling choices. The gallery keeps its normal refresh-rate behavior. The provided 720 × 720, 60 fps video is the website and app catalog demo asset.

## Checks and troubleshooting

1. Confirm expo-font loads assets/RobotoFlex.ttf before the poster mounts.
2. Check the four pad corners for wdth 50/150 and wght 100/1000.
3. Confirm native font axes change while Text strings remain mounted.
4. Verify the narrowest, lightest setting fills the rows and wraps continuously.
5. Confirm two opposing row directions and stable seeded starts during a drag.
6. Check native accessibility actions and web keyboard controls.
7. Enable Reduce Motion and background the app to verify automatic scrolling pauses.
8. Keep the animatedProps wrapper and initial Text style if axes appear stuck.
9. Keep assets/RobotoFlex-OFL.txt with distributions of the font.
