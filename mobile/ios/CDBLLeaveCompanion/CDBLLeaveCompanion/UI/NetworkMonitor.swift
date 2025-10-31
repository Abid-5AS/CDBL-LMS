//
//  NetworkMonitor.swift
//  CDBLLeaveCompanion
//
//  Network connectivity monitor for offline indicator
//

import Foundation
import Network
import Combine
import SwiftUI

class NetworkMonitor: ObservableObject {
    @Published var isConnected = true
    
    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "NetworkMonitor")
    
    init() {
        monitor.pathUpdateHandler = { [weak self] path in
            DispatchQueue.main.async {
                self?.isConnected = path.status == .satisfied
            }
        }
        monitor.start(queue: queue)
    }
    
    deinit {
        monitor.cancel()
    }
}

// MARK: - Offline Indicator

struct OfflineIndicator: View {
    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: "wifi.slash")
                .font(.caption)
            Text("Offline")
                .font(StyleGuide.Typography.caption)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(.ultraThinMaterial)
        .foregroundColor(StyleGuide.Colors.warning)
        .cornerRadius(12)
        .shadow(radius: 4)
    }
}

