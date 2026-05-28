import React, { useState, useRef, useEffect } from "react";
import { Upload, Download, Sparkles, RefreshCw, Heart, Trash2, Camera, Move, RotateCcw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

export function InteractiveFeatures() {
  // --- Photo Booth States ---
  const [boothImage, setBoothImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [boothFileName, setBoothFileName] = useState("");
  const [isGeneratingBooth, setIsGeneratingBooth] = useState(false);
  const [imgNaturalSize, setImgNaturalSize] = useState({ width: 0, height: 0 });

  // --- Heart Collage Creator States ---
  const [collageImages, setCollageImages] = useState<Array<{ id: string; url: string }>>([]);
  const [isGeneratingHeart, setIsGeneratingHeart] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const collageInputRef = useRef<HTMLInputElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Coordinates for perfect 50-photo heart collage (1 center 3x3 big, plus 49 small cells)
  const HEART_ROWS = 10;
  const HEART_COLS = 11;
  const CENTER_BIG = { rStart: 4, rEnd: 7, cStart: 5, cEnd: 8 };

  const SMALL_CELLS = [
    // Row 0
    { r: 0, c: 2 }, { r: 0, c: 3 }, { r: 0, c: 7 }, { r: 0, c: 8 },
    // Row 1
    { r: 1, c: 2 }, { r: 1, c: 3 }, { r: 1, c: 7 }, { r: 1, c: 8 },
    // Row 2
    { r: 2, c: 1 }, { r: 2, c: 2 }, { r: 2, c: 3 }, { r: 2, c: 4 }, { r: 2, c: 5 }, { r: 2, c: 6 }, { r: 2, c: 7 }, { r: 2, c: 8 }, { r: 2, c: 9 },
    // Row 3
    { r: 3, c: 1 }, { r: 3, c: 2 }, { r: 3, c: 3 }, { r: 3, c: 7 }, { r: 3, c: 8 }, { r: 3, c: 9 },
    // Row 4
    { r: 4, c: 1 }, { r: 4, c: 2 }, { r: 4, c: 3 }, { r: 4, c: 7 }, { r: 4, c: 8 }, { r: 4, c: 9 },
    // Row 5
    { r: 5, c: 2 }, { r: 5, c: 3 }, { r: 5, c: 7 }, { r: 5, c: 8 },
    // Row 6
    { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 6, c: 4 }, { r: 6, c: 5 }, { r: 6, c: 6 }, { r: 6, c: 7 }, { r: 6, c: 8 },
    // Row 7
    { r: 7, c: 3 }, { r: 7, c: 4 }, { r: 7, c: 5 }, { r: 7, c: 6 }, { r: 7, c: 7 },
    // Row 8
    { r: 8, c: 4 }, { r: 8, c: 5 }, { r: 8, c: 6 },
    // Row 9
    { r: 9, c: 5 }
  ];

  // --- Photo Booth Handlers ---
  const handleBoothFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBoothFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          const imgObj = new Image();
          imgObj.onload = () => {
            setImgNaturalSize({ width: imgObj.width, height: imgObj.height });
            setBoothImage(dataUrl);
            setZoom(1);
            setPanX(0);
            setPanY(0);
          };
          imgObj.src = dataUrl;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleBoothDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setBoothFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          const imgObj = new Image();
          imgObj.onload = () => {
            setImgNaturalSize({ width: imgObj.width, height: imgObj.height });
            setBoothImage(dataUrl);
            setZoom(1);
            setPanX(0);
            setPanY(0);
          };
          imgObj.src = dataUrl;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const fitEntireImage = () => {
    if (imgNaturalSize.width === 0 || imgNaturalSize.height === 0) return;
    const viewW = viewportRef.current ? viewportRef.current.clientWidth : 380;
    const viewH = viewportRef.current ? viewportRef.current.clientHeight : 335;
    const viewportAspect = viewW / viewH;
    const imageAspect = imgNaturalSize.width / imgNaturalSize.height;

    let scaleFactor = 1;
    if (imageAspect > viewportAspect) {
      // Image is wider than viewport - fit by width
      scaleFactor = viewportAspect / imageAspect;
    } else {
      // Image is taller than viewport - fit by height
      scaleFactor = imageAspect / viewportAspect;
    }
    setZoom(scaleFactor);
    setPanX(0);
    setPanY(0);
  };

  const fillFrameWise = () => {
    setZoom(1.0);
    setPanX(0);
    setPanY(0);
  };

  const resetBooth = () => {
    setBoothImage(null);
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setImgNaturalSize({ width: 0, height: 0 });
    setBoothFileName("");
  };

  const handleNudge = (direction: "up" | "down" | "left" | "right", amount: number = 8) => {
    if (direction === "up") setPanY(prev => prev - amount);
    if (direction === "down") setPanY(prev => prev + amount);
    if (direction === "left") setPanX(prev => prev - amount);
    if (direction === "right") setPanX(prev => prev + amount);
  };

  // Dragging inside photo booth frame to position photo
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!boothImage) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Touch triggers for mobile positioning
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!boothImage || e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({ x: e.touches[0].clientX - panX, y: e.touches[0].clientY - panY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPanX(e.touches[0].clientX - dragStart.x);
    setPanY(e.touches[0].clientY - dragStart.y);
  };

  // Generate and Download Framed Photo Booth Card
  const downloadFramedWish = async () => {
    if (!boothImage) return;
    setIsGeneratingBooth(true);

    try {
      // 1000 x 1400 high-res card output
      const canvas = document.createElement("canvas");
      canvas.width = 1000;
      canvas.height = 1400;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 1. Soft base pink background
      ctx.fillStyle = "#FFDFE5";
      ctx.fillRect(0, 0, 1000, 1400);

      // 2. Repeat pink and colorful heart emojis beautifully over the entire background
      ctx.font = "32px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const canvasHearts = ["❤️", "💖", "💝", "💕", "💗", "💓", "💞", "💟", "❣", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💘"];
      let rIndex = 0;
      for (let y = 40; y < 1400; y += 80) {
        const offset = (rIndex % 2 === 0) ? 0 : 40;
        let cIndex = 0;
        for (let x = 40 + offset; x < 1000 + 100; x += 90) {
          const emojiIndex = (rIndex + cIndex) % canvasHearts.length;
          ctx.fillText(canvasHearts[emojiIndex], x, y);
          cIndex++;
        }
        rIndex++;
      }

      // Render visitor's uploaded photo in the interior wishing viewport
      const img = new Image();
      img.src = boothImage;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Viewport container inside 1000x1400pt:
      // Leave space for elegant matching frames and bottom ornaments.
      const vpX = 100;
      const vpY = 100;
      const vpW = 800;
      const vpH = 950;

      // Clip the drawing inside viewport so no spill outside
      ctx.save();
      ctx.beginPath();
      ctx.rect(vpX, vpY, vpW, vpH);
      ctx.clip();

      // Calculate source and destination positioning with visitor's custom pan & zoom
      const scaleAspect = Math.max(vpW / img.width, vpH / img.height);
      const baseW = img.width * scaleAspect;
      const baseH = img.height * scaleAspect;

      // Scale base width & height with user zoom
      const drawW = baseW * zoom;
      const drawH = baseH * zoom;

      // Get accurate responsive scaling divisor from UI client viewport size to HD canvas viewport output
      const viewportWidth = viewportRef.current ? viewportRef.current.clientWidth : 380;
      const viewportHeight = viewportRef.current ? viewportRef.current.clientHeight : 335;
      const scaleFactorX = vpW / viewportWidth;
      const scaleFactorY = vpH / viewportHeight;

      const renderPanX = panX * scaleFactorX;
      const renderPanY = panY * scaleFactorY;

      const drawX = vpX + (vpW - drawW) / 2 + renderPanX;
      const drawY = vpY + (vpH - drawH) / 2 + renderPanY;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();

      // Draw Double White Border Framing around the card
      ctx.strokeStyle = "#FFFFFF";

      // Outer thin white border line
      ctx.lineWidth = 4;
      ctx.strokeRect(15, 15, 970, 1370);

      // Inner thick solid white border line
      ctx.lineWidth = 14;
      ctx.strokeRect(30, 30, 940, 1340);

      // White inner border around the photo viewport
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 10;
      ctx.strokeRect(vpX, vpY, vpW, vpH);

      // Vignette shadow on top of inner viewport photo for realistic photographic depth
      const vignetteGrad = ctx.createLinearGradient(vpX, vpY, vpX, vpY + 50);
      vignetteGrad.addColorStop(0, "rgba(0,0,0,0.25)");
      vignetteGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = vignetteGrad;
      ctx.fillRect(vpX, vpY, vpW, 50);

      // Vector Heart Drawer Helper
      const drawSingleHeartCanvas = (
        c: CanvasRenderingContext2D,
        x: number,
        y: number,
        w: number,
        h: number,
        color: string,
        strokeColor?: string,
        strokeW?: number
      ) => {
        c.save();
        c.fillStyle = color;
        c.beginPath();
        const topY = y - h * 0.35;
        c.moveTo(x, y + h * 0.45);
        c.bezierCurveTo(x - w * 0.6, y - h * 0.15, x - w * 0.5, topY, x, topY + h * 0.15);
        c.bezierCurveTo(x + w * 0.5, topY, x + w * 0.6, y - h * 0.15, x, y + h * 0.45);
        c.closePath();
        c.fill();
        if (strokeColor && strokeW) {
          c.strokeStyle = strokeColor;
          c.lineWidth = strokeW;
          c.stroke();
        }
        c.restore();
      };

      const drawTiltedHeartCanvas = (
        c: CanvasRenderingContext2D,
        cx: number,
        cy: number,
        w: number,
        h: number,
        angleDeg: number,
        color: string,
        strokeColor?: string,
        strokeW?: number
      ) => {
        c.save();
        c.translate(cx, cy);
        c.rotate((angleDeg * Math.PI) / 180);
        drawSingleHeartCanvas(c, 0, 0, w, h, color, strokeColor, strokeW);
        c.restore();
      };

      // 5. Draw the large tilted crimson heart in the bottom left containing the wishes!
      ctx.save();
      ctx.translate(320, 1150);
      ctx.rotate((-12 * Math.PI) / 180); // Rotate 12 degrees counter-clockwise
      
      // Draw heart at (0,0) in local rotated space
      drawSingleHeartCanvas(ctx, 0, 0, 420, 360, "#CF2E43", "#FFFFFF", 6);

      // Render calligraphy handwriting greeting text inside the rotated heart!
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Cursive elegant first line using Italianno or fallback cursive / serif fonts
      ctx.font = "italic 44px Italianno, Georgia, 'Playfair Display', serif";
      ctx.fillText("Happy Anniversary", 0, -25);

      // Sans-serif bold second line for Toufiq & Trisha
      ctx.font = "bold italic 30px Georgia, 'Playfair Display', serif";
      ctx.fillText("Toufiq & Trisha", 0, 25);

      ctx.restore();

      // 6. Draw the elegant, overlapping decorative mini hearts in the bottom right!
      // Back Pink Heart
      drawTiltedHeartCanvas(ctx, 780, 1140, 165, 145, 15, "#FFAFC5");
      // Back White Heart
      drawTiltedHeartCanvas(ctx, 680, 1190, 145, 125, -10, "#FFFFFF");
      // Front Red Heart
      drawTiltedHeartCanvas(ctx, 740, 1210, 205, 175, -5, "#CF2E43");
      // Accent Anthracite/Black Heart
      drawTiltedHeartCanvas(ctx, 840, 1130, 95, 80, -20, "#111115");

      // Trigger standard instant file download
      const link = document.createElement("a");
      link.download = `Happy_Anniversary_Toufiq_Trisha.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
    } catch (err) {
      console.error("Failed to generate booth card download:", err);
    } finally {
      setIsGeneratingBooth(false);
    }
  };

  // --- Heart Collage Creator Handlers ---
  const handleCollageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newImagesPromises = files.map((file) => {
        return new Promise<{ id: string; url: string }>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve({
              id: `${Date.now()}-${Math.random()}`,
              url: event.target?.result as string,
            });
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(newImagesPromises).then((results) => {
        setCollageImages((prev) => {
          const totalNew = [...prev, ...results];
          // Limit to max 50 for safety
          return totalNew.slice(0, 50);
        });
      });
    }
  };

  const removeCollagePhoto = (id: string) => {
    setCollageImages((prev) => prev.filter((p) => p.id !== id));
  };

  const clearAllCollagePhotos = () => {
    setCollageImages([]);
  };

  // Generate perfect downloadable 50-photo heart collage
  const downloadVisitorHeartCollage = async () => {
    if (collageImages.length === 0) return;
    setIsGeneratingHeart(true);

    try {
      // Setup a large perfect high-res download canvas (2400 x 2200 pixels)
      const downloadCanvas = document.createElement("canvas");
      const canvasSize = 2400;
      downloadCanvas.width = canvasSize;
      downloadCanvas.height = 2200;
      const ctx = downloadCanvas.getContext("2d");
      if (!ctx) return;

      // 1. Solid luxury textured dark background
      ctx.fillStyle = "#050507";
      ctx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);

      // 2. Load all uploaded visitor images or fill dynamically up to 50 items
      const loadedImages: HTMLImageElement[] = [];
      const totalImagesNeeded = 50;
      const rawImagesCount = collageImages.length;

      // To guarantee a perfect shape, we loop indices and reuse visitor images sequentially to fill all 50 slots
      const imageLoadingPromises = Array.from({ length: totalImagesNeeded }).map((_, i) => {
        return new Promise<HTMLImageElement | null>((resolve) => {
          const matchedImage = collageImages[i % rawImagesCount];
          if (!matchedImage) {
            resolve(null);
            return;
          }
          const tempImg = new Image();
          tempImg.src = matchedImage.url;
          tempImg.onload = () => resolve(tempImg);
          tempImg.onerror = () => resolve(null);
        });
      });

      const imagesArray = await Promise.all(imageLoadingPromises);
      const validImages = imagesArray.filter((img): img is HTMLImageElement => img !== null);

      if (validImages.length === 0) {
        setIsGeneratingHeart(false);
        return;
      }

      // Draw royal background accents
      ctx.save();
      const radialGrad = ctx.createRadialGradient(
        canvasSize / 2,
        1100,
        50,
        canvasSize / 2,
        1100,
        1000
      );
      radialGrad.addColorStop(0, "rgba(212, 175, 55, 0.15)");
      radialGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = radialGrad;
      ctx.fillRect(0, 0, canvasSize, 2200);
      ctx.restore();

      // Coordinates metrics inside HD canvas
      // Total columns = 11, Total rows = 10.
      const marginX = 220;
      const marginY = 180;
      const gridW = canvasSize - marginX * 2; // 1960 width
      const gridH = 2200 - marginY * 2; // 1840 height
      const cellW = gridW / HEART_COLS;
      const cellH = gridH / HEART_ROWS;
      const cellGap = 12; // Gap spacing in output

      // Draw Center Big 3x3 Photo
      // Matches rows index: 3, 4, 5 (4th, 5th, 6th row) and columns index: 4, 5, 6 (5th, 6th, 7th columns)
      const bigRowStart = CENTER_BIG.rStart - 1; // 3
      const bigRowEnd = CENTER_BIG.rEnd; // 7
      const bigColStart = CENTER_BIG.cStart - 1; // 4
      const bigColEnd = CENTER_BIG.cEnd; // 8

      const bigX = marginX + bigColStart * cellW + cellGap;
      const bigY = marginY + bigRowStart * cellH + cellGap;
      const bigW = cellW * (bigColEnd - bigColStart) - cellGap * 2;
      const bigH = cellH * (bigRowEnd - bigRowStart) - cellGap * 2;

      // First image from valid list goes to the big center
      const centerImg = validImages[0];
      if (centerImg) {
        ctx.save();
        ctx.beginPath();
        // Rounded corners for center photo
        ctx.roundRect ? ctx.roundRect(bigX, bigY, bigW, bigH, 20) : ctx.rect(bigX, bigY, bigW, bigH);
        ctx.clip();

        // Calculate aspect crop and center drawing
        const scale = Math.max(bigW / centerImg.width, bigH / centerImg.height);
        const drawW = centerImg.width * scale;
        const drawH = centerImg.height * scale;
        const drawX = bigX + (bigW - drawW) / 2;
        const drawY = bigY + (bigH - drawH) / 2;

        ctx.drawImage(centerImg, drawX, drawY, drawW, drawH);
        ctx.restore();

        // Elegant double thin border line on center photo
        ctx.strokeStyle = "rgba(212, 175, 55, 0.85)";
        ctx.lineWidth = 6;
        ctx.strokeRect(bigX, bigY, bigW, bigH);
      }

      // Draw Small surrounding cells (49 items)
      SMALL_CELLS.forEach((cell, idx) => {
        const cellImg = validImages[(idx + 1) % validImages.length];
        if (!cellImg) return;

        const cx = marginX + cell.c * cellW + cellGap / 2;
        const cy = marginY + cell.r * cellH + cellGap / 2;
        const cw = cellW - cellGap;
        const ch = cellH - cellGap;

        ctx.save();
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(cx, cy, cw, ch, 8) : ctx.rect(cx, cy, cw, ch);
        ctx.clip();

        const sScale = Math.max(cw / cellImg.width, ch / cellImg.height);
        const sDrawW = cellImg.width * sScale;
        const sDrawH = cellImg.height * sScale;
        const sDrawX = cx + (cw - sDrawW) / 2;
        const sDrawY = cy + (ch - sDrawH) / 2;

        ctx.drawImage(cellImg, sDrawX, sDrawY, sDrawW, sDrawH);
        ctx.restore();

        // Accent gold border round cell
        ctx.strokeStyle = "rgba(212, 175, 55, 0.35)";
        ctx.lineWidth = 2;
        ctx.strokeRect(cx, cy, cw, ch);
      });

      // Majestic Celebrant Footer Titles on Collage
      ctx.textAlign = "center";
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "italic 38px Georgia, 'Playfair Display', serif";
      ctx.fillText("Our Keepsake Love Heart Shape", canvasSize / 2, 2110);

      ctx.fillStyle = "#D4AF37";
      ctx.font = "bold 13px monospace";
      ctx.letterSpacing = "6px";
      ctx.fillText("HAPPY 1 YEAR ANNIVERSARY TOUFIQ & TRISHA", canvasSize / 2, 2150);

      // Heart outline trace glowing highlight
      ctx.fillStyle = "rgba(212, 175, 55, 0.08)";
      ctx.beginPath();
      ctx.arc(canvasSize / 2, 2030, 10, 0, Math.PI * 2);
      ctx.fill();

      // Trigger automatic file download
      const dLink = document.createElement("a");
      dLink.download = `Custom_Heart_Shape_Collage_Toufiq_Trisha.png`;
      dLink.href = downloadCanvas.toDataURL("image/png");
      dLink.click();
    } catch (err) {
      console.error("Collage compilation failed:", err);
    } finally {
      setIsGeneratingHeart(false);
    }
  };

  return (
    <section className="py-24 px-4 md:px-8 lg:px-12 bg-[#050505] relative overflow-hidden border-b border-white/5">
      {/* Background glowing particles ambiance */}
      <div className="absolute top-[20%] left-[10%] w-[350px] h-[350px] bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.04)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[450px] h-[450px] bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        
        {/* =========================================================================
            FEATURE 1: VIP GUEST ANNIVERSARY PHOTO BOOTH
            ========================================================================= */}
        <div id="wish-booth-feature" className="lg:col-span-6 w-full flex flex-col justify-start">
          <div className="mb-6">
            <span className="text-[10px] tracking-[0.5em] font-bold text-pink-400 uppercase block mb-3 font-mono">
              ✦ INTERACTIVE CELEBRATION
            </span>
            <h3 className="font-serif text-3xl md:text-4xl text-white leading-tight">
              Anniversary Wish Booth
            </h3>
            <p className="text-stone-400 text-xs mt-3 leading-relaxed">
              Upload your photo inside our modern custom anniversary romantic card frame and download a gorgeous high-res commemoration keepsake to celebrate Trisha & Toufiq's 1st year!
            </p>
          </div>

          {/* Interactive Frame Box Display Container */}
          <div 
            className="relative w-full aspect-[10/14] max-w-sm mx-auto bg-stone-950/80 rounded-2xl border border-white/5 p-4 flex flex-col items-center justify-center overflow-hidden shadow-2xl"
            onDragOver={handleDragOver}
            onDrop={handleBoothDrop}
          >
            {/* The Custom Romantic Tiled Background and Double Frame UI Rendering */}
            <div className="relative w-full h-full p-4 border border-white/5 rounded-xl flex flex-col justify-between overflow-hidden group select-none bg-[#FFDFE5] text-stone-950">
              
              {/* Repeating assorted heart emojis pattern layer behind photo slot inside card */}
              <div className="absolute inset-0 opacity-[0.18] pointer-events-none text-[16px] select-none pr-10 pt-4 overflow-hidden leading-[1.8] tracking-[0.3em]">
                {Array.from({ length: 14 }).map((_, r) => {
                  const hearts = ["❤️", "💖", "💝", "💕", "💗", "💓", "💞", "💟", "❣", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💘"];
                  // Shift array for staggered visual effect per row
                  const shiftedHearts = [...hearts.slice(r % hearts.length), ...hearts.slice(0, r % hearts.length)];
                  return (
                    <div key={r} className="whitespace-nowrap" style={{ transform: `translateX(${r % 2 === 0 ? '-10px' : '30px'})` }}>
                      {shiftedHearts.slice(0, 8).join("  ")}
                    </div>
                  );
                })}
              </div>

              {/* Actual physical double white border frame line overlay */}
              <div className="absolute inset-0 border-8 border-white pointer-events-none z-20 m-1" />
              <div className="absolute inset-2 border border-white/60 pointer-events-none z-20 m-1" />

              {/* Top Text Bar: Kept empty for spacing if needed or clean layout */}
              <div className="w-full flex justify-end items-baseline z-30 pt-4 px-3 mb-2" />

              {/* Viewport content area */}
              <div 
                ref={viewportRef}
                className="relative w-full flex-1 rounded border-4 border-white bg-[#0cf1cc]/2 overflow-hidden flex items-center justify-center z-10"
                style={{ backgroundColor: "#0b0c10" }}
              >
                {boothImage ? (
                  <div 
                    className="absolute inset-0 cursor-move overflow-hidden select-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUpOrLeave}
                    onMouseLeave={handleMouseUpOrLeave}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleMouseUpOrLeave}
                  >
                    <img
                      src={boothImage}
                      alt="Boothing item preview"
                      referrerPolicy="no-referrer"
                      className="max-w-none origin-center pointer-events-none user-select-none"
                      style={{
                        transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover"
                      }}
                    />
                    {/* Shadow overlay vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10 pointer-events-none" />
                  </div>
                ) : (
                  <div className="px-6 text-center flex flex-col items-center justify-center p-8 text-stone-200">
                    <Camera className="w-10 h-10 text-white/30 mb-3 animate-pulse" />
                    <p className="text-white text-[11px] uppercase tracking-[0.2em] font-mono font-medium">
                      Drag & Drop Photo OR
                    </p>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-3 px-4 py-2 bg-stone-900 border border-white/40 hover:bg-white hover:text-black rounded text-[10px] font-bold tracking-[0.15em] uppercase text-white transition-all duration-300"
                    >
                      Select File
                    </button>
                    <p className="text-[9px] text-stone-400 mt-2">Supports JPG, PNG, WEBP files</p>
                  </div>
                )}
              </div>

              {/* Card Footer: Beautiful bottom layout ornaments representing the Romantic card style */}
              <div className="h-28 w-full z-10 flex items-center justify-between px-2 pt-2 pb-1 relative">
                
                {/* Large Crimson Left heart wishing Toufiq & Trisha */}
                <div 
                  className="flex flex-col items-center justify-center text-center shadow-xl relative w-[130px] h-[110px]"
                  style={{ transform: "rotate(-12deg) translateY(-4px)" }}
                >
                  <Heart className="absolute inset-0 w-full h-full text-[#CF2E43] fill-[#CF2E43] filter drop-shadow-md stroke-white stroke-2" />
                  <div className="relative z-10 text-white leading-none px-1">
                    <p className="font-serif italic text-[14px]">Happy</p>
                    <p className="font-semibold text-[10px] tracking-tight whitespace-nowrap">Anniversary</p>
                    <p className="font-sans text-[8px] tracking-wide font-medium mt-0.5 opacity-90">Toufiq & Trisha</p>
                  </div>
                </div>

                {/* Right side overlapping cute decorative mini bubble hearts */}
                <div className="relative w-24 h-24 self-end flex items-end justify-end mb-1">
                  <Heart className="w-14 h-14 text-[#FFAFC5] fill-[#FFAFC5] absolute right-8 bottom-8 transform rotate-[15deg] opacity-90 stroke-white stroke-1" />
                  <Heart className="w-11 h-11 text-white fill-white absolute right-12 bottom-2 transform rotate-[-10deg] opacity-95" />
                  <Heart className="w-16 h-16 text-[#CF2E43] fill-[#CF2E43] absolute right-[4px] bottom-1 transform rotate-[-5deg] stroke-white stroke-1.5 shadow-lg" />
                  <Heart className="w-8 h-8 text-[#111115] fill-[#111115] absolute right-0 bottom-10 transform rotate-[-20deg]" />
                </div>
              </div>
            </div>

            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleBoothFileChange} 
            />
          </div>

          {/* Quick & Simple Action Buttons for Uploaded Photo */}
          {boothImage && (
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center items-center max-w-sm mx-auto w-full">
              <button 
                onClick={downloadFramedWish}
                disabled={isGeneratingBooth}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-pink-500 text-white hover:bg-white hover:text-black hover:scale-105 transition-all duration-300 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase shadow-xl disabled:opacity-50"
              >
                {isGeneratingBooth ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full animate-spin" />
                    Baking Framed Card...
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    Download Framed Wish
                  </>
                )}
              </button>
              
              <button
                onClick={resetBooth}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-stone-900 border border-white/10 hover:border-pink-500/40 text-[10px] tracking-wider font-bold tracking-[0.2em] uppercase text-stone-300 hover:text-white transition-all shadow-lg"
              >
                <Trash2 className="w-3.5 h-3.5" /> Swap Photo
              </button>
            </div>
          )}
        </div>


        {/* =========================================================================
            FEATURE 2: VISITOR INDEPENDENT HEART COLLAGE CREATOR
            ========================================================================= */}
        <div id="heart-maker-feature" className="lg:col-span-6 w-full flex flex-col justify-start">
          <div className="mb-6">
            <span className="text-[10px] tracking-[0.5em] font-bold text-luxury-gold uppercase block mb-3 font-mono">
              ✦ COLLAGE GRAPHIC STUDIO
            </span>
            <h3 className="font-serif text-3xl md:text-4xl text-white leading-tight">
              Create Your Heart Collage
            </h3>
            <p className="text-stone-400 text-xs mt-3 leading-relaxed">
              Compile your favorite moments together in a perfect heart shape. Drag & drop or multi-select **20 to 50 photos**, and we will instantly align them into a high-res, symmetrical grid ready to download!
            </p>
          </div>

          <div className="w-full bg-stone-950/80 rounded-2xl border border-white/5 p-6 shadow-2xl relative">
            
            {/* Display progress counts */}
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
              <div>
                <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">CREATION BUFFER</p>
                <p className="text-xs font-semibold text-white mt-1">
                  {collageImages.length < 20 ? (
                    <span className="text-luxury-gold animate-bounce inline-block">Upload {20 - collageImages.length} more (Requires 20-50 photos)</span>
                  ) : collageImages.length === 50 ? (
                    <span className="text-emerald-400">Perfect 50/50 photos limit reached!</span>
                  ) : (
                    <span className="text-[#D4AF37]">{collageImages.length} of 50 uploaded</span>
                  )
                }
                </p>
              </div>

              {collageImages.length > 0 && (
                <button
                  onClick={clearAllCollagePhotos}
                  className="flex items-center gap-1.5 text-[9px] font-mono tracking-widest text-stone-500 hover:text-[#fa243c] transition-colors uppercase"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear All
                </button>
              )}
            </div>

            {/* Collage input zone */}
            {collageImages.length < 50 && (
              <div 
                onClick={() => collageInputRef.current?.click()}
                className="w-full py-8 px-4 rounded-xl border-2 border-dashed border-luxury-gold/20 hover:border-luxury-gold/50 cursor-pointer bg-stone-900/30 flex flex-col items-center justify-center text-center transition-all duration-300 hover:scale-[1.01]"
              >
                <Heart className="w-9 h-9 text-luxury-gold/40 mb-3 animate-heartbeat-slow" />
                <p className="text-[11px] font-semibold text-stone-200 tracking-wider uppercase font-mono">
                  Select 20 to 50 Images
                </p>
                <p className="text-[9px] text-stone-500 mt-2">
                  Click to select multiple images simultaneously
                </p>
              </div>
            )}

            <input 
              ref={collageInputRef}
              type="file" 
              accept="image/*" 
              multiple
              className="hidden" 
              onChange={handleCollageFileChange} 
            />

            {/* Collage live thumbnail grid list */}
            {collageImages.length > 0 && (
              <div className="mt-6">
                <p className="text-[10px] font-mono text-stone-400 tracking-widest uppercase mb-3">Live Upload Pool ({collageImages.length} items):</p>
                <div className="grid grid-cols-5 xs:grid-cols-6 sm:grid-cols-8 gap-2 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                  {collageImages.map((p, idx) => (
                    <div key={p.id} className="relative aspect-square rounded-md overflow-hidden bg-stone-900 group border border-white/5">
                      <img src={p.url} alt="Collage piece preview" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeCollagePhoto(p.id)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[#fa243c] transition-opacity"
                        title="Remove image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="absolute top-0.5 left-0.5 bg-black/80 px-1 rounded text-[7px] text-stone-400 font-mono select-none">
                        {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LIVE GRID HEART PREVIEW WINDOW */}
            {collageImages.length >= 20 && (
              <div className="mt-8 pt-6 border-t border-white/5">
                <p className="text-[11px] font-mono text-luxury-gold tracking-widest uppercase mb-4 text-center">✧ LIVE HEART SHAPE GEOMETRY PREVIEW ✧</p>
                
                <div className="w-full max-w-[280px] mx-auto animate-heartbeat-slow scale-100 select-none">
                  {/* Heart Shape grid preview */}
                  <div className="grid grid-cols-11 grid-rows-10 gap-0.5 aspect-[11/10] bg-black/60 border border-white/5 p-1 rounded-xl shadow-2xl relative overflow-hidden">
                    
                    {/* Big Center Photo Preview inside Heart Creator */}
                    <div 
                      className="relative overflow-hidden border-2 border-luxury-gold/70 rounded bg-stone-900" 
                      style={{ gridRowStart: 4, gridRowEnd: 7, gridColumnStart: 5, gridColumnEnd: 8 }}
                    >
                      <img 
                        src={collageImages[0]?.url} 
                        className="w-full h-full object-cover" 
                        alt="Central Heart Collage piece" 
                      />
                    </div>

                    {/* Previews of arrayed elements around central piece */}
                    {SMALL_CELLS.map((cell, idx) => {
                      const photo = collageImages[(idx + 1) % collageImages.length];
                      return (
                        <div 
                          key={`creator-heart-grid-${idx}`}
                          className="relative aspect-square overflow-hidden border border-luxury-gold/20 rounded bg-[#0e0e10]"
                          style={{ gridRowStart: cell.r + 1, gridColumnStart: cell.c + 1 }}
                        >
                          {photo && (
                            <img 
                              src={photo.url} 
                              className="w-full h-full object-cover" 
                              alt="Heart Collage Piece preview" 
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-8 flex flex-col items-center gap-2">
                  <button 
                    onClick={downloadVisitorHeartCollage}
                    disabled={isGeneratingHeart}
                    className="flex items-center gap-2 px-8 py-3.5 bg-stone-900 hover:bg-white text-luxury-gold hover:text-black border border-luxury-gold/40 hover:border-white transition-all duration-300 rounded-full text-[10px] font-bold tracking-[0.22em] uppercase shadow-xl"
                  >
                    {isGeneratingHeart ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-luxury-gold border-t-transparent animate-spin rounded-full" />
                        Generating Collage...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 animate-pulse text-luxury-gold" />
                        Download Collage
                      </>
                    )}
                  </button>
                  <p className="text-[9px] text-stone-500 font-mono tracking-widest text-center mt-1">
                    EXPORTS HIGH-RES INDEPENDENT 2400x2200px FILE
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
