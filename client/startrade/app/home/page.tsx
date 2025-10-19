"use client";

import { useEffect, useRef, useState } from "react";

interface Star {
  id: number;
  radiusX: number;
  radiusY: number;
  speed: number;
  size: number;
  color: string;
  angle: number;
}

export default function Home() {
  const starsContainerRef = useRef<HTMLDivElement>(null);
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    const starCount = 20;
    const baseRadius = 50;
    const orbitStep = 25;

    // Generate star data
    const generatedStars: Star[] = Array.from({ length: starCount }).map((_, i) => {
      const colorType = Math.floor(Math.random() * 3);
      let color = "";
      let boxShadow = "";

      if (colorType === 0) {
        // light blue
        color = "hsla(244, 100%, 65%)";
        boxShadow = "0 0 8px hsl(244, 100%, 65)";
      } else if (colorType === 1) {
        // dark red
        color = "hsl(0, 80%, 40%)";
        boxShadow = "0 0 8px hsl(0, 80%, 40%)";
      } else {
        // black with yellow outline
        color = "black";
        boxShadow = "0 0 6px yellow, 0 0 12px yellow";
      }

      return {
        id: i,
        radiusX: (baseRadius + i * orbitStep) * 1,
        radiusY: (baseRadius + i * orbitStep) * 0.5,
        speed: 0.001 * (i + 5 / (10 * i + 1)) / (i * 0.4 + 5),
        size: Math.random() * 30 + 10,
        color: Math.random() < 0.5 ? "hsla(253, 66%, 55%, 1.00)" : "hsla(0, 62%, 49%, 1.00)",
        angle: (i * (Math.random() + 10) / starCount) * Math.PI * 2,
      };
    });

    setStars(generatedStars);

    let frameId: number;

    const animate = () => {
      const container = starsContainerRef.current;
      if (!container) return;

      const children = container.children;
      if (children.length < generatedStars.length) {
        // wait until all stars are rendered
        frameId = requestAnimationFrame(animate);
        return;
      }

      const verticalOffset = -100;

      generatedStars.forEach((star, i) => {
        star.angle += star.speed;
        const x = Math.cos(star.angle) * star.radiusX;
        const y = Math.sin(star.angle) * star.radiusY + verticalOffset;

        const el = children[i] as HTMLElement;
        if (el) el.style.transform = `translate(${x}px, ${y}px)`;
      });

      frameId = requestAnimationFrame(animate);
    };

    // small delay to ensure DOM is ready
    setTimeout(() => {
      frameId = requestAnimationFrame(animate);
    }, 50);

    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center">

      {/* Background layer */}
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1a1a2e,_#000)] animate-pulse"
        style={{
          zIndex: -10, // sits behind everything
          opacity: 0.6, // optional fade effect
        }}
      />

      {/* Stars and Core */}
      <div className="relative w-[800px] h-[800px] flex items-center justify-center z-0">
        {/* Core glow */}
        <div
          className="absolute z-20 w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-indigo-500 blur-md"
          style={{ transform: "translateY(-150px)" }}
        />

        {/* Orbiting Stars */}
        <div ref={starsContainerRef} className="absolute inset-0 flex items-center justify-center z-50">
          {stars.map((star) => (
            <div key={star.id} className="absolute">
              <div
                className="rounded-full transition-transform duration-200 ease-out hover:scale-150"
                style={{
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  backgroundColor: star.color,
                  boxShadow: `0 0 8px ${star.color}`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
