# Variable Font

Use Expo SDK 58 and React Native 0.88. Load the bundled Roboto Flex TTF with expo-font and change its actual native Text axes with fontVariationSettings. The core feature is:

```tsx
import { useFonts } from 'expo-font';
import { Text } from 'react-native';

export default function FontExample() {
  const [loaded, error] = useFonts({
    RobotoFlex: require('./assets/RobotoFlex.ttf'),
  });
  if (error) throw error;
  if (!loaded) return null;

  return (
    <Text style={{ fontFamily: 'RobotoFlex', fontSize: 72 }}>
      <Text style={{ fontVariationSettings: '"opsz" 144, "wdth" 100, "wght" 700' }}>
        EXPO
      </Text>
    </Text>
  );
}
```

## Copy the poster

Copy the complete [variable-font folder](https://github.com/SchroederNathan/react-native-motion/tree/main/apps/expo/components/animations/variable-font), including assets. Keep it outside Expo Router's route directory. Imports inside the folder are relative.

```bash
npx expo install expo-font react-native-reanimated react-native-worklets react-native-gesture-handler react-native-safe-area-context
```

For web, also run `npx expo install react-dom react-native-web`.

Use SDK 58-compatible versions, including Reanimated 4.7.1, Worklets 0.13, and Gesture Handler 3. Build a development app after adding native packages.

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

VariableFontExample aliases VariableFontScreen. Its optional isActive prop defaults to true. Pass navigation focus when inactive screens stay mounted.

## Keep the implementation focused

- variable-font-screen.tsx loads the TTF with useFonts and lays out a rounded React Native View.
- marquee.tsx defines WORDS and the two scrolling tracks. Paired hidden Text probes measure one and two repetitions through onLayout; their width difference sets the loop distance, including letter spacing between repeats. Shared values handle updates without React state updates per drag frame.
- variable-text.tsx animates native Text.fontVariationSettings through useAnimatedProps. Reanimated 4.7.1 filters this field out of native animated styles, so preserve the ref-forwarding Text wrapper and its initial fontVariationSettings style. Keep font and layout on the outer Text, with axes on the inner Text; this lets Android measure changing variable-font advances.
- variable-text.web.tsx uses useAnimatedStyle for browser font axes. Keep the platform renderer and shared variable-text.types.ts props together.
- font-variations.ts maps x/y to the axes. use-font-axes.ts owns shared values and accessible state; xy-pad.tsx owns the gesture, keyboard controls, and native accessibility actions.

x and y stay in [0,1]. Width is 50 + 100x, weight is 1000 - 900y⁴, and optical size stays at 144. Vertical movement also changes uniformly displayed size. Real font axes control letter shapes independently of that scale.

To change the lines, edit the two WORDS strings in marquee.tsx. Normal runtime Text measurements handle their widths. Keep the two direction groups and sufficient repeated text to cover the viewport at narrow settings.

Pause scrolling while isActive is false, the app is inactive, or Reduce Motion is enabled. Keep accessible pad controls usable while paused. The decorative poster uses allowFontScaling={false} to preserve measured layout and exposes one image description rather than each repeated word.

Keep assets/RobotoFlex-OFL.txt with redistributed fonts. The supplied 720 × 720, 60 fps video is the website and app catalog demo.
