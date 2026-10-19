# Variable Font

A Roboto Flex poster demonstrating variable fonts in Expo SDK 58 and React Native 0.88. It loads one variable TTF with `expo-font` and animates the font's native `wdth` and `wght` axes through `Text.fontVariationSettings`.

Drag the graph horizontally to change width. Drag up for larger, heavier lettering, or down for smaller, lighter lettering. The example comes from [expo-variable-font](https://github.com/SchroederNathan/expo-variable-font).

## Copy the example

Use Expo SDK 58 with React Native 0.88. Copy this entire folder, including `assets`, into your app. Keep it outside your Expo Router route directory so Metro can select the `.ios.tsx` and `.web.tsx` implementations. Every import inside the example is relative to this folder.

Install compatible dependencies:

```sh
npx expo install @expo/ui @react-native-masked-view/masked-view expo-font react-native-gesture-handler react-native-reanimated react-native-worklets react-native-safe-area-context
```

Render it inside your gesture and safe-area providers:

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

If your app has these providers, render the component inside them. Expo's Babel preset configures the Worklets plugin. The example loads its bundled font with:

```tsx
const [loaded, error] = useFonts({
  RobotoFlex: require('./assets/RobotoFlex.ttf'),
});
```

The poster waits for the font to load and reports a font-loading error with the asset path if loading fails. You do not need Expo Router or a path alias.

`VariableFontScreen` and `VariableFontExample` export the same component. Both accept an optional `isActive` boolean, which defaults to `true`. Set it to `false` when your navigation container keeps this screen mounted behind another route. The gallery handles that in `../registry.tsx`, outside the copyable folder. The screen measures its available layout, so it also fits beneath a navigation header or inside a smaller container.

## Change the poster

| File | Purpose |
| --- | --- |
| `index.tsx` | Public screen exports |
| `variable-font-screen.tsx` | Font loading, available layout, frame inset, graph placement |
| `poster-frame.ios.tsx` | Expo UI concentric corners on iOS 26 and later |
| `poster-frame.tsx` | Rectangular frame on Android and web |
| `poster-frame.types.ts` | Shared frame props |
| `marquee.tsx` | Scroll speed, type size, row spacing, lifecycle pause |
| `word-metrics.ts` | Poster words and their font advances |
| `generate-metrics.swift` | Regenerate advances after changing words |
| `palette.ts` | Blue, paper, lavender, grid, and border colors |
| `font-variations.ts` | Native font-variation string and axis ranges |
| `xy-pad.tsx` | Gesture Handler 3 drag, handle, keyboard controls |
| `use-font-axes.ts` | Starting point, springs, accessible value |
| `variable-text.tsx` | Native Text font-axis animation |
| `variable-text.web.tsx` | Browser font-axis animation |
| `variable-text.types.ts` | Shared text props |

Horizontal movement maps to `wdth = 50 + 100x`. Vertical movement maps to `wght = 1000 - 900y⁴` and the responsive font size. The curve keeps much of the graph bold. Optical size stays at 144.

On native, `getFontVariationSettings()` produces a string such as `"opsz" 144, "wdth" 100, "wght" 918`. Reanimated sends that string to the native Text attribute through `useAnimatedProps`. The Text wrapper also applies the initial axes through its style. Reanimated 4.7.1 filters this attribute out of native animated styles, so keep this prop wrapper. Web uses `fontVariationSettings` in its animated style.

Text renders at the smallest supported type size, with a uniform transform controlling the displayed size. The font's actual width and weight axes update while dragging. Each Text frame covers the viewport plus one word to limit offscreen native drawing. The decorative lettering disables system font scaling so its measured advances and line boxes stay aligned. The poster has one accessible image description; the graph exposes its own accessible controls.

Rows moving in the same direction share an animated parent, so only two native transforms update during steady scrolling. Each row starts at a seeded character in its repeating phrase, keeping the stagger stable throughout a drag. `word-metrics.ts` interpolates advances using the same axes, which keeps the loop boundaries aligned without measuring views or changing React state per frame. Offscreen rows stop updating their font axes.

The gesture, font settings, layout, and marquee run through UI worklets. React updates the graph's accessible value after release. Scrolling pauses while the app is inactive, `isActive` is false, or Reduce Motion is enabled. The screen reads the live Reduce Motion setting when it mounts and listens for later changes, including a setting changed before entering this demo. The graph remains usable while scrolling is paused.

On iOS 26 and later, Expo UI's `ConcentricRectangle` supplies a static mask with corners derived from the device and frame inset. Animated content stays in the React Native view hierarchy. Older iOS versions, Android, and web use a rectangular frame.

On web, focus the graph and use the arrow keys. Hold Shift for a larger step. Home restores the center. Native accessibility actions move the point up, down, left, and right.

## Change the words

Run this from the example folder on macOS:

```sh
swift generate-metrics.swift EXPO "VARIABLE FONTS"
```

The generator updates `WORDS` and `ADVANCES` in `word-metrics.ts` using the bundled font. Commit that file with your changes. Running the poster does not require Swift. If you change the font, optical size, axis ranges, or letter spacing, update the generator and regenerate the advances too.

## Profile the native animation

Use an SDK 58 development build for native verification. Changes to native packages or build flags need a rebuild; Fast Refresh only updates JavaScript.

The upstream poster uses Reanimated's `IOS_SYNCHRONOUSLY_UPDATE_UI_PROPS` and `ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS` static flags to update the moving parents' transforms directly. Font axes and Text widths still use the normal layout path while dragging. These flags affect the whole app, so profile your other screens when enabling them. See the [Reanimated feature flag documentation](https://docs.swmansion.com/react-native-reanimated/docs/guides/feature-flags/).

This example does not require the gallery to cap its refresh rate at 60 Hz. Check scrolling, interrupted drags, extreme axis values, and reduced motion on the devices you support before making a frame-rate claim.

If the font cannot load, check that `assets/RobotoFlex.ttf` was copied beside the source. If dragging does nothing, check `GestureHandlerRootView` and your SDK 58 dependencies. If the text does not change its axes, verify React Native 0.88 and keep the native animated-props wrapper in `variable-text.tsx`.

## Font license

[Roboto Flex](https://github.com/google/fonts/tree/main/ofl/robotoflex) is bundled as the complete variable TTF. Keep `assets/RobotoFlex-OFL.txt` with copies you distribute.
