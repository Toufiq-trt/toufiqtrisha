import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { google } from "googleapis";
import dotenv from "dotenv";
import { Readable } from "stream";
import captionsCache from "./src/captions_cache.json";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Initialize Google Drive API (Optional: Requires GOOGLE_DRIVE_API_KEY)
const drive = google.drive({
  version: "v3",
  auth: process.env.GOOGLE_DRIVE_API_KEY // Users can set this in secrets
});

/**
 * Endpoint to generate a romantic editorial caption using Gemini.
 */
app.post("/api/caption", async (req, res) => {
  try {
    const { imageUrl, promptContext } = req.body;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Write a single, deeply romantic, poetic, and luxury editorial caption for a photo magazine. 
            The mood is high-end, cinematic, and emotional. 
            Context: ${promptContext || "A beautiful memory"}. 
            Keep it under 15 words. Use elegant vocabulary.`
    });

    const text = response.text || "Love Canvas";
    res.json({ caption: text.trim() });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "Failed to generate caption" });
  }
});

/**
 * Fetches image files from a public Google Drive folder.
 * Uses the official API if GOOGLE_DRIVE_API_KEY is present,
 * otherwise falls back to a robust public folder metadata scraper.
 */
app.get("/api/photos", async (req, res) => {
  const folderId = "1208XwPo_n693XjwqB0nQEMHWhYernA2h";
  
  try {
    // We prioritize the scraper using 'embeddedfolderview' because it retrieves all 242 photos 
    // seamlessly without any pagination or API key limits.
    const folderUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}`;
    const response = await fetch(folderUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    const text = await response.text();
    
    // Find all file viewing entries with their last-modified dates
    const entryBlocks = text.split('<div class="flip-entry"');
    const parsedPhotos: any[] = [];
    
    for (let i = 1; i < entryBlocks.length; i++) {
      const block = entryBlocks[i];
      const idMatch = block.match(/\/file\/d\/([a-zA-Z0-9-_]{28,35})/);
      const id = idMatch ? idMatch[1] : null;
      
      const dateMatch = block.match(/last-modified"><div>([^<]+)<\/div>/);
      const dateStr = dateMatch ? dateMatch[1] : null;
      
      if (id && id !== folderId) {
        parsedPhotos.push({ id, dateStr });
      }
    }

    // Safely remove duplicates
    const uniqueMap = new Map<string, string | null>();
    for (const entry of parsedPhotos) {
      if (!uniqueMap.has(entry.id)) {
        uniqueMap.set(entry.id, entry.dateStr);
      }
    }
    
    const uniqueEntries = Array.from(uniqueMap.entries()).map(([id, dateStr]) => ({
      id,
      dateStr,
    }));

    if (uniqueEntries.length > 5) {
      const parseDriveDate = (dStr: string | null) => {
        if (!dStr) return new Date(0);
        const parts = dStr.split("/");
        if (parts.length === 3) {
          const m = parseInt(parts[0], 10) - 1;
          const d = parseInt(parts[1], 10);
          let y = parseInt(parts[2], 10);
          if (y < 100) {
            y += 2000;
          }
          return new Date(y, m, d);
        }
        return new Date(0);
      };

      const formatDriveDate = (dStr: string | null) => {
        if (!dStr) return "A beautiful moment";
        const parts = dStr.split("/");
        if (parts.length === 3) {
          const m = parseInt(parts[0], 10) - 1;
          const d = parseInt(parts[1], 10);
          let y = parseInt(parts[2], 10);
          if (y < 100) {
            y += 2000;
          }
          if (y === 2025) {
            return "11 June 2025";
          }
          const dateObj = new Date(y, m, d);
          return dateObj.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
          });
        }
        return "An eternal memory";
      };

      // Sort older to newer
      uniqueEntries.sort((a, b) => {
        const dateA = parseDriveDate(a.dateStr);
        const dateB = parseDriveDate(b.dateStr);
        return dateA.getTime() - dateB.getTime();
      });

      const photos = uniqueEntries.map((item) => ({
        id: item.id,
        name: "", 
        url: `https://lh3.googleusercontent.com/d/${item.id}=w1000`,
        dateStr: item.dateStr,
        formattedDate: formatDriveDate(item.dateStr)
      }));

      return res.json({ photos });
    }

    // Fallback block if scraping failed but API key is present
    if (process.env.GOOGLE_DRIVE_API_KEY) {
      try {
        const apiResponse = await drive.files.list({
          q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
          fields: "files(id, name, createdTime, webViewLink, thumbnailLink)",
          key: process.env.GOOGLE_DRIVE_API_KEY
        });
        
        const files = apiResponse.data.files || [];
        if (files.length > 5) {
          const photos = files.map(file => {
            const dateObj = file.createdTime ? new Date(file.createdTime) : new Date();
            let formattedDate = dateObj.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric"
            });
            if (dateObj.getFullYear() === 2025) {
              formattedDate = "11 June 2025";
            }
            return {
              id: file.id,
              name: "",
              url: `https://lh3.googleusercontent.com/d/${file.id}=w1000`,
              dateStr: dateObj.getFullYear() === 2025 ? "6/11/25" : `${dateObj.getMonth() + 1}/${dateObj.getDate()}/${dateObj.getFullYear().toString().slice(-2)}`,
              formattedDate,
              createdTime: dateObj.getFullYear() === 2025 ? new Date(2025, 5, 11).getTime() : dateObj.getTime()
            };
          });
          
          // Sort older to newer
          photos.sort((a, b) => (a.createdTime || 0) - (b.createdTime || 0));
          return res.json({ photos });
        }
      } catch (err) {
        console.error("Drive API Error:", err);
      }
    }

    // Ultimate fail-safe: serve all 242 photos using the curated captions cache file
    const cacheKeys = Object.keys(captionsCache);
    const photosFallback = cacheKeys.map((id) => ({
      id,
      name: "",
      url: `https://lh3.googleusercontent.com/d/${id}=w1000`,
      dateStr: "6/11/25",
      formattedDate: "11 June 2025"
    }));
    return res.json({ photos: photosFallback });
  } catch (error: any) {
    console.error("Drive Error:", error);
    try {
      const cacheKeys = Object.keys(captionsCache);
      const photosFallback = cacheKeys.map((id) => ({
        id,
        name: "",
        url: `https://lh3.googleusercontent.com/d/${id}=w1000`,
        dateStr: "6/11/25",
        formattedDate: "11 June 2025"
      }));
      return res.json({ photos: photosFallback });
    } catch (innerError) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
});

