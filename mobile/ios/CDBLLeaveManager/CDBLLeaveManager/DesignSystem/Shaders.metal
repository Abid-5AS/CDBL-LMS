#include <metal_stdlib>
#include <SwiftUI/SwiftUI.h>
using namespace metal;

/// Calculates the distance from the center of the UV coordinates.
float distanceToCenter(float2 uv) {
    return length(uv - 0.5);
}

/// A "Liquid Glass" Shader that simulates refraction and slight chromatic aberration.
///
/// - Parameters:
///   - position: The position of the current pixel.
///   - layer: The SwiftUI layer being modified (the background content).
///   - size: The size of the view.
///   - time: The current time, used for subtle animation (optional).
[[ stitchable ]] float4 liquidGlass(float2 position, SwiftUI::Layer layer, float2 size, float time) {
    // Normalize position (0.0 to 1.0)
    float2 uv = position / size;
    
    // 1. Distortion / Refraction
    // Create a subtle "bulge" or "liquid" wave.
    // We use sin/cos based on time and position to create a moving liquid surface.
    float wave = sin(uv.x * 10.0 + time) * cos(uv.y * 10.0 + time) * 0.005;
    
    // Bulge effect based on distance from center (simulating distinct glass thickness)
    float dist = distanceToCenter(uv);
    float bulge = smoothstep(0.5, 0.0, dist) * 0.1; // Magnification in center
    
    // Combine offsets
    float2 refractionOffset = float2(wave + bulge * (uv.x - 0.5), wave + bulge * (uv.y - 0.5));
    
    // 2. Chromatic Aberration
    // Sample channels at slightly different offsets to simulate prism effect at edges
    float red = layer.sample(position + refractionOffset * size * 1.5).r;
    float green = layer.sample(position + refractionOffset * size * 1.0).g;
    float blue = layer.sample(position + refractionOffset * size * 0.5).b;
    float alpha = layer.sample(position + refractionOffset * size).a;
    
    return float4(red, green, blue, alpha);
}
