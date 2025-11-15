/**
 * iOS Liquid Glass Components using Expo UI + SwiftUI
 *
 * Real iOS 26 Liquid Glass implementation using @expo/ui/swift-ui
 * Uses GlassEffectContainer and buttonStyle('glass') for authentic liquid glass
 *
 * @see https://expo.dev/blog/liquid-glass-app-with-expo-ui-and-swiftui
 * @requires iOS 26+ for full Liquid Glass support
 */

export { LiquidGlassCard } from "./LiquidGlassCard";
export { LiquidGlassText } from "./LiquidGlassText";
export { LiquidGlassButton } from "./LiquidGlassButton";
export {
  LiquidGlassForm,
  LiquidGlassFormSection,
  FormText,
  FormSwitch,
  FormButton,
} from "./LiquidGlassForm";

/**
 * Usage Example:
 *
 * ```tsx
 * import { LiquidGlassCard, LiquidGlassButton } from '@/src/components/ios';
 *
 * export function MyScreen() {
 *   return (
 *     <LiquidGlassCard spacing={8}>
 *       <Text>Beautiful Liquid Glass effect!</Text>
 *       <LiquidGlassButton variant="glass" onPress={() => alert('Clicked!')}>
 *         Tap Me
 *       </LiquidGlassButton>
 *     </LiquidGlassCard>
 *   );
 * }
 * ```
 *
 * Button Variants:
 * - 'glass': Translucent glass effect button
 * - 'glassProminent': More prominent glass button
 * - 'bordered': Standard bordered button
 */
