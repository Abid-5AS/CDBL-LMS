//
//  ParallaxBackground.swift
//  CDBLLeaveCompanion
//
//  Parallax floating background animation for Liquid Glass UI
//  Phase 4 Enhancement
//

import SwiftUI

/// Parallax floating background view
struct ParallaxBackground: View {
    @State private var offset1: CGSize = .zero
    @State private var offset2: CGSize = .zero
    @State private var rotation: Double = 0
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // First floating layer
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [
                                Color.blue.opacity(0.15),
                                Color.purple.opacity(0.1)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: geometry.size.width * 0.6, height: geometry.size.width * 0.6)
                    .offset(offset1)
                    .blur(radius: 40)
                
                // Second floating layer
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [
                                Color.purple.opacity(0.1),
                                Color.blue.opacity(0.15)
                            ],
                            startPoint: .bottomTrailing,
                            endPoint: .topLeading
                        )
                    )
                    .frame(width: geometry.size.width * 0.5, height: geometry.size.width * 0.5)
                    .offset(offset2)
                    .blur(radius: 50)
                
                // Third subtle layer
                Ellipse()
                    .fill(
                        RadialGradient(
                            colors: [
                                Color.accentColor.opacity(0.08),
                                Color.clear
                            ],
                            center: .center,
                            startRadius: 50,
                            endRadius: 200
                        )
                    )
                    .frame(width: geometry.size.width * 0.8, height: geometry.size.height * 0.6)
                    .offset(x: offset2.width * 0.5, y: offset1.height * 0.5)
                    .blur(radius: 60)
            }
            .onAppear {
                startAnimation(geometry: geometry)
            }
        }
        .ignoresSafeArea()
    }
    
    private func startAnimation(geometry: GeometryProxy) {
        // Animate first layer
        withAnimation(
            Animation.easeInOut(duration: 8)
                .repeatForever(autoreverses: true)
        ) {
            offset1 = CGSize(
                width: geometry.size.width * 0.15,
                height: geometry.size.height * 0.1
            )
        }
        
        // Animate second layer (delayed and opposite direction)
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            withAnimation(
                Animation.easeInOut(duration: 10)
                    .repeatForever(autoreverses: true)
            ) {
                offset2 = CGSize(
                    width: -geometry.size.width * 0.12,
                    height: -geometry.size.height * 0.08
                )
            }
        }
    }
}

/// View modifier to add parallax background
extension View {
    func parallaxBackground() -> some View {
        ZStack {
            ParallaxBackground()
            self
        }
    }
}

// MARK: - Preview

#if DEBUG
struct ParallaxBackground_Previews: PreviewProvider {
    static var previews: some View {
        VStack {
            Text("Content with Parallax Background")
                .font(.title)
        }
        .parallaxBackground()
    }
}
#endif

