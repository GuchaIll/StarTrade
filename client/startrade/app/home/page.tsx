"use client";

import { useEffect, useRef, useState} from "react";
import React from "react";
import localFont from "next/font/local";

const myFont = localFont({
  src: "../../public/RELIGATH-Demo.otf", // adjust path if needed
  display: "swap",
  variable: "--font-myfont", // optional for CSS variable use
});


interface Star {
  id: number;
  radiusX: number;
  radiusY: number;
  speed: number;
  size: number;
  color: string;
  angle: number;
  name: string;
  image: string;
}

export default function Home() {
  const starsContainerRef = useRef<HTMLDivElement>(null);
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    const starCount = 20;
    const baseRadius = 50;
    const orbitStep = 30;
    const companies = ["AAPL", "GOOGL", "AMZN", "MSFT", "TSLA", "META", "NFLX", "NVDA", "ADBE", "INTC", "CSCO", "ORCL", "IBM", "SAP", "CRM", "UBER", "LYFT", "TWTR", "SNAP", "SHOP"];
    const randomized = companies
      .map((value: string) => ({ value, sort: Math.random() }))
      .sort((a: {value: string; sort: number}, b: {value: string; sort: number}) => a.sort - b.sort)
      .map(({value}: {value: string}) => value);

    // Generate star data
    const generatedStars: Star[] = Array.from({ length: starCount }).map((_, i) => {
      const colorType = Math.random() * 10;
      let color = "";
      let boxShadow = "";

      if (colorType > 5) {
        // light blue
        color = "hsla(244, 69%, 59%, 0.85)";
        boxShadow = "0 0 8px hsl(244, 69%, 59%)";
      } else if (colorType > 0.05) {
        // dark red
        color = "hsla(0, 72%, 55%, 0.85)";
        boxShadow = "0 0 8px hsl(0, 72%, 55%)";
      } else {
        // black with yellow outline
        color = "black";
        boxShadow = "black";
      }

      return {
        id: i,
        radiusX: (baseRadius + i * orbitStep) * 0.85,
        radiusY: (baseRadius + i * orbitStep) * 0.4,
        speed: 0.001 * (i + 5) / 20,
        size: Math.random() * 30 + 20,
        image: color == "black" ? "/black_hole.jpg" : "",
        color,
        boxShadow,
        angle: (i / (starCount * 0.4)) * Math.PI * 2 + 180,
        name: randomized[i],
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

        const starEl = children[i * 2] as HTMLElement; // star
        const labelEl = children[i * 2 + 1] as HTMLElement; // label

        if (starEl) starEl.style.transform = `translate(${x}px, ${y}px)`;
        if (labelEl) labelEl.style.transform = `translate(${x}px, ${y - star.size - 10}px)`;
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
        className="fixed inset-0 w-full h-full bg-[url('/galaxy3.png')] bg-cover bg-center"
        style={{
          zIndex: 0, // sits behind everything
          opacity: 0.85, // increased opacity
        }}
      />

      {/* Stars and Core */}
      <div className="relative w-[800px] h-[800px] flex items-center justify-center z-0">
        {/* Core glow */}
        <div
          className="absolute rounded-full"
          // style={{
          //   width: "300px",
          //   height: "300px",
          //   top: "50%",
          //   left: "50%",
          //   transform: "translate(-130px, -240px)",
          //   background: "radial-gradient(circle, white 0%, indigo 80%, transparent 100%)",
          //   filter: "blur(60px)",
          //   zIndex: 0,
          // }}
        />

        {/* Orbiting Stars */}
        <div ref={starsContainerRef} className="absolute inset-0 flex items-center justify-center z-50">
          {stars.map((star) => (
            <React.Fragment key={`star-${star.id}`}>
              <div className="absolute">
                {star.image ? (
                  <img
                    src={star.image}
                    alt="star"
                    width={star.size}
                    height={star.size}
                    className="transition-transform duration-200 ease-out hover:scale-150 rounded-full"
                    style={{
                      objectFit: "cover",
                    }}
                  />) : (
                  <div
                    className="rounded-full transition-transform duration-200 ease-out hover:scale-150"
                    style={{
                      width: `${star.size}px`,
                      height: `${star.size}px`,
                      background: star.color == "hsla(244, 69%, 59%, 1.00)" ? `radial-gradient(circle, rgba(214, 110, 252, 0.84) 0%, ${star.color} 50%, rgba(0,0,0,0.8) 100%)` : `radial-gradient(circle, rgba(255, 209, 173, 0.85) 0%, ${star.color} 50%, rgba(0,0,0,0.8) 100%)`,
                      boxShadow: `0 0 ${star.size / 1.5}px ${star.color}`,
                    }}
                  />)}
              </div>
              
              <div key={`label-${star.id}`} className={`absolute text-purple-300 text-sm select-none pointer-events-none ${myFont.className}`} style={{ zIndex: 10 }}>
                {star.name}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </main>
  );
}
