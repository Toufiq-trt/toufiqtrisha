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
        <div className="bg-gradient-to-b from-stone-900 to-stone-950 p-3.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] -rotate-1 group-hover:rotate-0 group-hover:scale-[1.03] transition-all duration-[0.8s] ease-out border border-luxury-gold/30 group-hover:border-luxury-gold/60 rounded-sm">
           <div className={cn("overflow-hidden relative border border-luxury-gold/20 p-1.5 bg-black/50 rounded-sm", isLandscape ? "aspect-video" : "aspect-square")}>
              <img 
                src={url} 
                onLoad={handleImageLoad}
                onError={() => setHasError(true)}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover brightness-[0.9] contrast-[1.05] group-hover:brightness-100 transition-all duration-1000 rounded-[1px]" 
                alt={caption} 
              />
              {/* Royal double gold inner borders */}
              <div className="absolute inset-3 pointer-events-none border border-luxury-gold/15 group-hover:border-luxury-gold/45 transition-all duration-700" />
              <div className="absolute inset-4 pointer-events-none border border-current text-luxury-gold/10 group-hover:text-luxury-gold/20 transition-all duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent p-4 flex items-end justify-end">
                 <Heart className="w-4 h-4 text-luxury-gold/90 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
           </div>
        </div>
      )}

      {variant === "editorial" && (
        <div className={cn(
          "relative overflow-hidden border-2 border-luxury-gold/25 bg-stone-950 p-3.5 shadow-[0_35px_80px_-25px_rgba(0,0,0,0.95)] group transition-all duration-[0.8s] ease-out hover:scale-[1.02] hover:border-luxury-gold/60 rounded-sm", 
          isLandscape ? "aspect-video" : "aspect-[3/4]"
        )}>
          {/* Inner fine-art frame lines overlaying the image with royal gold spacing */}
          <div className="absolute inset-7 pointer-events-none z-10 border border-white/[0.08] group-hover:border-luxury-gold/40 transition-all duration-1000 group-hover:inset-6" />
          <div className="absolute inset-[25px] pointer-events-none z-10 border border-luxury-gold/20 group-hover:border-luxury-gold/50 transition-all duration-1000" />
          
          {/* Royal Vintage Calligraphy corner brackets */}
          <div className="absolute top-5 left-5 w-3.5 h-3.5 border-t-2 border-l-2 border-luxury-gold/40 z-10 group-hover:border-luxury-gold transition-colors duration-700" />
          <div className="absolute top-5 right-5 w-3.5 h-3.5 border-t-2 border-r-2 border-luxury-gold/40 z-10 group-hover:border-luxury-gold transition-colors duration-700" />
          <div className="absolute bottom-5 left-5 w-3.5 h-3.5 border-b-2 border-l-2 border-luxury-gold/40 z-10 group-hover:border-luxury-gold transition-colors duration-700" />
          <div className="absolute bottom-5 right-5 w-3.5 h-3.5 border-b-2 border-r-2 border-luxury-gold/40 z-10 group-hover:border-luxury-gold transition-colors duration-700" />

          {/* High brightness & contrast hover highlight */}
          <div className="w-full h-full overflow-hidden relative rounded-[1px] border border-white/5">
            <motion.img 
              whileHover={{ scale: 1.06 }}
              transition={{ duration: 1.8, ease: "easeOut" }}
              src={url} 
              onLoad={handleImageLoad}
              onError={() => setHasError(true)}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover brightness-[0.88] contrast-[1.03] group-hover:brightness-105 transition-all duration-1000 object-center" 
              alt={caption} 
            />
            {/* Soft royal golden vignette cover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none group-hover:from-black/10 transition-all duration-1000" />
          </div>
        </div>
      )}

      {variant === "floating" && (
        <div className="relative group p-6">
           <motion.div
             animate={{ 
               y: [0, -18, 0],
               rotate: [-0.5, 0.5, -0.5]
             }}
             transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: index * 0.2 }}
             className="relative z-10"
           >
              <div className="relative overflow-hidden bg-gradient-to-br from-[#1c1c1e] to-black p-3.5 shadow-[0_50px_90px_-20px_rgba(0,0,0,0.98)] border-2 border-luxury-gold/20 rounded-md group-hover:border-luxury-gold/50 group-hover:scale-[1.03] transition-all duration-1000 ease-out">
                {/* Image Wrap */}
                <div className="relative overflow-hidden rounded-sm border border-black/80">
                  <img 
                    src={url} 
                    onLoad={handleImageLoad}
                    onError={() => setHasError(true)}
                    referrerPolicy="no-referrer"
                    className={cn("w-full object-cover brightness-[0.85] contrast-[1.04] group-hover:brightness-105 transition-all duration-[1.2s] ease-out group-hover:scale-[1.05]", isLandscape ? "aspect-video" : "aspect-[4/5]")} 
                    alt={caption} 
                  />
                  {/* Subtle inner gold vignette overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                </div>
                
                {/* Double frame gap depth simulation */}
                <div className="absolute inset-5 border border-white/[0.06] mix-blend-overlay pointer-events-none" />
                
                {/* Exquisite golden inner outline with refined corner points */}
                <div className="absolute inset-[13px] pointer-events-none border border-luxury-gold/15 group-hover:border-luxury-gold/40 transition-all duration-1000" />
                <div className="absolute top-[13px] left-[13px] w-2 h-2 bg-luxury-gold/30 rounded-full group-hover:bg-luxury-gold transition-colors duration-1000" />
                <div className="absolute top-[13px] right-[13px] w-2 h-2 bg-luxury-gold/30 rounded-full group-hover:bg-luxury-gold transition-colors duration-1000" />
                <div className="absolute bottom-[13px] left-[13px] w-2 h-2 bg-luxury-gold/30 rounded-full group-hover:bg-luxury-gold transition-colors duration-1000" />
                <div className="absolute bottom-[13px] right-[13px] w-2 h-2 bg-luxury-gold/30 rounded-full group-hover:bg-luxury-gold transition-colors duration-1000" />
              </div>
           </motion.div>
           {/* Ambient background aura glow */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-luxury-gold/[0.04] group-hover:bg-luxury-gold/[0.09] blur-[80px] rounded-full mix-blend-screen pointer-events-none transition-all duration-1000" />
        </div>
      )}
    </motion.div>
  );
}
