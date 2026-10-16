import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Centimo",
    short_name: "Centimo",
    description: "Controla tus gastos con precisión de trader.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#05070b",
    theme_color: "#05070b",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
