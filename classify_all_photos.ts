import { GoogleGenAI } from "@google/genai";
import fetch from "node-fetch";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

dotenv.config();

const CACHE_FILE = path.join(process.cwd(), "src", "captions_cache.json");

// Read existing cache if available
let cache: Record<string, { type: "single" | "couple"; caption: string }> = {};
if (fs.existsSync(CACHE_FILE)) {
  try {
    cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
  } catch (e) {
    console.error("Failed to parse existing cache", e);
  }
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Ensure directories exist
const dir = path.dirname(CACHE_FILE);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Pre-curated high-end creative fallback pools in case Gemini fails or for absolute diversity
const fallbackSingleCaptions = [
  "Solitary Splendor",
  "A Quiet Reflection",
  "In Her Own Light",
  "Graceful Isolation",
  "Silent Whispers of the Soul",
  "Lost in Gentle Thought",
  "Individual Radiance",
  "Elegance in Solitude",
  "Charming Contemplation",
  "The Art of Being",
  "A Moment with Oneself",
  "Serene Outlook",
  "Quietude of Heart",
  "A Portrait of Grace",
  "Mindful Presence",
  "Whispering Breeze",
  "The Pure Light of Reflection",
  "Gazing into Tomorrow",
  "Simple Grace",
  "Golden Individuality",
  "An Elegant Reverie",
  "Subtle Allure",
  "Beautifully Unbound",
  "Echo of One",
  "Infinite Grace",
  "The Peace of Now",
  "Inner Sanctuary",
  "Chasing the Illumination",
  "Chic Simplicity",
  "Unspoken Elegance",
  "Her Radiant Muse",
  "Pure Essence",
  "Sophisticated Silence",
  "Wistful Horizon",
  "The Quiet Pathway"
];

const fallbackCoupleCaptions = [
  "Whispered Promises",
  "A Symphony of Two Hearts",
  "Holding Onto Forever",
  "Two Paths, One Destiny",
  "Woven in Celestial Stars",
  "Intimate Devotion",
  "Ethereal Connection",
  "The Rhythm of Us",
  "Anchored in Love",
  "Golden Hour Grace",
  "A Tapestry of Affection",
  "Warmth of Togetherness",
  "Boundless Harmony",
  "Two Souls, One Pulse",
  "The Language of Glances",
  "Interlaced Hearts",
  "Silent Understanding",
  "Our Own Universe",
  "Wandering Together",
  "Eternal Concord",
  "Sculpted in Love",
  "Captured Symphony",
  "A Shared Horizon",
  "Tender Whispers",
  "Hearts in Tandem",
  "The Harmony of Love",
  "Guiding Star of Us",
  "Sealed with a Promise",
  "Symphony of Gentle Smiles",
  "A Match Made in Heaven",
  "Beautiful Synchronicity",
  "Wrapped in Infinite Warmth",
  "Ours for Eternity",
  "Stealing Subtle Glances",
  "Shared Beats"
];

async function getPhotosList() {
  const folderId = "1208XwPo_n693XjwqB0nQEMHWhYernA2h";
  const folderUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}`;
  const response = await fetch(folderUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    }
  });
  const text = await response.text();
  const hrefMatches = text.match(/\/file\/d\/([a-zA-Z0-9-_]{28,35})/g) || [];
  const hrefIds = hrefMatches.map(m => m.split('/file/d/')[1]);
  return Array.from(new Set(hrefIds)).filter(id => id !== folderId);
}

// Help ensure unique captions across generation
const usedCaptions = new Set<string>();
Object.values(cache).forEach(item => usedCaptions.add(item.caption.trim().toLowerCase()));

async function processPhoto(id: string) {
  if (cache[id]) {
    console.log(`[Cache Hit] Photo ${id}: ${cache[id].type} - ${cache[id].caption}`);
    return;
  }

  // Fetch tiny version of the image
  const imgUrl = `https://lh3.googleusercontent.com/d/${id}=w150`;
  try {
    const res = await fetch(imgUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch image metadata: status ${res.status}`);
    }
    const buffer = await res.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString("base64");

    const prompt = `Analyze this romantic couple gallery photo and identify the subject composition:
    1. If it shows one single person (either a single girl or a single guy alone), classify block as "single".
    2. If it shows two people (loveable couple, together, cuddling, hugging, kissing, or paired), classify block as "couple".
    
    After classification, write a deeply romantic, poetic, luxury lifestyle magazine-style editorial caption (under 10 words) about the image.
    The caption must be highly emotional, cute, upscale, or poetic. 
    - For single persons: write something elegant about solo grace, quiet moments, reflection, or individual charm. Do NOT mention "single" in the caption itself (keep it classy). Like "Her quiet elegance", "Lost in reflection".
    - For couples: write something deeply loveable, touching, or cohesive based on the visual context. Like "Forever tangled in your warmth", "Golden hours in your arms".
    
    CRITICAL: Avoid clichés. Do not use words like "Anniversary", "Toufiq", "Trisha" unless perfectly appropriate. Keep captions strictly unique. 
    Examples of what we've already used: ${Array.from(usedCaptions).slice(-10).join(", ")}. Do NOT repeat any of those.
    
    Return your response strictly in JSON format as follows:
    {
      "type": "single" | "couple",
      "caption": "your generated caption here"
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image
          }
        },
        prompt
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    const result = JSON.parse(text);

    if (result.type && result.caption) {
      let finalCaption = result.caption.trim();
      
      // Prevent duplicates
      let attempts = 0;
      while (usedCaptions.has(finalCaption.toLowerCase()) && attempts < 5) {
        finalCaption = finalCaption + " " + (result.type === "single" ? "Grace" : "Love");
        attempts++;
      }
      
      usedCaptions.add(finalCaption.toLowerCase());

      cache[id] = {
        type: result.type,
        caption: finalCaption
      };

      console.log(`[Success] Photo ${id}: ${result.type} - "${finalCaption}"`);
      
      // Save cache incrementally
      fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
    } else {
      throw new Error("Invalid response format");
    }

  } catch (error) {
    console.error(`[Error] Photo ${id} processing failed:`, error);
    // Assign a fallback caption
    const rand = Math.random();
    const type = rand > 0.4 ? "couple" : "single";
    const pool = type === "single" ? fallbackSingleCaptions : fallbackCoupleCaptions;
    
    // Find one that is unused
    let fallbackCap = pool[Math.floor(Math.random() * pool.length)];
    let attempts = 0;
    while (usedCaptions.has(fallbackCap.toLowerCase()) && attempts < pool.length) {
      fallbackCap = pool[(pool.indexOf(fallbackCap) + 1) % pool.length];
      attempts++;
    }
    
    usedCaptions.add(fallbackCap.toLowerCase());

    cache[id] = {
      type,
      caption: fallbackCap
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
    console.log(`[Fallback] Photo ${id}: assigned ${type} - "${fallbackCap}"`);
  }
}

// Run through all photos with rate limit safety
async function run() {
  console.log("Analyzing photos in folder...");
  const ids = await getPhotosList();
  console.log(`Retrieved ${ids.length} photos.`);

  // We can process in sequence with small delays, or small batches of 3
  const batchSize = 3;
  for (let i = 0; i < ids.length; i += batchSize) {
    const chunk = ids.slice(i, i + batchSize);
    console.log(`Processing batch ${i / batchSize + 1} / ${Math.ceil(ids.length / batchSize)}`);
    
    await Promise.all(chunk.map(id => processPhoto(id)));
    
    // Sleep 1 second after batch to not overload Drive or Gemini
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log("Finished all processing! Cache written to:", CACHE_FILE);
}

run();
