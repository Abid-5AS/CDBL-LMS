import SwiftUI

struct FluidBackground: View {
    @State private var animateBlobs = false
    
    // Static gradient for performance - no animations needed for login
    var body: some View {
        ZStack {
            // Dark base
            Color(red: 0.05, green: 0.05, blue: 0.12)
            
            // Static gradient blobs - no animation for better performance
            Circle()
                .fill(
                    RadialGradient(
                        colors: [Color.cyan.opacity(0.3), Color.cyan.opacity(0)],
                        center: .center,
                        startRadius: 50,
                        endRadius: 200
                    )
                )
                .frame(width: 400, height: 400)
                .offset(x: animateBlobs ? 50 : -50, y: animateBlobs ? -100 : -50)
                .blur(radius: 40)
            
            Circle()
                .fill(
                    RadialGradient(
                        colors: [Color.purple.opacity(0.25), Color.purple.opacity(0)],
                        center: .center,
                        startRadius: 50,
                        endRadius: 200
                    )
                )
                .frame(width: 500, height: 500)
                .offset(x: animateBlobs ? -80 : 30, y: animateBlobs ? 150 : 100)
                .blur(radius: 50)
        }
        .drawingGroup()
        .ignoresSafeArea()
        .onAppear {
            // Slow, subtle animation - only in release builds
            #if !DEBUG
            withAnimation(.easeInOut(duration: 8).repeatForever(autoreverses: true)) {
                animateBlobs = true
            }
            #endif
        }
    }
}

#Preview {
    FluidBackground()
}
