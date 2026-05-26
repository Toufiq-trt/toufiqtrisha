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
    const hrefMatches = text.match(/\/file\/d\/([a-zA-Z0-9-_]{28,35})/g) || [];
    const hrefIds = hrefMatches.map(m => m.split('/file/d/')[1]);
    const uniqueIds = Array.from(new Set(hrefIds)).filter(id => id !== folderId);
    console.log("Found", uniqueIds.length, "photos");
    console.log("First 5 IDs:", uniqueIds.slice(0, 5));
  } catch (err) {
    console.error(err);
  }
}

run();
