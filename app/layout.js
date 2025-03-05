import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-900 flex">
            {/* Main Content */}
            <div className="ml-64 p-8 flex-grow">{children}</div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
