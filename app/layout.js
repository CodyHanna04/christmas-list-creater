// app/layout.js
import "./globals.css";
import "@/utils/palette.css";
import Header from "@/components/Header";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"

export const metadata = {
  title: "Christmas List",
  description: "Share a holiday wishlist with family & friends",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
