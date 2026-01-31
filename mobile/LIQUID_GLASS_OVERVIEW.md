# iOS 26 Liquid Glass: Overview & Design Principles

## Introduction
"Liquid Glass" is the new dynamic material introduced with iOS 26. It brings a translucent, fluid, and glass-like aesthetic across all Apple platforms (iOS, iPadOS, macOS, watchOS, tvOS, and visionOS). This design language establishes visual hierarchy, harmony, and consistency across the ecosystem.

## Core Characteristics

### 1. Dynamic, Translucent & Fluid
Liquid Glass is not static. It combines the optical properties of glass with a sense of **fluidity**.
- **Real-time Light Bending:** Simulates how light passes through glass.
- **Adaptive:** Shifts naturally between light and dark environments.
- **Interactive:** Specular highlights respond to device motion (parallax) and user interaction.

### 2. Hierarchy
The material is functional, not just cosmetic. It helps establish a clear visual hierarchy.
- **Elevation:** Controls and interface elements appear to "float," distinguishing them from the content beneath.
- **Depth:** Provides a sense of depth that helps users understand the structure of the app.

### 3. Harmony
Aligns with the concentric design philosophy of Apple's hardware and software.
- **Cohesion:** Creates a unified experience where hardware and software feel like a single entity.

### 4. Consistency
Promotes a universal design language.
- **Cross-Platform:** Simplifies development by maintaining coherence across different screen sizes (from Watch to Vision Pro).

## Design Best Practices
- **Embrace Visual Refreshes:** actively update materials, controls, and app icons to the new standard rather than clinging to legacy styles.
- **Universal Navigation:** Provide a consistent navigation and search experience that feels familiar across all Apple platforms.
- **Edge-to-Edge:** Design layouts that extend behind bars and sidebars to fully leverage the refractive properties of the material.

## Timeline & Roadmap
- **iOS 26:** Introduction of Liquid Glass. Adoption is encouraged.
- **iOS 27:** Full adoption expected to be mandatory. Older design fallbacks may be removed.

## Key Tools
- **Icon Composer:** A new tool for building app icons as multi-layer compositions to fully utilize Liquid Glass effects.
- **Xcode 26:** Automatically applies Liquid Glass to standard UI components.
