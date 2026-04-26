import React, { useEffect, useRef, useState } from 'react';
import SplitText from './SplitText';
import RotatingText from './RotatingText';

// Dynamically import all images from the fotos-archie directory
const imageModules = import.meta.glob('@/fotos-archie/*.jpg', { eager: true, query: '?url', import: 'default' });

// Extract and sort URLs to ensure frame order is strictly sequential
const frameUrls = Object.keys(imageModules)
  .sort()
  .map((key) => imageModules[key] as string);

export function HeroScrollAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);

  // Preload images into memory
  useEffect(() => {
    const loadedImages: HTMLImageElement[] = [];
    let loadedCount = 0;

    if (frameUrls.length === 0) return;

    frameUrls.forEach((url, index) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === frameUrls.length) {
          setImages(loadedImages);
          // Initial draw of the first frame once all are loaded
          requestAnimationFrame(() => drawImage(0, loadedImages));
        }
      };
      loadedImages[index] = img;
    });
  }, []);

  const drawImage = (frameIndex: number, imgs: HTMLImageElement[] = images) => {
    if (!canvasRef.current || !imgs[frameIndex]) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imgs[frameIndex];
    // Update canvas resolution to match the image, avoiding distortion
    if (canvas.width !== img.width) canvas.width = img.width;
    if (canvas.height !== img.height) canvas.height = img.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    if (images.length === 0) return;

    let animationFrameId: number;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      // Calculate how much we can scroll inside the container.
      // We subtract window.innerHeight so that progress is 1 when the container's bottom hits the viewport's bottom.
      const maxScroll = rect.height - window.innerHeight;

      // Calculate progress (0 to 1) based on the distance from the top
      let progress = 0;

      // Since the sticky element is offset by 4rem (navbar height), we account for it
      // if rect.top <= 64px (4rem), we start animating
      const offset = 64;

      if (rect.top <= offset) {
        // limit progress between 0 and 1
        progress = Math.min(1, Math.max(0, (offset - rect.top) / maxScroll));
      }

      const maxFrame = images.length - 1;
      const frameIndex = Math.min(maxFrame, Math.floor(progress * maxFrame));

      // Ensure we don't queue multiple overlapping renders
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => drawImage(frameIndex));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initial draw
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, [images]);

  return (
    // 400vh gives us plenty of scroll room to make the animation fluid
    <section ref={containerRef} className="relative w-full h-[400vh] bg-[#0d0d0d]">
      {/* Sticky container that holds the canvas and text overlay */}
      <div className="sticky top-16 w-full h-[calc(100vh-4rem)] overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full object-cover opacity-100"
        />

        {/* Overlay Content */}
        <div className="absolute inset-0 flex flex-col justify-end z-10 pointer-events-none px-6 md:px-16 pb-32">
          <SplitText
            text="Archie"
            tag="h1"
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-white drop-shadow-2xl"
            delay={100}
            duration={0.6}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
            textAlign="left"
          />
          <div className="mt-8 text-2xl md:text-4xl text-white drop-shadow-lg max-w-[700px] font-medium flex items-center flex-wrap gap-2">
            Aprende
            <RotatingText
              texts={['Matemáticas', 'Programación', 'Inteligencia Artificial', 'Redes', 'Bases de Datos']}
              mainClassName="px-2 sm:px-2 md:px-3 bg-blue-700 text-black overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg"
              staggerFrom={"last"}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-120%" }}
              staggerDuration={0.025}
              splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              rotationInterval={2200}
            />
          </div>

          <div className="absolute bottom-8 right-6 md:right-16 opacity-80 animate-bounce flex flex-col items-center">
            <p className="text-white text-xs md:text-sm uppercase tracking-[0.2em] mb-2" style={{ writingMode: 'vertical-rl' }}>Descubrir</p>
            <div className="w-[2px] h-12 bg-blue-500/80 rounded-full"></div>
          </div>
        </div>

        {/* Gradient overlays to smoothly blend the hero section with the rest of the site */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d0d]/80 via-transparent to-[#0d0d0d] pointer-events-none"></div>
      </div>
    </section>
  );
}
