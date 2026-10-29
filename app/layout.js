import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { AuthProvider } from "../components/AuthProvider";
import { CartProvider } from "../components/CartProvider";
import WholesaleBanner from "../components/WholesaleBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "VG PRINTING HUB - Custom Printing & Corporate Gifts",
  description: "High-quality custom print-on-demand corporate gifts and wholesale merchandise",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <WholesaleBanner />
            <main style={{ flex: 1 }}>{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
