import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { 
  Heart, 
  Menu, 
  Music, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  ChevronRight, 
  ChevronLeft,
  X,
  Sparkles,
  Search,
  Download,
  Play,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { cn } from "./lib/utils";
import { useSmoothScroll } from "./hooks/useSmoothScroll";
import { LuxuryPhotoCard } from "./components/LuxuryPhotoCard";
import captionsCache from "./captions_cache.json";
import gsap from "gsap";

const STATIC_PHOTOS = Object.entries(captionsCache).map(([id, info]: [string, any]) => ({
  id,
  name: "",
  url: `https://lh3.googleusercontent.com/d/${id}=w1000`,
  dateStr: "6/11/25",
  formattedDate: "11 June 2025",
  caption: info.caption,
  type: info.type,
  poem: info.poem || "In silent thoughts, the world aligns,\nListening to the quiet call.\nEach subtle pose, a work of art,\nAnd wrapped in hope's eternal rays."
}));

const particles = Array.from({ length: 48 }).map((_, i) => {
  const angle = (i / 48) * Math.PI * 2;
  const distance = 80 + Math.random() * 45;
  return {
    id: i,
    startX: `${Math.cos(angle) * distance}vw`,
    startY: `${Math.sin(angle) * distance}vh`,
    delay: (i / 48) * 1.5,
    scale: 0.4 + Math.random() * 0.7,
  };
});

export default function App() {
  useSmoothScroll();
  const [photos, setPhotos] = useState<any[]>(STATIC_PHOTOS);
  const [isLoading, setIsLoading] = useState(true);
  const [loadPhase, setLoadPhase] = useState<"LOVE_BUILD" | "CURTAIN_SPLIT" | "PHOTO_FLASH" | "WELCOME" | "COMPLETED">("LOVE_BUILD");
  const [flashIndex, setFlashIndex] = useState(0);

  const [isMuted, setIsMuted] = useState(true);
  const [filmMuted, setFilmMuted] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);
  const [isVideoPlayed, setIsVideoPlayed] = useState(false);
  const [isAtVideoOrPast, setIsAtVideoOrPast] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [hasStoryBeenShown, setHasStoryBeenShown] = useState(false);

  const filmVideoRef = useRef<HTMLVideoElement>(null);
  const heroVideoRef = useRef<HTMLVideoElement>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      document.documentElement.style.setProperty("--x", `${e.clientX}px`);
      document.documentElement.style.setProperty("--y", `${e.clientY}px`);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Fetch photos with graceful fallback to client-side STATIC_PHOTOS on static CDNs like Netlify
  useEffect(() => {
    async function fetchPhotos() {
      try {
        const response = await fetch("/api/photos");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data && data.photos && data.photos.length > 0) {
          const poeticCaptions = [
            "Ethereal Whispers", "A Symphony of Souls", "Golden Hour Grace", 
            "Infinite Devotion", "Midnight Muse", "Crimson Sentiment",
            "Echoes of Desire", "The Texture of Time", "Silent Promises",
            "Woven in Stars", "Breath of Heaven", "Celestial Bond"
          ];
          setPhotos(data.photos.map((p: any, i: number) => {
            const cacheItem = (captionsCache as Record<string, { type: string; caption: string; poem?: string }>)[p.id];
            return {
              ...p,
              caption: cacheItem ? cacheItem.caption : (p.name?.replace(/\.[^/.]+$/, "") || poeticCaptions[i % poeticCaptions.length]),
              poem: cacheItem ? cacheItem.poem : "In silent thoughts, the world aligns,\nListening to the quiet call.\nEach subtle pose, a work of art,\nAnd wrapped in hope's eternal rays."
            };
          }));
        }
      } catch (err) {
        console.warn("API photo fetch ignored. Running in standalone static client mode with pre-populated gallery list. Details:", err);
      }
    }
    fetchPhotos();
  }, []);

  // Loading phase timers
  useEffect(() => {
    if (loadPhase === "LOVE_BUILD") {
      const timer = setTimeout(() => {
        setLoadPhase("CURTAIN_SPLIT");
      }, 2800);
      return () => clearTimeout(timer);
    }
    
    if (loadPhase === "CURTAIN_SPLIT") {
      const timer = setTimeout(() => {
        setLoadPhase("PHOTO_FLASH");
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [loadPhase]);

  // Photo flashing timer counts up to 100 fast memories
  useEffect(() => {
    if (loadPhase === "PHOTO_FLASH") {
      const interval = setInterval(() => {
        setFlashIndex((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setLoadPhase("WELCOME");
            }, 300);
            return 100;
          }
          return prev + 1;
        });
      }, 25); // Extremely fast (25ms * 100 = 2.5s total flash progression!)
      return () => clearInterval(interval);
    }
  }, [loadPhase]);

  // Curtain and welcome transitions
  useEffect(() => {
    if (loadPhase === "WELCOME") {
      const timer = setTimeout(() => {
        setLoadPhase("COMPLETED");
        setIsLoading(false);
      }, 4200);
      return () => clearTimeout(timer);
    }
  }, [loadPhase]);

  useEffect(() => {
    if (loadPhase === "COMPLETED") {
      if (filmVideoRef.current && typeof filmVideoRef.current.play === "function") {
        filmVideoRef.current.play().catch(err => {
          console.log("Automatic flow playback prevented or failed:", err);
        });
      }
      if (heroVideoRef.current) {
        heroVideoRef.current.play().catch(err => {
          console.log("Hero background video playback prevented or failed:", err);
        });
      }
    }
  }, [loadPhase]);

  useEffect(() => {
    if (loadPhase !== "COMPLETED") return;
    if (hasStoryBeenShown) return;

    const handleScroll = () => {
      if (window.scrollY > 200) {
        setIsStoryOpen(true);
        setHasStoryBeenShown(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasStoryBeenShown, loadPhase]);

  useEffect(() => {
    if (loadPhase !== "COMPLETED") return;
    const handleScrollDetection = () => {
      const videoSection = document.getElementById("films");
      if (videoSection) {
        const rect = videoSection.getBoundingClientRect();
        // Set true if the video section top is scrolled up near the viewport view
        setIsAtVideoOrPast(rect.top <= 200);
      }
    };
    window.addEventListener("scroll", handleScrollDetection, { passive: true });
    return () => window.removeEventListener("scroll", handleScrollDetection);
  }, [loadPhase]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth < 768 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      );
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleArrowNavigation = () => {
    if (isAtVideoOrPast) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const videoSection = document.getElementById("films");
      if (videoSection) {
        videoSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div className="bg-luxury-black min-h-screen text-stone-100 overflow-x-hidden">
      <div className="mouse-glow" />
      <AnimatePresence>
        {loadPhase !== "COMPLETED" && (
          <motion.div 
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="fixed inset-0 z-[100] bg-black select-none overflow-hidden flex flex-col items-center justify-center"
          >
             {/* Glowing deep background stars and message reveals behind curtains */}
             <div className="absolute inset-0 bg-[#030303] flex items-center justify-center overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.06)_0%,transparent_80%)] animate-pulse" />
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_40%,rgba(0,0,0,0.9)_100%)]" />

                {/* Rich Cinematic Welcome Backdrop */}
                {loadPhase === "WELCOME" && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 1.08 }}
                    animate={{ opacity: 0.35, scale: 1.01 }}
                    transition={{ duration: 4.2, ease: "easeOut" }}
                    className="absolute inset-0 w-full h-full"
                  >
                     {/* Breathtaking hero memory backing the welcome greeting */}
                     <img 
                       src="https://lh3.googleusercontent.com/d/1PP_dtILZBzDf_OLsPsLl-GSK1hRHYZSe=w1600"
                       className="w-full h-full object-cover filter blur-[2px] brightness-[0.7] sepia-[0.25] saturate-[0.8]"
                       referrerPolicy="no-referrer"
                       alt="Welcome Backdrop"
                     />
                     {/* Soft dark and gold overlays to seamlessly merge greeting */}
                     <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                     <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.12)_0%,transparent_75%)]" />
                  </motion.div>
                )}

                {/* Drifting delicate cinematic gold hearts or sparkles that float up during welcome */}
                {loadPhase === "WELCOME" && (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
                    {Array.from({ length: 24 }).map((_, i) => {
                      const size = 10 + (i % 3) * 8; // 10, 18, 26px
                      const duration = 6 + (i % 4) * 2; // 6, 8, 10, 12s
                      const left = 5 + (i * 4.1) % 90; // Staggered distribution 5% to 95%
                      const delay = (i % 6) * 0.7; // Staggered delays
                      
                      return (
                        <motion.div
                          key={`welcome-sparkle-${i}`}
                          initial={{ opacity: 0, y: "110%", scale: 0.5, rotate: i * 15 }}
                          animate={{ 
                            opacity: [0, 0.45, 0.45, 0], 
                            y: "-10%", 
                            scale: [0.5, 1, 1, 0.8],
                            rotate: i * 15 + 180
                          }}
                          transition={{
                            duration: duration,
                            repeat: Infinity,
                            delay: delay,
                            ease: "easeInOut"
                          }}
                          className="absolute text-luxury-gold/40 flex items-center justify-center"
                          style={{ 
                            left: `${left}%`,
                            width: size,
                            height: size 
                          }}
                        >
                          {i % 2 === 0 ? (
                            <svg className="w-full h-full fill-current" viewBox="0 0 24 24">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                          ) : (
                            <svg className="w-full h-full fill-current" viewBox="0 0 24 24">
                              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                            </svg>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
                
                {loadPhase === "WELCOME" && (
                  <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.15
                        }
                      }
                    }}
                    className="text-center px-6 relative z-10 space-y-6 max-w-4xl"
                  >
                     <motion.p 
                       variants={{
                         hidden: { opacity: 0, y: 15 },
                         visible: { opacity: 0.65, y: 0, transition: { duration: 1 } }
                       }}
                       className="text-[9px] tracking-[0.5em] text-luxury-gold uppercase block font-bold mb-4 font-mono select-none"
                     >
                        ESTABLISHED SEPTEMBER 10, 2017
                     </motion.p>
                     
                     <div className="overflow-hidden select-none">
                        <motion.h1 
                          variants={{
                            hidden: { y: "100%", opacity: 0 },
                            visible: { y: 0, opacity: 1, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } }
                          }}
                          className="font-serif text-5xl md:text-8xl italic font-light text-stone-200 leading-none tracking-wide"
                        >
                           Welcome To
                        </motion.h1>
                     </div>

                     <div className="overflow-hidden h-auto py-2 select-none">
                        <motion.h2 
                          variants={{
                            hidden: { y: "100%", scale: 1.05 },
                            visible: { y: 0, scale: 1, transition: { duration: 1.4, ease: [0.16, 1, 0.3, 1] } }
                          }}
                          className="font-serif text-6xl md:text-[8rem] luxury-text-gradient font-black tracking-tight leading-none filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                          style={{ textShadow: "0px 10px 40px rgba(212,175,55,0.15)" }}
                        >
                           Toufiq & Trisha's
                        </motion.h2>
                     </div>

                     <div className="overflow-hidden select-none">
                        <motion.h3 
                          variants={{
                            hidden: { y: "100%", opacity: 0 },
                            visible: { y: 0, opacity: 1, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } }
                          }}
                          className="font-serif text-4xl md:text-6xl text-white italic font-light tracking-[0.4em] uppercase mt-4"
                        >
                           Gallery
                        </motion.h3>
                     </div>

                     <motion.div 
                       variants={{
                         hidden: { width: 0 },
                         visible: { width: "120px", transition: { duration: 1.5, ease: "easeInOut" } }
                       }}
                       className="h-[1.5px] bg-luxury-gold/50 mx-auto mt-8" 
                     />

                     <motion.p 
                       variants={{
                         hidden: { opacity: 0, y: 15 },
                         visible: { opacity: 0.9, y: 0, transition: { duration: 1.2 } }
                       }}
                       className="font-cursive text-3xl md:text-5xl text-[#d4af37] mt-8 leading-relaxed max-w-2xl mx-auto italic select-none"
                     >
                        A celestial chronicle of two hearts, forever woven on the canvas of time.
                     </motion.p>
                  </motion.div>
                )}

                {loadPhase === "PHOTO_FLASH" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.6 }}
                    className="relative z-10 flex flex-col items-center justify-center p-8 text-center w-full max-w-xl"
                  >
                     {/* Modern 3D/Hover Perspective Ring Frame */}
                     <div className="relative w-80 h-96 border border-[#d4af37]/30 rounded-2xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)] bg-stone-950 flex flex-col justify-end transform hover:scale-[1.02] transition-all duration-500">
                        <img 
                          src={photos[flashIndex % photos.length]?.url || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80"} 
                          className="absolute inset-0 w-full h-full object-cover brightness-95 scale-105" 
                          referrerPolicy="no-referrer"
                          alt="Memory flash"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/60 z-10" />
                        
                        <div className="absolute top-6 left-0 right-0 z-20 text-center">
                           <span className="text-[9px] tracking-[0.5em] text-white/80 font-bold uppercase font-sans drop-shadow-md">PHOTOGRAPHIC ARCHIVE</span>
                        </div>

                        <div className="absolute inset-4 border border-white/10 pointer-events-none z-10" />

                        <div className="relative z-20 p-6 text-center">
                           <p className="font-mono text-[9px] text-[#d4af37] tracking-[0.4em] uppercase drop-shadow mb-1 animate-pulse">
                              COMPILING ESSENTIAL MEMORIES
                           </p>
                           <p className="font-serif text-4xl font-bold tracking-widest text-stone-100 uppercase drop-shadow-md">
                              {flashIndex} %
                           </p>
                        </div>
                     </div>

                     {/* Premium Progress Bar below */}
                     <div className="w-72 h-[1.5px] bg-white/10 rounded-full overflow-hidden mt-10 relative">
                        <div 
                          className="h-full bg-luxury-gold transition-all duration-[40ms]" 
                          style={{ width: `${flashIndex}%` }}
                        />
                     </div>
                  </motion.div>
                )}

                {loadPhase === "LOVE_BUILD" && (
                   <motion.div 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="relative z-30 flex flex-col items-center justify-center p-8 text-center w-full max-w-lg"
                   >
                     {/* Swirling luxury star and heart dust */}
                     <div className="absolute inset-0 pointer-events-none">
                        {particles.map((p) => (
                          <motion.div
                            key={p.id}
                            initial={{ x: p.startX, y: p.startY, opacity: 0, scale: p.scale }}
                            animate={{ x: 0, y: 0, opacity: [0, 1, 1, 0] }}
                            transition={{
                              delay: p.delay,
                              duration: 2.2,
                              ease: [0.25, 1, 0.5, 1]
                            }}
                            className="absolute left-1/2 top-1/2"
                          >
                             <Heart className="w-5 h-5 fill-luxury-gold text-luxury-gold/40 -translate-x-1/2 -translate-y-1/2 filter blur-[0.5px]" />
                          </motion.div>
                        ))}
                     </div>

                     {/* Massive Majestic Pulsing Heart with multiple outer orbits */}
                     <motion.div
                       animate={{
                         scale: [1, 1.08, 1],
                       }}
                       transition={{
                         repeat: Infinity,
                         duration: 1.4,
                         ease: "easeInOut"
                       }}
                       className="relative flex items-center justify-center mb-8"
                     >
                        <div className="absolute w-64 h-64 bg-luxury-gold/10 blur-[50px] rounded-full animate-pulse" />
                        
                        {/* Two glowing halos */}
                        <div className="absolute w-44 h-44 rounded-full border border-luxury-gold/20 animate-[spin_20s_linear_infinite]" />
                        <div className="absolute w-52 h-52 rounded-full border border-luxury-gold/5 animate-[spin_30s_linear_infinite_reverse]" />

                        <motion.div
                          initial={{ scale: 0.3, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="text-luxury-gold relative z-10"
                        >
                           <svg className="w-32 h-32 fill-current drop-shadow-[0_0_35px_rgba(212,175,55,0.65)]" viewBox="0 0 24 24">
                             <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                           </svg>
                        </motion.div>
                     </motion.div>

                     <span className="text-[9px] tracking-[0.5em] uppercase text-[#d4af37]/60 font-extrabold block mb-3 font-mono">
                        CONVERGING SOULS
                     </span>
                     <h1 className="font-serif text-3xl italic text-stone-200 tracking-wider">
                        Love Canvas
                     </h1>
                   </motion.div>
                )}
             </div>

             {/* Split Majestic Curtains (without harsh divider lines) */}
             <motion.div 
               animate={{ 
                 x: loadPhase === "CURTAIN_SPLIT" || loadPhase === "PHOTO_FLASH" || loadPhase === "WELCOME" ? "-100%" : "0%"
               }}
               transition={{ duration: 1.6, ease: [0.85, 0, 0.15, 1] }}
               className="absolute left-0 top-0 w-1/2 h-full bg-[#030303] z-20"
             />
             <motion.div 
               animate={{ 
                 x: loadPhase === "CURTAIN_SPLIT" || loadPhase === "PHOTO_FLASH" || loadPhase === "WELCOME" ? "100%" : "0%"
               }}
               transition={{ duration: 1.6, ease: [0.85, 0, 0.15, 1] }}
               className="absolute right-0 top-0 w-1/2 h-full bg-[#030303] z-20"
             />

             {/* Cinematic "Boom" shockwave overlay */}
             {loadPhase === "CURTAIN_SPLIT" && (
                <motion.div 
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.9 }}
                  className="absolute inset-0 bg-white z-[25] pointer-events-none mix-blend-screen"
                />
             )}
          </motion.div>
        )}
      </AnimatePresence>


      {/* Hero Section */}
      <section ref={heroRef} className="relative h-screen flex items-end justify-center pb-28 md:pb-36 overflow-hidden">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0 bg-[#060606]">
          <div className="absolute inset-0 bg-black/45 z-10" />
          
          {/* Beautiful animated luxury Ken Burns background photo */}
          <div className="absolute inset-0 overflow-hidden">
             <motion.img
               src="https://lh3.googleusercontent.com/d/1gTewT6-aZTGDC6kIPwCR-qDfHTx4VwA1=w2000"
               referrerPolicy="no-referrer"
               className="w-full h-full object-cover select-none pointer-events-none origin-center"
               animate={{
                 scale: [1.02, 1.12, 1.02],
                 x: [-12, 12, -12],
                 y: [-6, 6, -6],
               }}
               transition={{
                 duration: 28,
                 ease: "easeInOut",
                 repeat: Infinity,
               }}
             />
             {/* Luxury ambient light leak animations */}
             <motion.div 
               className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,rgba(212,175,55,0.08)_0%,transparent_70%)] mix-blend-screen pointer-events-none z-[12]"
               animate={{
                 opacity: [0.3, 0.7, 0.3],
                 scale: [1, 1.05, 1],
               }}
               transition={{
                 duration: 12,
                 ease: "easeInOut",
                 repeat: Infinity,
               }}
             />
             <motion.div 
               className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_70%,rgba(168,124,53,0.06)_0%,transparent_60%)] mix-blend-screen pointer-events-none z-[13]"
               animate={{
                 opacity: [0.4, 0.8, 0.4],
                 scale: [1.05, 1, 1.05],
               }}
               transition={{
                 duration: 16,
                 ease: "easeInOut",
                 repeat: Infinity,
               }}
             />
          </div>
          
          <div className="absolute inset-0 cinematic-overlay z-20" />
        </motion.div>

        <div className="relative z-30 text-center px-6 max-w-6xl w-full">
           <motion.div
             initial="hidden"
             animate="visible"
             variants={{
               hidden: {},
               visible: {
                 transition: {
                   staggerChildren: 0.08,
                   delayChildren: 0.5
                 }
               }
             }}
             className="relative"
           >


              {/* Tagline category */}
              <motion.p 
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: { opacity: 1, y: 0, transition: { duration: 1.2 } }
                }}
                className="text-[10px] tracking-[0.7em] font-extrabold text-luxury-gold uppercase mb-8 flex items-center justify-center gap-4 font-mono select-none"
              >
                 <span className="w-12 h-[1px] bg-gradient-to-r from-transparent to-luxury-gold" />
                 Happy Anniversary My Love
                 <span className="w-12 h-[1px] bg-gradient-to-l from-transparent to-luxury-gold" />
              </motion.p>
              
              {/* Cinematic Names */}
              <div className="flex flex-col items-center select-none">
                 <h1 className="text-6xl sm:text-7xl md:text-[8.5rem] lg:text-[10.5rem] font-serif font-black italic tracking-tighter leading-[0.85] text-white flex flex-wrap justify-center items-center gap-x-6 md:gap-x-12">
                   <motion.span
                     className="block"
                     variants={{
                       hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
                       visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 1.4, ease: [0.16, 1, 0.3, 1] } }
                     }}
                   >
                     Toufiq
                   </motion.span>
                   <motion.span
                     className="font-cursive text-5xl md:text-8xl text-luxury-gold my-2 md:my-0 flex items-center justify-center"
                     variants={{
                       hidden: { opacity: 0, scale: 0.6, rotate: -20 },
                       visible: { opacity: 1, scale: 1, rotate: 0, transition: { duration: 1.6, ease: "easeOut" } }
                     }}
                   >
                     &
                   </motion.span>
                   <motion.span
                     className="block mr-2"
                     variants={{
                       hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
                       visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 1.4, ease: [0.16, 1, 0.3, 1] } }
                     }}
                   >
                     Trisha's
                   </motion.span>
                 </h1>

                 {/* Dramatic Gallery word revelation */}
                 <div className="overflow-hidden mt-4 md:mt-6 mb-10 py-1">
                    <motion.h2
                      variants={{
                        hidden: { y: "100%", opacity: 0 },
                        visible: { y: 0, opacity: 1, transition: { duration: 1.6, ease: [0.16, 1, 0.3, 1] } }
                      }}
                      className="font-serif text-3xl md:text-5xl lg:text-6xl text-stone-200 tracking-[0.4em] uppercase font-light pl-[0.4em]"
                    >
                      Gallery
                    </motion.h2>
                 </div>
              </div>

              {/* Subtitle bottom elegant cursive line */}
              <motion.p
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: { opacity: 0.9, y: 0, transition: { duration: 1.4 } }
                }}
                className="font-cursive text-3xl md:text-5xl text-stone-300 md:text-stone-400 rotate-[-1deg] max-w-2xl mx-auto leading-relaxed select-none"
              >
                "A canvas of heartbeat, painted on the silk of eternal time."
              </motion.p>
           </motion.div>
        </div>


        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 animate-bounce">
           <div className="w-[1px] h-8 bg-white/30" />
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-24 px-4 md:px-8 lg:px-12 overflow-hidden">
        <div className="w-full">
           <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-24 max-w-7xl mx-auto">
              <div className="max-w-md">
                 <h2 className="font-serif text-4xl md:text-5xl italic mb-6">Fragments of Pure Light</h2>
                 <p className="text-stone-500 font-light leading-relaxed">
                   In the luxury of stillness, we find the most profound stories. Each frame is a love letter to the moments that define our existence. Curated with intentional grace.
                 </p>
              </div>
              <div className="flex items-center gap-3">
                 <Sparkles className="w-5 h-5 text-luxury-gold animate-pulse" />
              </div>
           </div>

           {/* Dynamic Bento & Masonry Mix */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 grid-flow-row-dense">
              {photos.map((photo, i) => (
                <LuxuryPhotoCard 
                  key={photo.id} 
                  url={photo.url} 
                  caption={photo.caption} 
                  index={i}
                  initialAspect={i % 7 === 0 || i % 10 === 0 ? "landscape" : "portrait"}
                  variant={i % 5 === 0 ? "floating" : i % 3 === 0 ? "polaroid" : "editorial"}
                  className="mb-0"
                  onClick={() => setSelectedPhoto(photo)}
                />
              ))}
           </div>
        </div>
      </section>

      {/* Films Section (Cinema Showcase) */}
      <section id="films" className="py-32 px-4 md:px-8 lg:px-12 bg-black border-y border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05)_0%,transparent_70%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto flex flex-col items-center">
           <div className="text-center max-w-xl mb-16 space-y-4">
              <span className="text-[10px] tracking-[0.5em] font-bold text-luxury-gold uppercase flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" /> Toufiq's Presents
              </span>
              <h2 className="font-serif text-4xl md:text-6xl italic text-white leading-tight">Experience the Trailer of Our Togetherness</h2>
           </div>

           {/* Widescreen Theater Frame */}
           <div className={cn(
             "relative w-full aspect-video max-w-5xl bg-stone-950 overflow-hidden luxury-shadow group",
             isMobile ? "border-0 rounded-none" : "border border-white/10 rounded-2xl"
           )}>
              {/* High-fidelity Google Drive Player with universal codec support directly embedded */}
              {!isVideoPlayed ? (
                <div 
                  onClick={() => {
                    setIsVideoPlayed(true);
                  }}
                  className="absolute inset-0 w-full h-full z-20 cursor-pointer group/poster overflow-hidden bg-stone-950 flex items-center justify-center animate-fade-in"
                >
                   {/* Exquisite real photo cover with vignette style */}
                   <img 
                     src="https://lh3.googleusercontent.com/d/1PP_dtILZBzDf_OLsPsLl-GSK1hRHYZSe=w1200" 
                     className="w-full h-full object-cover brightness-[0.55] group-hover/poster:scale-105 group-hover/poster:brightness-[0.45] transition-all duration-1000 ease-out"
                     referrerPolicy="no-referrer"
                     alt="Experience the Trailer of Our Togetherness Thumbnail"
                   />
                   
                   {/* Beautiful center Play Button badge */}
                   <div className="absolute inset-0 flex flex-col items-center justify-center p-6 space-y-6 bg-gradient-to-t from-black via-black/30 to-transparent">
                     <div className="relative flex items-center justify-center">
                        {/* Glowing outer aura */}
                        <div className="absolute -inset-4 rounded-full bg-luxury-gold/20 blur-md group-hover/poster:bg-luxury-gold/40 group-hover/poster:scale-110 transition-all duration-500 animate-pulse" />
                        
                        {/* Elegant Golden Circle with Play icon */}
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-luxury-gold/40 bg-stone-950/80 flex items-center justify-center text-luxury-gold shadow-2xl relative z-10 group-hover/poster:border-luxury-gold group-hover/poster:scale-105 transition-all duration-500">
                          <Play className="w-6 h-6 md:w-8 md:h-8 fill-current translate-x-0.5" />
                        </div>
                     </div>
                     
                     <div className="text-center relative z-10 select-none space-y-2">
                       <span className="text-xs md:text-sm tracking-[0.6em] font-extrabold text-luxury-gold uppercase block">PLAY TRAILER</span>
                       <span className="text-[9px] tracking-[0.3em] font-medium text-stone-300 mt-2 block uppercase opacity-80">DURATION: 2M 30S  •  ORIGINAL AUDIO COVERAGE</span>
                     </div>
                   </div>

                   {/* Subtitles / Credits Overlay at the bottom */}
                   <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-between items-end border-t border-white/5 pt-4 text-[9px] tracking-[0.2em] font-mono text-stone-400">
                     <span>FILM ARCHIVE // HD STREAMING</span>
                     <span className="text-luxury-gold font-bold">TOUFIQ'S PRESENTS</span>
                   </div>
                </div>
              ) : (
                <iframe
                  src="https://drive.google.com/file/d/1ZExmJpxgtOL41uDdQ3dS1VfSij-IyzH1/preview?autoplay=1"
                  className="w-full h-full border-0 absolute inset-0 z-10"
                  allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Experience the Trailer of Our Togetherness"
                />
              )}



              {/* Dynamic decorative cinematic overlay gradient */}
              {!isMobile && (
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-0" />
              )}
           </div>
        </div>
      </section>

      {/* Cinematic About Section */}
      <section id="about" className="py-32 px-8 bg-[#080808]">
        <div className="max-w-4xl mx-auto space-y-16">
           <div className="text-center space-y-4">
              <span className="text-[10px] tracking-[0.4em] font-bold text-luxury-gold uppercase">The Origin Story</span>
              <h2 className="font-serif text-4xl md:text-6xl italic leading-none">A Journey of Two Souls</h2>
           </div>

           <div className="space-y-12 text-stone-300 font-light text-xl leading-relaxed font-serif">
              <motion.p 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 className="first-letter:text-7xl first-letter:font-black first-letter:text-luxury-gold first-letter:mr-3 first-letter:float-left italic"
              >
                Toufiq and Trisha’s journey began in the most unexpected of places—a classroom of shared struggles, bound together by the common thread of academic retakes. What started as a friendship forged in the fires of failure soon blossomed into a sanctuary of shared smiles and silent understanding.
              </motion.p>
              
              <div className="py-8 border-y border-white/5 text-center">
                 <p className="font-cursive text-4xl text-luxury-gold opacity-80 leading-snug">"Two souls, one destiny, found in the quiet corners of a classroom."</p>
              </div>

              <motion.p 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 className="italic"
              >
                On September 10th, 2017, underneath a sky full of hope, Toufiq proposed to Trisha, and a new chapter was written. Their relation began, facing a tempest of ups and downs, happiness, quarrels, and battles that only strengthened their bond.
              </motion.p>

              <div className="py-8 border-y border-white/5 text-center">
                 <p className="font-cursive text-4xl text-luxury-gold opacity-80 leading-snug">"Miles apart, yet close enough to hear each other's whispers."</p>
              </div>

              <motion.p 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 className="italic"
              >
                Through the tempest of distance as Toufiq pursued higher studies abroad, their love remained a steady compass. They braved the storms of doubt and the silence of a long-distance relationship, proving that hearts beat in sync regardless of the miles between them.
              </motion.p>

              <div className="py-8 border-y border-white/5 text-center">
                 <p className="font-cursive text-4xl text-luxury-gold opacity-80 leading-snug">"The greatest battles aren't fought with swords, but with the courage to stay together."</p>
              </div>

              <motion.p 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 className="italic"
              >
                Finally, on June 11th, 2025, amidst the delicate dance of family and tradition, they stood firm in their conviction. They convinced their families and proved their love was unbreakable. They got married in a dramatic yet beautiful ceremony, sealing a promise made years ago.
              </motion.p>
           </div>
        </div>
      </section>

      {/* Infinite Horizontal Gallery */}
      <section className="py-24 border-y border-white/5 overflow-hidden space-y-10 bg-black">
         {/* Row 1: Right to Left */}
         <div className="w-full overflow-hidden">
            <div className="flex gap-10 w-max animate-[scroll-left_45s_linear_infinite] hover:[animation-play-state:paused]">
               {photos.slice(0, 15).map((p, i) => (
                 <div key={`ticker-1-${i}`} className="w-[280px] aspect-video flex-shrink-0 relative overflow-hidden rounded-lg border border-white/10 shadow-lg">
                    <img src={p.url} className="w-full h-full object-cover brightness-90 hover:brightness-100 transition-all duration-300" referrerPolicy="no-referrer" />
                 </div>
               ))}
               {/* Repeat for seamless loop */}
               {photos.slice(0, 15).map((p, i) => (
                 <div key={`ticker-s1-rep-${i}`} className="w-[280px] aspect-video flex-shrink-0 relative overflow-hidden rounded-lg border border-white/10 shadow-lg">
                    <img src={p.url} className="w-full h-full object-cover brightness-90 hover:brightness-100 transition-all duration-300" referrerPolicy="no-referrer" />
                 </div>
               ))}
            </div>
         </div>

         {/* Row 2: Left to Right */}
         <div className="w-full overflow-hidden">
            <div className="flex gap-10 w-max animate-[scroll-right_45s_linear_infinite] hover:[animation-play-state:paused]">
               {photos.slice(15, 30).map((p, i) => (
                 <div key={`ticker-2-${i}`} className="w-[280px] aspect-video flex-shrink-0 relative overflow-hidden rounded-lg border border-white/10 shadow-lg">
                    <img src={p.url} className="w-full h-full object-cover brightness-90 hover:brightness-100 transition-all duration-300" referrerPolicy="no-referrer" />
                 </div>
               ))}
               {/* Repeat for seamless loop */}
               {photos.slice(15, 30).map((p, i) => (
                 <div key={`ticker-s2-rep-${i}`} className="w-[280px] aspect-video flex-shrink-0 relative overflow-hidden rounded-lg border border-white/10 shadow-lg">
                    <img src={p.url} className="w-full h-full object-cover brightness-90 hover:brightness-100 transition-all duration-300" referrerPolicy="no-referrer" />
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* Lightbox / Fullscreen Viewer */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-luxury-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-6 lg:p-20 overflow-y-auto"
          >
             <button 
               onClick={() => setSelectedPhoto(null)} 
               className="fixed top-4 right-4 md:top-10 md:right-10 p-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-[120]"
             >
                <X className="w-6 h-6" />
             </button>
             
             <div className="relative w-full h-full flex flex-col lg:flex-row gap-6 md:gap-12 items-center justify-start lg:justify-center pt-16 lg:pt-0">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full h-[60vh] lg:h-auto lg:flex-1 flex-shrink-0 flex items-center justify-center"
                >
                   <img 
                    src={selectedPhoto.url} 
                   referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain shadow-[0_0_100px_rgba(212,175,55,0.2)] rounded-lg" 
                    alt="Selected" 
                   />
                </motion.div>
                
                <motion.div 
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="w-full lg:w-96 text-center lg:text-left space-y-6 flex-shrink-0 pb-12 lg:pb-0"
                >
                   <p className="text-[11px] tracking-[0.5em] text-luxury-gold uppercase font-bold">The Sentiment</p>
                   <h2 className="font-serif text-5xl lg:text-7xl italic leading-none">{selectedPhoto.caption}</h2>
                   <div className="w-20 h-1 bg-luxury-gold mx-auto lg:mx-0" />
                   {selectedPhoto.poem && (
                     <div className="space-y-2 py-4 border-t border-b border-white/5 my-6">
                       {selectedPhoto.poem.split("\n").map((line: string, idx: number) => (
                         <p key={idx} className="text-stone-300 font-serif text-base italic leading-relaxed tracking-wide">
                           {line}
                         </p>
                       ))}
                     </div>
                   )}
                   <div className="flex gap-4 pt-6 justify-center lg:justify-start">
                      <button className="flex items-center gap-2 px-8 py-4 bg-stone-900 border border-luxury-gold/30 rounded-full text-[10px] font-bold tracking-widest uppercase hover:bg-white hover:text-black transition-all">
                        <Heart className="w-4 h-4 fill-current" /> Save
                      </button>
                      <a 
                        href={`https://lh3.googleusercontent.com/d/${selectedPhoto.id}=w2000`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-8 py-4 bg-luxury-gold text-luxury-black rounded-full text-[10px] font-bold tracking-widest uppercase hover:bg-white hover:text-black transition-all active:scale-95 shadow-lg shadow-luxury-gold/25"
                      >
                        <Download className="w-4 h-4" /> Download Original (HD)
                      </a>
                   </div>
                </motion.div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isStoryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 overflow-hidden"
          >
            {/* Backdrop click to close */}
            <div className="absolute inset-0 cursor-pointer" onClick={() => setIsStoryOpen(false)} />

            {/* Transparent side-festive particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
              {Array.from({ length: 32 }).map((_, i) => (
                <motion.div
                  key={`confetti-${i}`}
                  className="absolute"
                  style={{
                    left: i % 2 === 0 ? `${Math.random() * 20}%` : `${80 + Math.random() * 20}%`,
                    top: `-${Math.random() * 20}%`,
                  }}
                  animate={{
                    y: ["0vh", "115vh"],
                    x: ["0px", `${(Math.random() - 0.5) * 80}px`],
                    rotate: [0, 360],
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{
                    duration: Math.random() * 5 + 5,
                    repeat: Infinity,
                    delay: Math.random() * 4,
                    ease: "linear",
                  }}
                >
                  {i % 4 === 0 ? (
                    <Sparkles className="w-5 h-5 text-luxury-gold animate-pulse" />
                  ) : i % 4 === 1 ? (
                    <Heart className="w-4 h-4 fill-rose-500 text-rose-500 scale-90" />
                  ) : i % 4 === 2 ? (
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <span className="text-luxury-gold text-lg font-serif">✦</span>
                  )}
                </motion.div>
              ))}

              {Array.from({ length: 16 }).map((_, i) => (
                <motion.div
                  key={`star-${i}`}
                  className="absolute rounded-full"
                  style={{
                    width: `${Math.random() * 4 + 2}px`,
                    height: `${Math.random() * 4 + 2}px`,
                    backgroundColor: "#d4af37",
                    boxShadow: "0 0 10px #d4af37, 0 0 20px #d4af37",
                    left: i % 2 === 0 ? `${Math.random() * 12}%` : `${88 + Math.random() * 12}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    opacity: [0.2, 1, 0.2],
                    scale: [0.8, 1.4, 0.8],
                  }}
                  transition={{
                    duration: Math.random() * 2 + 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>

            {/* Central Luxe Card */}
            <motion.div
              initial={{ scale: 0.92, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="relative w-full max-w-3xl bg-[#0a0a09]/95 border border-[#d4af37]/30 rounded-3xl p-6 md:p-10 shadow-[0_0_80px_rgba(212,175,55,0.25)] flex flex-col max-h-[90vh] z-20 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header inside popup */}
              <div className="text-center pb-6 border-b border-luxury-gold/10 select-none relative">
                 <button 
                   onClick={() => setIsStoryOpen(false)} 
                   className="absolute top-0 right-0 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-stone-300 hover:text-luxury-gold border border-white/10 transition-colors z-[120]"
                   aria-label="Close Love Story"
                 >
                    <X className="w-5 h-5" />
                 </button>

                 <span className="text-[10px] tracking-[0.6em] font-bold text-luxury-gold uppercase flex items-center justify-center gap-2 mb-3 font-mono">
                    <Sparkles className="w-4 h-4 text-luxury-gold animate-pulse" /> HAPPY 1ST ANNIVERSARY
                 </span>
                 <h2 className="font-serif text-4xl md:text-5xl italic text-stone-100 font-light luxury-text-gradient font-black">Our Love Story</h2>
                 <p className="font-sans text-[11px] tracking-[0.2em] text-stone-400 uppercase mt-2">Toufiq & Trisha’s Chronicle</p>
                 <div className="w-16 h-[1px] bg-luxury-gold/30 mx-auto mt-4" />
              </div>

              {/* Scrollable Story Content */}
              <div className="flex-1 overflow-y-auto pr-2 md:pr-4 py-8 space-y-12 scrollbar-thin scrollbar-thumb-luxury-gold/35 scrollbar-track-transparent">
                <div className="space-y-12 text-stone-300 font-light text-base md:text-lg leading-relaxed font-serif text-center md:text-left">
                  {/* Part 1 */}
                  <div className="space-y-4">
                     <p className="first-letter:text-5xl first-letter:font-black first-letter:text-luxury-gold first-letter:mr-3 first-letter:float-left italic">
                        Toufiq and Trisha’s journey began in the most unexpected of places—a classroom of shared struggles, bound together by the common thread of academic retakes. What started as a friendship forged in the academic fires of failure soon blossomed into a sanctuary of shared smiles, slow whispers, and silent understanding, proving that sometimes the best routes are discovered when we get a little lost.
                     </p>
                     <div className="my-6 py-5 border-y border-[#d4af37]/10 bg-white/[0.01] rounded-lg">
                        <p className="font-serif text-base md:text-lg text-luxury-gold leading-relaxed italic text-center whitespace-pre-line tracking-wide font-medium">
                           In dusty halls where futures seemed so bleak,
                           We found a silent language, soft and sweet.
                           A classroom of defeats became our home,
                           Where two lost souls would never walk alone.
                        </p>
                     </div>
                  </div>

                  {/* Part 2 */}
                  <div className="space-y-4">
                     <p className="italic">
                        On September 10th, 2017, underneath a sky full of hope, Toufiq proposed to Trisha, and a new chapter was written. Their relationship began, facing a tempest of ups and downs, happiness, quarrels, and battles that only strengthened their bond, showing that love isn't about avoiding the storm, but learning to dance together in the rain.
                     </p>
                     <div className="my-6 py-5 border-y border-[#d4af37]/10 bg-white/[0.01] rounded-lg">
                        <p className="font-serif text-base md:text-lg text-luxury-gold leading-relaxed italic text-center whitespace-pre-line tracking-wide font-medium">
                           Under a canopy of starlit gold,
                           A promise whispered, sweet and bold.
                           Through stormy winds and quiet, falling tears,
                           Our hands held tight throughout the passing years.
                        </p>
                     </div>
                  </div>

                  {/* Part 3 */}
                  <div className="space-y-4">
                     <p className="italic">
                        As Toufiq pursued higher studies abroad, they faced the tempest of distance. They braved the storms of doubt and the cold silence of a long-distance relationship, proving that hearts beat in perfect synchrony regardless of how many oceans lie between them.
                     </p>
                     <div className="my-6 py-5 border-y border-[#d4af37]/10 bg-white/[0.01] rounded-lg">
                        <p className="font-serif text-base md:text-lg text-luxury-gold leading-relaxed italic text-center whitespace-pre-line tracking-wide font-medium">
                           A thousand miles of oceans wild and deep,
                           Could never steal the promise that we keep.
                           For in the quiet heartbeat of the night,
                           Your love remains my steady, guiding light.
                        </p>
                     </div>
                  </div>

                  {/* Part 4 */}
                  <div className="space-y-4">
                     <p className="italic">
                        Finally, on June 11th, 2025, amidst the delicate dance of family, tradition, and unwavering faith, they stood firm in their conviction. They convinced their families and proved their love was unbreakable, sealing a promise made years ago in a dramatic yet beautiful wedding ceremony.
                     </p>
                     <div className="my-6 py-5 border-y border-[#d4af37]/10 bg-white/[0.01] rounded-lg">
                        <p className="font-serif text-base md:text-lg text-luxury-gold leading-relaxed italic text-center whitespace-pre-line tracking-wide font-medium">
                           The storms subsided and the shadows cleared,
                           To welcome in the day we had revered.
                           With sacred vows beneath a warm solstice,
                           We signed our names upon eternal bliss.
                        </p>
                     </div>
                  </div>
                </div>

                {/* Anniversary Ode */}
                <div className="pt-10 border-t border-luxury-gold/10 flex flex-col items-center p-2">
                  <span className="text-[10px] tracking-[0.5em] font-extrabold text-[#d4af37] uppercase mb-4 font-mono">1ST ANNIVERSARY ODE</span>
                  <div className="text-center font-serif text-base md:text-lg text-stone-100 italic space-y-4 w-full max-w-xl px-4 py-8 bg-black/60 border border-[#d4af37]/10 rounded-xl relative shadow-xl">
                     <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#050505] border border-luxury-gold/30 rounded-full px-4 py-0.5 text-[8px] tracking-[0.3em] uppercase text-luxury-gold font-bold font-mono">
                        ETERNAL ANCHOR
                     </div>
                     <p className="leading-relaxed">One year has passed since we became as one,</p>
                     <p className="leading-relaxed">A golden circle spinning round the sun.</p>
                     <p className="leading-relaxed">Through counting days and nights of tender grace,</p>
                     <p className="leading-relaxed">I find my heaven in your warm embrace.</p>
                     <p className="leading-relaxed text-luxury-gold font-medium font-cursive text-2.5xl md:text-3xl py-1">Happy Anniversary, my heart, my soul,</p>
                     <p className="leading-relaxed">The half that made this wandering spirit whole.</p>
                     <p className="leading-relaxed font-light text-stone-300">No wealth of kings, no diamond shining bright,</p>
                     <p className="leading-relaxed font-light text-stone-300">Can match the warmth of your celestial light.</p>
                     <p className="leading-relaxed font-light text-stone-300">To many more, through valleys high and low,</p>
                     <p className="leading-relaxed font-light text-stone-300">Wherever winds of destiny may blow,</p>
                     <p className="leading-relaxed font-light text-stone-300">Our timeless canvas sits in silent grace,</p>
                     <p className="leading-relaxed font-light text-[#d4af37]/70">Forever woven in a soft embrace.</p>
                  </div>
                </div>
              </div>

              {/* Enter Button at bottom */}
              <div className="text-center pt-6 border-t border-luxury-gold/10 select-none">
                 <button
                   onClick={() => setIsStoryOpen(false)}
                   className="px-10 py-3 bg-[#111111] hover:bg-white text-luxury-gold hover:text-black border border-[#d4af37]/30 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all active:scale-95 shadow-lg"
                 >
                    Explore Gallery &amp; Photos
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="py-24 px-8 border-t border-white/5 bg-[#050505] relative">
         <div className="max-w-7xl mx-auto flex flex-col items-center gap-12">
            <div className="text-center">
               <h1 className="font-serif text-5xl italic luxury-text-gradient tracking-tighter mb-4">Toufiq & Trisha</h1>
               <p className="text-[9px] tracking-[0.4em] font-bold text-stone-700 uppercase mt-4 italic">© 2026 Toufiq & Trisha's Gallery / Love Canvas</p>
            </div>
            
            <div className="text-center flex flex-col items-center max-w-lg">
               <div className="relative group/cheer select-none mb-6">
                  <motion.p 
                    animate={{ 
                      scale: [1, 1.05, 1],
                      rotate: [0, -0.5, 0.5, 0]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                    className="font-cursive text-5xl text-luxury-gold leading-none drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                  >
                    Happy Anniversary
                  </motion.p>
                  {/* Floating cheer hearts rising from the text */}
                  <div className="absolute inset-x-0 -top-8 flex justify-center gap-12 pointer-events-none h-12 overflow-hidden">
                    {[1, 2, 3, 4].map((idx) => (
                      <motion.div
                        key={`cheer-heart-${idx}`}
                        initial={{ opacity: 0, y: 30, scale: 0.5 }}
                        animate={{ 
                          opacity: [0, 1, 1, 0], 
                          y: [20, -20], 
                          scale: [0.5, 1, 0.7],
                          rotate: [0, idx * 15 - 30] 
                        }}
                        transition={{
                          duration: 2 + idx * 0.5,
                          repeat: Infinity,
                          delay: idx * 0.4,
                          ease: "easeOut"
                        }}
                        className="text-luxury-gold/50"
                      >
                        <Heart className="w-3.5 h-3.5 fill-current" />
                      </motion.div>
                    ))}
                  </div>
               </div>
               <motion.div 
                 initial={{ width: 0 }}
                 whileInView={{ width: "100%" }}
                 className="h-[1.5px] bg-luxury-gold/40"
               />
               <p className="font-serif italic text-stone-600 text-[11px] mt-6 tracking-[0.2em] uppercase">To be continued for new collection...</p>
            </div>
         </div>
         {/* Small photo counter on the right corner of the end side */}
         <div className="absolute bottom-6 right-8 text-[10px] font-mono text-stone-600 tracking-wider">
            N°{photos.length}
         </div>
      </footer>

       {/* Floating Navigation Arrow Button */}
       {loadPhase === "COMPLETED" && (
         <motion.button
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           onClick={handleArrowNavigation}
           className="fixed bottom-8 right-8 z-[80] flex items-center justify-center w-12 h-12 rounded-full border border-[#d4af37]/30 bg-black/90 text-luxury-gold shadow-[0_0_20px_rgba(212,175,55,0.2)] backdrop-blur transition-all duration-300 hover:border-[#d4af37] hover:scale-110 active:scale-95 group cursor-pointer"
           title={isAtVideoOrPast ? "Back to Home" : "Go to Cinematic Film"}
         >
           {isAtVideoOrPast ? (
             <ArrowUp className="w-5 h-5 transition-transform duration-500 group-hover:-translate-y-1" />
           ) : (
             <ArrowDown className="w-5 h-5 transition-transform duration-500 group-hover:translate-y-1" />
           )}
         </motion.button>
       )}

       {/* CSS for custom animations */}
       <style>{`
         @keyframes scroll-left {
           0% { transform: translateX(0); }
           100% { transform: translateX(-50%); }
         }
         @keyframes scroll-right {
           0% { transform: translateX(-50%); }
           100% { transform: translateX(0); }
         }
       `}</style>
    </div>
  );
}
