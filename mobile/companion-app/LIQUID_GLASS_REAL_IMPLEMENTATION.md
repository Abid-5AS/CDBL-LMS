# Real iOS 26 Liquid Glass Implementation with Expo UI

This document explains how to use **real SwiftUI Liquid Glass** effects in your React Native app using `@expo/ui`.

## Overview

Expo UI (`@expo/ui`) brings SwiftUI primitives directly to React Native. For iOS 26's Liquid Glass effect, Expo UI provides:

1. **`GlassEffectContainer`** - Container for views with glass effects
2. **`buttonStyle('glass')` / `buttonStyle('glassProminent')`** - Built-in glass buttons
3. **SwiftUI modifiers** - Direct access to SwiftUI styling system

## Package Installed

```json
{
  "@expo/ui": "latest"
}
```

## Key Components

### 1. GlassEffectContainer

The primary way to achieve Liquid Glass effects. Wrap your views in this container:

```tsx
import { Host, VStack, GlassEffectContainer } from "@expo/ui/swift-ui";
import { padding, cornerRadius, background } from "@expo/ui/swift-ui/modifiers";

<GlassEffectContainer spacing={8}>
  <Host matchContents>
    <VStack
      modifiers={[
        padding({ all: 16 }),
        cornerRadius(20),
        background("rgba(255, 255, 255, 0.7)"),
      ]}
    >
      {/* Your content */}
    </VStack>
  </Host>
</GlassEffectContainer>;
```

### 2. Glass Buttons

Use SwiftUI's built-in glass button styles:

```tsx
import { Host, Button } from "@expo/ui/swift-ui";
import {
  buttonStyle,
  padding,
  cornerRadius,
  tint,
} from "@expo/ui/swift-ui/modifiers";

<Host matchContents>
  <Button
    onPress={() => {}}
    modifiers={[
      buttonStyle("glass"), // or 'glassProminent'
      padding({ horizontal: 24, vertical: 14 }),
      cornerRadius(12),
      tint("#007AFF"),
    ]}
  >
    Glass Button
  </Button>
</Host>;
```

**Available button styles:**

- `'glass'` - Translucent glass effect
- `'glassProminent'` - More prominent glass
- `'bordered'` - Standard bordered button
- `'borderedProminent'` - Prominent bordered
- `'borderless'` - No border
- `'plain'` - Plain text button

### 3. SwiftUI Form (Settings-style UI)

SwiftUI's `Form` component automatically applies glass effects:

```tsx
import { Host, Form, Section, Text, Switch } from "@expo/ui/swift-ui";

<Host style={{ flex: 1 }}>
  <Form>
    <Section title="Settings">
      <Text>Some text</Text>
      <Switch
        value={switchValue}
        label="Enable feature"
        onValueChange={setSwitchValue}
      />
    </Section>
  </Form>
</Host>;
```

## Available SwiftUI Modifiers

From `@expo/ui/swift-ui/modifiers`:

### Layout

- `padding({ all, horizontal, vertical, top, bottom, leading, trailing })`
- `frame({ width, height, minWidth, maxWidth, alignment })`
- `fixedSize({ horizontal, vertical })`
- `cornerRadius(number)`
- `clipShape('rectangle' | 'circle' | 'roundedRectangle')`

### Styling

- `background(color)` - Background color
- `foregroundStyle(style)` - Text/foreground color with options:
  - String: `'#FF0000'` or `'red'`
  - Hierarchical: `{ type: 'hierarchical', style: 'primary' | 'secondary' | 'tertiary' }`
  - Gradient: `{ type: 'linearGradient', colors: [...], startPoint, endPoint }`
- `tint(color)` - Tint color
- `opacity(0-1)`
- `shadow({ radius, x, y, color })`
- `border({ color, width })`

### Effects

- `blur(radius)`
- `brightness(amount)`
- `contrast(amount)`
- `saturation(amount)`
- `grayscale(amount)`
- `hueRotation(degrees)`

