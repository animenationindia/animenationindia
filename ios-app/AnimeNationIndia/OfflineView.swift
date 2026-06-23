import SwiftUI

struct OfflineView: View {
    var onRetry: () -> Void
    
    var body: some View {
        ZStack {
            Color(red: 5/255, green: 7/255, blue: 22/255) // Brand Deep Space Blue
                .edgesIgnoringSafeArea(.all)
            
            VStack(spacing: 24) {
                // Warning Icon with pink glow
                ZStack {
                    Circle()
                        .fill(Color(red: 255/255, green: 77/255, blue: 210/255).opacity(0.1))
                        .frame(width: 100, height: 100)
                    
                    Image(systemName: "wifi.exclamationmark")
                        .font(.system(size: 44, weight: .bold))
                        .foregroundColor(Color(red: 255/255, green: 77/255, blue: 210/255))
                }
                
                VStack(spacing: 12) {
                    Text("CONNECTION LOST")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .tracking(2.0)
                    
                    Text("Oops! It seems you are disconnected from the network. Please check your internet connection and try again.")
                        .font(.subheadline)
                        .foregroundColor(Color(white: 0.6))
                        .multilineTextAlignment(.center)
                        .frame(width: 300)
                }
                
                Button(action: onRetry) {
                    HStack(spacing: 8) {
                        Image(systemName: "arrow.clockwise")
                            .font(.system(size: 16, weight: .bold))
                        Text("TRY AGAIN")
                            .font(.system(size: 14, weight: .bold))
                            .tracking(1.0)
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 32)
                    .padding(.vertical, 12)
                    .background(Color(red: 255/255, green: 77/255, blue: 210/255))
                    .cornerRadius(8)
                }
                .padding(.top, 16)
            }
            .padding()
        }
    }
}

struct OfflineView_Previews: PreviewProvider {
    static var previews: some View {
        OfflineView(onRetry: {})
            .preferredColorScheme(.dark)
    }
}
