//
//  IntegrityChecker.swift
//  CDBLLeaveCompanion
//
//  Device integrity checks for jailbreak detection
//

import Foundation

/// Device integrity checking for security
class IntegrityChecker {
    
    static let shared = IntegrityChecker()
    private init() {}
    
    /// Check if device is jailbroken
    func isJailbroken() -> Bool {
        // Check for common jailbreak files
        let jailbreakPaths = [
            "/Applications/Cydia.app",
            "/Applications/RockApp.app",
            "/Applications/Icy.app",
            "/usr/sbin/frida-server",
            "/etc/apt",
            "/bin/bash",
            "/usr/sbin/sshd",
            "/Library/MobileSubstrate",
            "/var/lib/cydia",
            "/private/var/stash"
        ]
        
        for path in jailbreakPaths {
            if FileManager.default.fileExists(atPath: path) {
                return true
            }
        }
        
        // Check if app can write outside sandbox
        let sandboxTestPath = "/private/jailbreak_check.txt"
        if FileManager.default.createFile(atPath: sandboxTestPath, contents: nil, attributes: nil) {
            FileManager.default.removeItem(atPath: sandboxTestPath)
            return true
        }
        
        return false
    }
    
    /// Get integrity status message
    func integrityStatus() -> String {
        if isJailbroken() {
            return "Device integrity compromised"
        }
        return "Device verified"
    }
}

