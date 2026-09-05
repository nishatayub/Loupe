import { Space_Grotesk, Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: "Loupe — Short Films, Shared",
  description:
    "Loupe is a home for short films. Upload your own or discover what creators around the world are making.",
  openGraph: {
    title: "Loupe — Short Films, Shared",
    description:
      "Loupe is a home for short films. Upload your own or discover what creators around the world are making.",
    images: ["/media/images/boombox-hollywood-neon.jpg"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${robotoMono.variable}`}
    >
      <body className="bg-ink text-white font-body antialiased">{children}</body>
    </html>
  );
}