/**
 * Endpoint to download high-resolution images as proper file attachments
 * bypasses cross-origin or navigation behavior, starting direct quiet downloads.
 */
app.get("/api/download-image/:id", async (req, res) => {
  const fileId = req.params.id;
  const targetUrl = `https://lh3.googleusercontent.com/d/${fileId}=w4000`; // Fetch the maximum original resolution
  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      return res.status(response.status).send("Failed to retrieve image metadata");
    }
    res.setHeader("Content-Disposition", `attachment; filename="toufiq-trisha-memory-${fileId}.jpg"`);
    res.setHeader("Content-Type", "image/jpeg");
    
    if (response.body) {
      const readable = Readable.fromWeb(response.body as any);
      readable.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    console.error("Download Image Error:", error);
    res.status(500).send("Error downloading image");
  }
});

const cachedUrlsIndex = new Map<string, { targetUrl: string; cookie: string | null }>();

/**
 * Endpoint to stream the heavy background and feature video from Google Drive.
 * Bypasses the virus scan warning for >100MB files dynamically on the server-side with optimal HTTP Range-seeking.
 */
app.get("/api/video/:id", async (req, res) => {
  const fileId = req.params.id;
  const url = `https://docs.google.com/uc?export=download&id=${fileId}`;
  
  const fetchHeaders: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
  };

  if (req.headers.range) {
    fetchHeaders['Range'] = req.headers.range;
  }

  try {
    const cached = cachedUrlsIndex.get(fileId);
    let targetUrl = cached ? cached.targetUrl : url;
    let cookieVal = cached ? cached.cookie : null;

    if (!cached) {
      // Direct HEAD / initial request to inspect contentType before reading body to protect RAM
      const firstResp = await fetch(url, { headers: { 'User-Agent': fetchHeaders['User-Agent'] } });
      const contentType = firstResp.headers.get("content-type") || "";

      if (contentType.includes("text/html")) {
        const text = await firstResp.text();
        const uuidMatch = text.match(/name="uuid"\s+value="([^"]+)"/);
        const confirmMatch = text.match(/name="confirm"\s+value="([^"]+)"/);
        const cookies = firstResp.headers.get('set-cookie');

        if (uuidMatch && confirmMatch) {
          const uuid = uuidMatch[1];
          const confirm = confirmMatch[1];
          let cookie: string | null = null;
          if (cookies) {
            cookie = cookies.split(';')[0];
            fetchHeaders['Cookie'] = cookie;
          }
          targetUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=${confirm}&uuid=${uuid}`;
          cookieVal = cookie;
          cachedUrlsIndex.set(fileId, { targetUrl, cookie });
        } else {
          // Stream directly (e.g. error or unknown text content)
          res.status(firstResp.status);
          for (const [k, v] of firstResp.headers.entries()) {
            res.setHeader(k, v);
          }
          if (firstResp.body) {
            Readable.fromWeb(firstResp.body as any).pipe(res);
          } else {
            res.end();
          }
          return;
        }
      } else {
        // Stream direct response binary mapping
        res.status(firstResp.status);
        for (const [k, v] of firstResp.headers.entries()) {
          res.setHeader(k, v);
        }
        if (firstResp.body) {
          Readable.fromWeb(firstResp.body as any).pipe(res);
        } else {
          res.end();
        }
        return;
      }
    }

    if (cookieVal) {
      fetchHeaders['Cookie'] = cookieVal;
    }

    const videoResp = await fetch(targetUrl, { headers: fetchHeaders });
    
    // Auto retry session refresh if authorization expired
    if (videoResp.status === 403 || videoResp.status === 400) {
      cachedUrlsIndex.delete(fileId);
      const retryResp = await fetch(url, { headers: { 'User-Agent': fetchHeaders['User-Agent'] } });
      const text = await retryResp.text();
      const uuidMatch = text.match(/name="uuid"\s+value="([^"]+)"/);
      const confirmMatch = text.match(/name="confirm"\s+value="([^"]+)"/);
      const cookies = retryResp.headers.get('set-cookie');
      if (uuidMatch && confirmMatch) {
        const uuid = uuidMatch[1];
        const confirm = confirmMatch[1];
        let cookie: string | null = null;
        if (cookies) {
          cookie = cookies.split(';')[0];
        }
        const finalUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=${confirm}&uuid=${uuid}`;
        cachedUrlsIndex.set(fileId, { targetUrl: finalUrl, cookie });
        
        const finalHeaders: Record<string, string> = {
          'User-Agent': fetchHeaders['User-Agent']
        };
        if (req.headers.range) finalHeaders['Range'] = req.headers.range;
        if (cookie) finalHeaders['Cookie'] = cookie;

        const finalVideoResp = await fetch(finalUrl, { headers: finalHeaders });
        res.status(finalVideoResp.status);
        for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'content-disposition', 'cache-control']) {
          const val = finalVideoResp.headers.get(h);
          if (val) res.setHeader(h, val);
        }
        if (finalVideoResp.body) {
          Readable.fromWeb(finalVideoResp.body as any).pipe(res);
        } else {
          res.end();
        }
        return;
      }
    }

    res.status(videoResp.status);
    for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'content-disposition', 'cache-control']) {
      const val = videoResp.headers.get(h);
      if (val) {
        res.setHeader(h, val);
      }
    }

    if (videoResp.body) {
      Readable.fromWeb(videoResp.body as any).pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    console.error("Video Proxy Error:", error);
    res.status(500).send("Error streaming video");
  }
});



async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

setupVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
