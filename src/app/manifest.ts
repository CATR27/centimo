import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Centimo",
    short_name: "Centimo",
    description: "Controla tus gastos con precisión de trader.",
    lang: "es",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#eef2f1",
    theme_color: "#eef2f1",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
