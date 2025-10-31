//
//  GlassEffectContainer.swift
//  CDBLLeaveCompanion
//
//  Container for coordinating Liquid Glass animations
//  Following iOS 26 Liquid Glass design guidelines
//

import SwiftUI

/// Container for coordinating Liquid Glass morphing effects
/// Use this to group related views that should animate together
@available(iOS 26.0, *)
struct GlassEffectContainer<Content: View>: View {
    let content: Content
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        content
    }
}

// MARK: - Glass Effect ID Modifier

extension View {
    /// Assign a unique glass effect ID for coordinating animations
    /// Use within a GlassEffectContainer for morphing effects
    @available(iOS 26.0, *)
    func glassEffectID(_ id: String, in container: String = "default") -> some View {
        if #available(iOS 26.0, *) {
            return self
                .glassEffectID(id, in: container)
        } else {
            return self
        }
    }
}

