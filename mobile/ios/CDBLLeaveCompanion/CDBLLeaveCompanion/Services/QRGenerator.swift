//
//  QRGenerator.swift
//  CDBLLeaveCompanion
//
//  QR code generation service using CoreImage
//

import UIKit
import CoreImage

// MARK: - QR Generator

class QRGenerator {
    static let shared = QRGenerator()
    
    private init() {}
    
    /// Generate a QR code image from data
    /// - Parameters:
    ///   - data: The data to encode in the QR code
    ///   - size: The desired size of the output image (default: 512x512)
    ///   - correctionLevel: Error correction level (default: .M for medium)
    /// - Returns: UIImage of the QR code, or nil if generation fails
    func generateQRCode(
        from data: Data,
        size: CGSize = CGSize(width: 512, height: 512),
        correctionLevel: String = "M"
    ) -> UIImage? {
        // Create filter
        guard let filter = CIFilter(name: "CIQRCodeGenerator") else {
            return nil
        }
        
        filter.setValue(data, forKey: "inputMessage")
        filter.setValue(correctionLevel, forKey: "inputCorrectionLevel")
        
        // Get output image
        guard let outputImage = filter.outputImage else {
            return nil
        }
        
        // Scale to desired size
        let scaleX = size.width / outputImage.extent.width
        let scaleY = size.height / outputImage.extent.height
        let transformedImage = outputImage.transformed(by: CGAffineTransform(scaleX: scaleX, y: scaleY))
        
        // Convert to UIImage
        let context = CIContext()
        guard let cgImage = context.createCGImage(transformedImage, from: transformedImage.extent) else {
            return nil
        }
        
        return UIImage(cgImage: cgImage)
    }
    
    /// Generate QR code from a string
    func generateQRCode(from string: String, size: CGSize = CGSize(width: 512, height: 512)) -> UIImage? {
        guard let data = string.data(using: .utf8) else {
            return nil
        }
        return generateQRCode(from: data, size: size)
    }
    
    /// Generate QR code from JSON data (leave request export)
    func generateQRCode(fromJSONData jsonData: Data, size: CGSize = CGSize(width: 512, height: 512)) -> UIImage? {
        return generateQRCode(from: jsonData, size: size)
    }
    
    /// Save QR code image to a temporary file
    func saveQRCodeToFile(_ qrImage: UIImage) throws -> URL {
        guard let pngData = qrImage.pngData() else {
            throw QRGenerationError.imageConversionFailed
        }
        
        let tempDir = FileManager.default.temporaryDirectory
        let fileName = "leave-qr-\(UUID().uuidString).png"
        let fileURL = tempDir.appendingPathComponent(fileName)
        
        try pngData.write(to: fileURL)
        
        return fileURL
    }
}

// MARK: - QR Generation Errors

enum QRGenerationError: LocalizedError {
    case imageConversionFailed
    
    var errorDescription: String? {
        switch self {
        case .imageConversionFailed:
            return "Failed to convert QR code to PNG data"
        }
    }
}

