//
//  QRScannerView.swift
//  CDBLLeaveCompanion
//
//  QR code scanner for syncing data from web app
//

import SwiftUI
import AVFoundation
import AudioToolbox
import Combine

struct QRScannerView: View {
    @StateObject private var scanner = QRScannerViewModel()
    @State private var showSyncStatus = false
    
    var body: some View {
        NavigationView {
            ZStack {
                // Camera preview
                if scanner.hasPermission {
                    QRScannerCameraView(viewModel: scanner)
                        .ignoresSafeArea()
                    
                    // Scanner overlay
                    ScannerOverlay()
                    
                    // Instructions
                    VStack {
                        Spacer()
                        VStack(spacing: StyleGuide.Spacing.sm) {
                            Text("Scan QR code from web app")
                                .font(StyleGuide.Typography.title3)
                                .foregroundColor(.white)
                            Text("Point your camera at the QR code to sync your data")
                                .font(StyleGuide.Typography.body)
                                .foregroundColor(.white.opacity(0.9))
                                .multilineTextAlignment(.center)
                        }
                        .padding(StyleGuide.Spacing.lg)
                        .background(.ultraThinMaterial)
                        .cornerRadius(StyleGuide.CornerRadius.medium)
                        .padding(.bottom, StyleGuide.Spacing.xxl)
                    }
                } else {
                    // Permission denied state
                    VStack(spacing: StyleGuide.Spacing.md) {
                        Image(systemName: "camera.fill")
                            .font(.system(size: 60))
                            .foregroundColor(StyleGuide.Colors.foregroundSecondary)
                        Text("Camera Access Required")
                            .font(StyleGuide.Typography.title2)
                        Text("Please enable camera access in Settings to scan QR codes")
                            .font(StyleGuide.Typography.body)
                            .foregroundColor(StyleGuide.Colors.foregroundSecondary)
                            .multilineTextAlignment(.center)
                        Button("Open Settings") {
                            if let url = URL(string: UIApplication.openSettingsURLString) {
                                UIApplication.shared.open(url)
                            }
                        }
                        .glassButton(style: .primary)
                    }
                    .padding(StyleGuide.Spacing.lg)
                }
            }
            .background(StyleGuide.Colors.background)
            .navigationTitle("Sync Data")
            .navigationBarGlassBackground()
            .toolbar {
                ToolbarItemGroup(placement: .navigationBarTrailing) {
                    Button(action: {
                        scanner.requestPermission()
                    }) {
                        Label("Permissions", systemImage: "lock.fill")
                    }
                }
            }
            .sheet(isPresented: $showSyncStatus) {
                if scanner.syncResult != nil {
                    SyncStatusView(result: scanner.syncResult!)
                }
            }
            .onChange(of: scanner.syncResult) { result in
                if result != nil {
                    showSyncStatus = true
                }
            }
        }
    }
}

// MARK: - QR Scanner ViewModel

@MainActor
class QRScannerViewModel: NSObject, ObservableObject {
    @Published var hasPermission = false
    @Published var detectedCode: String?
    @Published var syncResult: SyncResult?
    
    override init() {
        super.init()
        checkPermission()
    }
    
    func checkPermission() {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            hasPermission = true
        default:
            hasPermission = false
        }
    }
    
    func requestPermission() {
        AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
            DispatchQueue.main.async {
                self?.hasPermission = granted
            }
        }
    }
    
    func handleQRCode(_ code: String) {
        detectedCode = code
        // Process sync
        Task {
            do {
                let result = try await SyncService.shared.syncFromQRCode(code)
                syncResult = result
            } catch {
                syncResult = SyncResult(success: false, message: error.localizedDescription, syncedItems: nil)
            }
        }
    }
}

// MARK: - Scanner Overlay

struct ScannerOverlay: View {
    var body: some View {
        GeometryReader { geometry in
            let size = min(geometry.size.width, geometry.size.height) * 0.7
            let frame = CGRect(
                x: (geometry.size.width - size) / 2,
                y: (geometry.size.height - size) / 2,
                width: size,
                height: size
            )
            
            ZStack {
                // Dimmed background
                Color.black.opacity(0.5)
                    .ignoresSafeArea()
                    .mask(
                        Rectangle()
                            .fill(Color.black)
                            .overlay(
                                Rectangle()
                                    .frame(width: frame.width, height: frame.height)
                                    .blendMode(.destinationOut)
                            )
                    )
                
                // Corner brackets
                ScannerCorners(frame: frame)
            }
        }
    }
}

struct ScannerCorners: View {
    let frame: CGRect
    let cornerLength: CGFloat = 20
    let cornerWidth: CGFloat = 3
    
