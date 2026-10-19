import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { animationScreens } from '@/components/animations/registry';
import { animations } from '@/data/animations';
import { useTheme } from '@/theme';

function VariableFontBackButton() {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back to animations"
      onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
      style={({ pressed }) => ({
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#cecbdf',
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Ionicons name="chevron-back" size={26} color="#2002f5" />
    </Pressable>
  );
}

function ComingSoon({ title }: { title: string }) {
  const { colors, theme, tokens } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: tokens.spacing.xl,
        gap: tokens.spacing.sm,
        backgroundColor: colors.background,
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontFamily: theme.fonts.semibold,
          fontSize: tokens.fontSize.title,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: colors.textSecondary,
          fontFamily: theme.fonts.regular,
          fontSize: tokens.fontSize.body,
          textAlign: 'center',
        }}
      >
        This demo hasn't been built yet.
      </Text>
    </View>
  );
}

export default function AnimationDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const animation = animations.find((a) => a.slug === slug);
  const title = animation?.title ?? 'Animation';
  const Screen = slug ? animationScreens[slug] : undefined;
  const isAurora = slug === 'aurora-curtain';
  const isVariableFont = slug === 'variable-font';

  return (
    <>
      <Stack.Screen
        options={{
          title,
          headerLargeTitle: false,
          headerBackButtonDisplayMode: 'minimal',
          // The curtain is anchored to the top of the screen, so anything drawn
          // up there sits on the light. Keep the back button and drop the rest,
          // and let the canvas run under it.
          ...(isAurora
            ? {
                headerTitle: '',
                headerTransparent: true,
                headerShadowVisible: false,
                headerStyle: { backgroundColor: 'transparent' },
                headerTintColor: '#F4F3FA',
              }
            : {}),
          ...(isVariableFont
            ? {
                headerTitle: '',
                headerTransparent: true,
                headerShadowVisible: false,
                headerBlurEffect: 'none',
                headerStyle: { backgroundColor: 'transparent' },
                headerTintColor: '#2002f5',
                headerBackVisible: false,
                headerLeft: () => <VariableFontBackButton />,
              }
            : {}),
        }}
      />
      {Screen ? <Screen /> : <ComingSoon title={title} />}
    </>
  );
}
