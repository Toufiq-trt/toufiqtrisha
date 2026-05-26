import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ROMANTIC_QUOTES = [
  "In your eyes, I find the soul of the cosmos.",
  "Every heartbeat writes a verse of our shared infinity.",
  "Love is the architecture of the invisible, built between two souls.",
  "Symphony of silence, where even the stars lean in to listen.",
  "Captured in a frame of eternity, we dance through time.",
  "The texture of a memory, soft as twilight, deep as the sea.",
  "A masterpiece of emotion, painted in the hues of our devotion.",
  "Whispers of the morning mist, echoes of a midnight kiss.",
  "In the luxury of stillness, I heard your heart speak my name.",
  "Ephemeral moments, crystalline and cold, yet burning with life."
];

export async function generateCaption(imageUrl: string, promptContext?: string) {
  try {
    const response = await fetch("/api/caption", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl, promptContext }),
    });
    const data = await response.json();
    return data.caption || ROMANTIC_QUOTES[Math.floor(Math.random() * ROMANTIC_QUOTES.length)];
  } catch (err) {
    return ROMANTIC_QUOTES[Math.floor(Math.random() * ROMANTIC_QUOTES.length)];
  }
}

export function extractFolderId(url: string) {
  const match = url.match(/folders\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}
