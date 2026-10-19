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
- Keep the Variable Font example in TypeScript with React Native components. Its marquee measures word widths with `onLayout`; it needs no Swift generator, precomputed font tables, or SwiftUI frame. The docs lead with `useFonts` and a normal `Text` style.
