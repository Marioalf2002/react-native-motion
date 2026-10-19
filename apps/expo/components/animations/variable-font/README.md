# Variable Font

An Expo SDK 58 and React Native 0.88 example of loading one Roboto Flex variable TTF with expo-font and setting its axes on native Text:

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
    <Text
      style={{
        fontFamily: 'RobotoFlex',
        fontSize: 72,
        fontVariationSettings: '"opsz" 144, "wdth" 100, "wght" 700',
      }}
    >
      EXPO
    </Text>
  );
}
```

## Run the poster

Copy this entire folder, including assets, into your components directory. Keep it outside Expo Router's route directory. Internal imports are relative.

```bash
npx expo install expo-font react-native-reanimated react-native-worklets react-native-gesture-handler react-native-safe-area-context
```

Use SDK 58-compatible versions and rebuild your development app after adding native packages. Render the example inside your gesture and safe-area providers:

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

VariableFontExample and VariableFontScreen export the same component. Pass navigation focus through the optional isActive prop if inactive screens stay mounted. It defaults to true.

## Change it

Edit WORDS in marquee.tsx to change the two scrolling lines. Hidden Text probes use normal onLayout measurements to update each word's shared width as the font axes change.

The pad maps horizontal movement to wdth 50–150 and vertical movement to wght 100–1000. Optical size stays at 144. Moving up also increases the uniformly displayed type size.

variable-text.tsx uses useAnimatedProps because Reanimated 4.7.1 filters fontVariationSettings out of native animated styles. Keep the Text wrapper that applies the initial axes through its style. variable-text.web.tsx uses useAnimatedStyle on web.

The frame is a rounded React Native View. Scrolling pauses when isActive is false, the app is inactive, or Reduce Motion is enabled. The pad supports native accessibility actions and web keyboard controls. The measured poster disables system font scaling and exposes one accessible image description.

Based on [expo-variable-font](https://github.com/SchroederNathan/expo-variable-font). Keep assets/RobotoFlex-OFL.txt with copies of the bundled font you distribute.
