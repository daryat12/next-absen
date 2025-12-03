import BodyEvents from "@/components/BodyEvents";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Absen Karyawan",
  description: "Project Absensi Karyawan",
  icons: {
    icon: "/icon.png", // otomatis ambil dari /public/icon.png
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <BodyEvents />
        {children}
      </body>
    </html>
  );
}
