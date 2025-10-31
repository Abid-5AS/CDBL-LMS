//
//  CDBLLeaveCompanionApp.swift
//  CDBLLeaveCompanion
//
//  Created by Md.Abid Shahriar on 31/10/25.
//

import SwiftUI
import CoreData

@main
struct CDBLLeaveCompanionApp: App {
    let persistenceController = PersistenceController.shared

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}
