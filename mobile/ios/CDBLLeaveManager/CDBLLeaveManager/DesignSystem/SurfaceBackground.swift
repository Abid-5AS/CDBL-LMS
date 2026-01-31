import SwiftUI

enum AppSurfaceStyle {
    case regular
    case clear

    var color: Color {
        switch self {
        case .regular:
            return Color(.secondarySystemBackground)
        case .clear:
            return Color(.systemBackground)
        }
    }
}

extension View {
    func surfaceBackground<S: Shape>(
        _ style: AppSurfaceStyle = .regular,
        in shape: S
    ) -> some View {
        background(style.color, in: shape)
    }
}
