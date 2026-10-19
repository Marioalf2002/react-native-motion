# Project Environment

- Bun workspace monorepo with an Expo/React Native app in `apps/expo` and a Next.js site in `apps/website`.
- Mobile app: Expo SDK 58, React Native 0.88, Expo Router, Reanimated 4.7; iOS and Android native projects are generated with Expo Prebuild.
- Start Metro from the repository root with `bun expo` (default port 8081).
- Run iOS with `bun run --filter expo-app ios`; run Android with `bun run --filter expo-app android`.
- Mobile identifiers: `com.schroedernathan.rnmotion` on iOS and Android.
- Use Bun for workspace commands. There is no configured mobile test runner; validate with TypeScript and device QA.
- Before Expo edits, follow `apps/expo/AGENTS.md` and consult the exact Expo SDK 58 documentation.

## Native QA on this machine

- SDK 58's generated scene lifecycle runs on the iOS 27.2 simulator. Regenerate ignored native projects after SDK changes; the prior SDK 56 scene-lifecycle and Swift compilation workarounds are obsolete.
- Xcode 27.1 rejected existing pods' iOS 12/13 deployment targets. A Debug arm64 simulator build succeeded with `IPHONEOS_DEPLOYMENT_TARGET=16.4` and `CODE_SIGN_IDENTITY=-`, without dependency patches. Expo Doctor passes all 20 checks; TypeScript and iOS/Android exports pass.
- Variable Font loads Roboto Flex through `expo-font` and demonstrates SDK 58's native `Text.fontVariationSettings`. Preserve the actual font implementation when porting examples. Native width 50–150 and weight 100–1000 were verified interactively on iOS 27.2.
- Keep the Variable Font example in TypeScript with React Native components. Its marquee measures one and two repetitions with `onLayout` and subtracts their widths, so the loop includes between-repeat letter spacing on every platform. The docs lead with `useFonts` and native `Text`; preserve the outer layout Text and inner axis Text.

## Cross-platform QA (2026-10-19)

- Live Variable Font checks passed on the iOS 27.2 simulator and Chromium using Expo web: font loading, width/weight controls, opposite marquee directions, wrapping and navigation. iOS Reduce Motion paused scrolling while the pad remained interactive; the original setting was restored.
- Android 16/API 36 measurements update when the outer native Text owns font/layout and an inner Text alone owns fontVariationSettings. Preserve this nesting. A cold-launch check and actual fixed-height pad drags verified EXPO widths 210.67→369.90→210.67 and VARIABLE FONTS 598.86→1083.43→598.86. Earlier hot-refresh diagnostic results were stale; do not restore the old single-Text renderer. Both native text elements disable font scaling to preserve the poster's measured geometry.
- Expo web needs `react-dom`, `react-native-web`, and the existing Lottie onboarding's optional `@lottiefiles/dotlottie-react` peer. `registry.web.tsx` registers Variable Font without eagerly importing native-only demos; other gallery videos remain available. Run `bun run --filter expo-app web`.
- Android builds on this machine need `ANDROID_HOME=/Users/nate/Library/Android/sdk` and JDK 21 from Android Studio's `Contents/jbr/Contents/Home`. Use an isolated emulator rather than another thread's device.
- Expo exports for all three platforms, Expo TypeScript, all 20 Expo Doctor checks and the Next production build pass. Both video assets are identical 720×720 H.264 at 60 fps. Detailed runtime evidence is in `/tmp/rnmotion-variable-font-qa/`.
- Website-wide ESLint has 9 errors and 1 warning in five files unchanged from origin/main. These baseline findings are in animation-card.tsx, code-block.tsx, code-previewer.tsx, searchable-animations-grid.tsx and mdx-components.tsx; the feature's changed React files pass React Doctor with only the intentional registry-export warning.
