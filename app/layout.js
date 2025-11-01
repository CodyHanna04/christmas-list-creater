// app/layout.js
import "./globals.css";
import "@/utils/palette.css";

export const metadata = {
  title: "Christmas List",
  description: "Share a holiday wishlist with family & friends",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
