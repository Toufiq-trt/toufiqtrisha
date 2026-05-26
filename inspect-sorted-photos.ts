import fetch from "node-fetch";

async function run() {
  const folderId = "1208XwPo_n693XjwqB0nQEMHWhYernA2h";
  const folderUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}`;
  try {
    const response = await fetch(folderUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    const text = await response.text();
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
    
    const parseDriveDate = (dStr: string | null) => {
      if (!dStr) return new Date(0);
      const parts = dStr.split("/");
      if (parts.length === 3) {
        const m = parseInt(parts[0], 10) - 1;
        const d = parseInt(parts[1], 10);
        let y = parseInt(parts[2], 10);
        if (y < 100) y += 2000;
        return new Date(y, m, d);
      }
      return new Date(0);
    };

    uniqueEntries.sort((a, b) => parseDriveDate(a.dateStr).getTime() - parseDriveDate(b.dateStr).getTime());

    console.log("Total unique photos:", uniqueEntries.length);
    console.log("First 15 photo dates/IDs:");
    console.log(uniqueEntries.slice(0, 15));
    console.log("Last 40 photo dates/IDs:");
    console.log(uniqueEntries.slice(-40));
  } catch (err) {
    console.error(err);
  }
}
run();
