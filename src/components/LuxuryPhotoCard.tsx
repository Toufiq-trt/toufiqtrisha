import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { Heart } from "lucide-react";

interface LuxuryPhotoCardProps {
  url: string;
  caption: string;
  index: number;
  className?: string;
  variant?: "polaroid" | "editorial" | "floating";
  initialAspect?: "portrait" | "landscape";
  onClick?: () => void;
}

export function LuxuryPhotoCard({ 
  url, 
  caption, 
  index, 
  className, 
  variant = "editorial", 
  initialAspect = "portrait",
  onClick 
}: LuxuryPhotoCardProps) {
  const [aspect, setAspect] = useState<"portrait" | "landscape">(initialAspect);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth > naturalHeight) {
      setAspect("landscape");
    } else {
      setAspect("portrait");
    }
  };

  if (hasError) return null;

  const isLandscape = aspect === "landscape";

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1.2, delay: (index % 5) * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative group cursor-none md:cursor-pointer", 
        isLandscape ? "md:col-span-2" : "col-span-1",
        className
      )}
      onClick={onClick}
    >
      {variant === "polaroid" && (
        <div className="bg-[#fffdfa] p-4 pb-12 shadow-[20px_20px_50px_rgba(0,0,0,0.5)] -rotate-3 group-hover:rotate-0 transition-all duration-1000 ease-out border border-stone-200">
           <div className={cn("overflow-hidden mb-6 relative", isLandscape ? "aspect-video" : "aspect-square")}>
              <img 
                src={url} 
                onLoad={handleImageLoad}
                onError={() => setHasError(true)}
                className="w-full h-full object-cover sepia-[0.3] brightness-90 group-hover:sepia-0 group-hover:brightness-100 transition-all duration-1000" 
                alt={caption} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent p-4 flex items-end justify-end">
                 <Heart className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
           </div>
           <p className="font-cursive text-stone-800 text-3xl text-center leading-none tracking-tight hidden md:block">{caption}</p>
        </div>
      )}

      {variant === "editorial" && (
        <div className={cn("relative overflow-hidden border border-white/5 group", isLandscape ? "aspect-video" : "aspect-[3/4]")}>
          <motion.img 
            whileHover={{ scale: 1.15 }}
            transition={{ duration: 2, ease: "easeOut" }}
            src={url} 
            onLoad={handleImageLoad}
            onError={() => setHasError(true)}
            className="w-full h-full object-cover transition-all object-center group-hover:brightness-110" 
            alt={caption} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-luxury-black via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-all duration-700 flex flex-col justify-end p-10 translate-y-4 group-hover:translate-y-0 hidden md:flex">
            <p className="text-[10px] tracking-[0.4em] font-bold text-luxury-gold uppercase mb-2">Moments of Grace</p>
            <h3 className="font-serif italic text-3xl text-white mb-4 leading-tight">{caption}</h3>
            <div className="w-8 h-[1px] bg-luxury-gold group-hover:w-24 transition-all duration-700" />
          </div>
        </div>
      )}

      {variant === "floating" && (
        <div className="relative group p-6">
           <motion.div
             animate={{ 
               y: [0, -25, 0],
               rotate: [-1, 1, -1]
             }}
             transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: index * 0.3 }}
             className="relative z-10"
           >
              <div className="relative overflow-hidden rounded-sm luxury-shadow">
                <img 
                  src={url} 
                  onLoad={handleImageLoad}
                  onError={() => setHasError(true)}
                  className={cn("w-full object-cover", isLandscape ? "aspect-video" : "aspect-[4/5]")} 
                  alt={caption} 
                />
                <div className="absolute inset-0 border-[20px] border-white/5 mix-blend-overlay" />
              </div>
              
              <div className="absolute -bottom-10 -right-4 z-20 glass p-6 max-w-[240px] opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-10 group-hover:translate-y-0 shadow-2xl hidden md:block">
                 <p className="font-serif text-[11px] uppercase tracking-[0.3em] text-luxury-gold font-bold mb-2">Editorial Memo</p>
                 <p className="text-sm leading-relaxed italic text-stone-200">{caption}</p>
              </div>
           </motion.div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-luxury-gold/5 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />
        </div>
      )}
    </motion.div>
  );
}