    var body: some View {
        ZStack {
            // Top-left
            VStack {
                HStack {
                    Rectangle()
                        .fill(Color.green)
                        .frame(width: cornerLength, height: cornerWidth)
                    Spacer()
                }
                HStack {
                    Rectangle()
                        .fill(Color.green)
                        .frame(width: cornerWidth, height: cornerLength)
                    Spacer()
                }
            }
            .frame(width: frame.width, height: frame.height, alignment: .topLeading)
            .offset(x: frame.minX, y: frame.minY)
            
            // Top-right
            VStack {
                HStack {
                    Spacer()
                    Rectangle()
                        .fill(Color.green)
                        .frame(width: cornerLength, height: cornerWidth)
                }
                HStack {
                    Spacer()
                    Rectangle()
                        .fill(Color.green)
                        .frame(width: cornerWidth, height: cornerLength)
                }
            }
            .frame(width: frame.width, height: frame.height, alignment: .topTrailing)
            .offset(x: frame.minX, y: frame.minY)
            
            // Bottom-left
            VStack {
                HStack {
                    Rectangle()
                        .fill(Color.green)
                        .frame(width: cornerWidth, height: cornerLength)
                    Spacer()
                }
                HStack {
                    Rectangle()
                        .fill(Color.green)
                        .frame(width: cornerLength, height: cornerWidth)
                    Spacer()
                }
            }
            .frame(width: frame.width, height: frame.height, alignment: .bottomLeading)
            .offset(x: frame.minX, y: frame.minY)
            
            // Bottom-right
            VStack {
                HStack {
                    Spacer()
                    Rectangle()
                        .fill(Color.green)
                        .frame(width: cornerWidth, height: cornerLength)
                }
                HStack {
                    Spacer()
                    Rectangle()
                        .fill(Color.green)
                        .frame(width: cornerLength, height: cornerWidth)
                }
            }
            .frame(width: frame.width, height: frame.height, alignment: .bottomTrailing)
            .offset(x: frame.minX, y: frame.minY)
        }
    }
}

// MARK: - Camera View

import UIKit

struct QRScannerCameraView: UIViewControllerRepresentable {
    @ObservedObject var viewModel: QRScannerViewModel
    
    func makeUIViewController(context: Context) -> QRScannerViewController {
        let controller = QRScannerViewController()
        controller.delegate = viewModel
        return controller
    }
    
    func updateUIViewController(_ uiViewController: QRScannerViewController, context: Context) {
        // No updates needed
    }
}

class QRScannerViewController: UIViewController {
    var delegate: QRScannerDelegate?
    private var captureSession: AVCaptureSession?
    private var previewLayer: AVCaptureVideoPreviewLayer?
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupCamera()
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        captureSession?.startRunning()
    }
    
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        captureSession?.stopRunning()
    }
    
    private func setupCamera() {
        let session = AVCaptureSession()
        guard let videoCaptureDevice = AVCaptureDevice.default(for: .video) else { return }
        
        do {
            let videoInput = try AVCaptureDeviceInput(device: videoCaptureDevice)
            if session.canAddInput(videoInput) {
                session.addInput(videoInput)
            }
        } catch {
            return
        }
        
        let metadataOutput = AVCaptureMetadataOutput()
        if session.canAddOutput(metadataOutput) {
            session.addOutput(metadataOutput)
            metadataOutput.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
            metadataOutput.metadataObjectTypes = [.qr]
        } else {
            return
        }
        
        let previewLayer = AVCaptureVideoPreviewLayer(session: session)
        previewLayer.frame = view.layer.bounds
        previewLayer.videoGravity = .resizeAspectFill
        view.layer.addSublayer(previewLayer)
        
        self.captureSession = session
        self.previewLayer = previewLayer
    }
    
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        previewLayer?.frame = view.layer.bounds
    }
}

extension QRScannerViewController: AVCaptureMetadataOutputObjectsDelegate {
    func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        if let metadataObject = metadataObjects.first,
            let readableObject = metadataObject as? AVMetadataMachineReadableCodeObject,
           let stringValue = readableObject.stringValue {
            AudioServicesPlaySystemSound(SystemSoundID(kSystemSoundID_Vibrate))
            delegate?.didDetectQRCode(stringValue)
        }
    }
}

protocol QRScannerDelegate {
    func didDetectQRCode(_ code: String)
}

extension QRScannerViewModel: QRScannerDelegate {
    func didDetectQRCode(_ code: String) {
        handleQRCode(code)
    }
}

// MARK: - Sync Service & Result

struct SyncResult: Equatable {
    let success: Bool
    let message: String
    let syncedItems: Int?
}

// MARK: - Preview

#if DEBUG
struct QRScannerView_Previews: PreviewProvider {
    static var previews: some View {
        QRScannerView()
    }
}
#endif

