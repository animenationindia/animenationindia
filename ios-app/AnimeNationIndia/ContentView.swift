import SwiftUI

struct ContentView: View {
    @StateObject private var networkMonitor = NetworkMonitor()
    @State private var isLoading = true
    @State private var progress: Double = 0.0
    @State private var reloadTrigger = false
    @State private var hasLoadError = false
    
    private let appURL = URL(string: "https://animenationindia.vercel.app/")!
    
    var body: some View {
        ZStack(alignment: .top) {
            Color(red: 5/255, green: 7/255, blue: 22/255)
                .edgesIgnoringSafeArea(.all)
            
            if !networkMonitor.isConnected || hasLoadError {
                OfflineView {
                    hasLoadError = false
                    isLoading = true
                    reloadTrigger = true
                }
            } else {
                WebView(
                    url: appURL,
                    isLoading: $isLoading,
                    progress: $progress,
                    reloadTrigger: $reloadTrigger,
                    onReceivedError: {
                        hasLoadError = true
                    }
                )
                .edgesIgnoringSafeArea(.bottom) // Keeps status bar clean
                
                // Thin Neon Pink Progress Bar
                if isLoading {
                    ProgressView(value: progress, total: 1.0)
                        .progressViewStyle(LinearProgressViewStyle(tint: Color(red: 255/255, green: 77/255, blue: 210/255)))
                        .frame(height: 3)
                        .background(Color(red: 255/255, green: 77/255, blue: 210/255).opacity(0.1))
                        .transition(.opacity)
                }
            }
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