### Button Styles

- `buttonStyle('glass' | 'glassProminent' | 'bordered' | 'borderedProminent' | 'borderless' | 'plain')`

### Interaction

- `disabled(boolean)`
- `hidden(boolean)`
- `onTapGesture(() => {})`
- `onLongPressGesture(() => {}, minimumDuration?)`

## Example: Complete Liquid Glass Screen

```tsx
import React from "react";
import { ScrollView } from "react-native";
import {
  Host,
  VStack,
  Text,
  Button,
  GlassEffectContainer,
} from "@expo/ui/swift-ui";
import {
  padding,
  cornerRadius,
  background,
  foregroundStyle,
  buttonStyle,
  tint,
  shadow,
} from "@expo/ui/swift-ui/modifiers";

export function LiquidGlassScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F2F2F7" }}>
      <GlassEffectContainer spacing={12} style={{ padding: 20 }}>
        {/* Card 1 */}
        <Host matchContents>
          <VStack
            modifiers={[
              padding({ all: 20 }),
              cornerRadius(24),
              background("rgba(255, 255, 255, 0.7)"),
              shadow({ radius: 12, y: 4, color: "rgba(0, 0, 0, 0.1)" }),
            ]}
          >
            <Text
              modifiers={[
                foregroundStyle({ type: "hierarchical", style: "primary" }),
              ]}
            >
              Beautiful Glass Card
            </Text>
            <Text
              modifiers={[
                foregroundStyle({ type: "hierarchical", style: "secondary" }),
              ]}
            >
              With real SwiftUI modifiers
            </Text>
          </VStack>
        </Host>

        {/* Glass Button */}
        <Host matchContents>
          <Button
            onPress={() => alert("Tapped!")}
            modifiers={[
              buttonStyle("glass"),
              padding({ horizontal: 24, vertical: 14 }),
              cornerRadius(16),
              tint("#007AFF"),
            ]}
          >
            Glass Button
          </Button>
        </Host>

        {/* Prominent Glass Button */}
        <Host matchContents>
          <Button
            onPress={() => alert("Tapped!")}
            modifiers={[
              buttonStyle("glassProminent"),
              padding({ horizontal: 24, vertical: 14 }),
              cornerRadius(16),
              tint("#FF3B30"),
            ]}
          >
            Prominent Glass
          </Button>
        </Host>
      </GlassEffectContainer>
    </ScrollView>
  );
}
```

## Requirements

- **Expo SDK 54+** (current: SDK 54.0.23 ✅)
- **iOS 26+** for full Liquid Glass effects
- **Development build** (not Expo Go) for production apps

## Important Notes

1. **`<Host>` is required** - It's the SwiftUI container (like `<svg>` for DOM)
2. **`matchContents` prop** - Makes Host size to its SwiftUI content
3. **Modifiers are arrays** - Pass array of modifiers to `modifiers` prop
4. **Platform-specific** - SwiftUI components only work on iOS
5. **Fallbacks needed** - Always provide Android/Web alternatives

## Resources

- [Expo UI Blog Post](https://expo.dev/blog/liquid-glass-app-with-expo-ui-and-swiftui)
- [Expo UI Docs](https://docs.expo.dev/ui/overview/)
- [Example Apps](https://github.com/expo/expo/tree/main/apps/native-component-list/src/screens/ExpoUIComponents)

## Migration from Old Implementation

Our previous implementation used `expo-blur` (React Native blur effect). The new implementation uses real SwiftUI primitives:

**Old (fake glass)**:

```tsx
<BlurView intensity={80} tint="light">
  <View>...</View>
</BlurView>
```

**New (real Liquid Glass)**:

```tsx
<GlassEffectContainer spacing={8}>
  <Host matchContents>
    <VStack modifiers={[...]}>
      ...
    </VStack>
  </Host>
</GlassEffectContainer>
```

The difference? Real SwiftUI = native performance, authentic iOS 26 design, better accessibility.
