"use client";
import { useRef, useEffect } from "react";

export default function GalaxyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let lastTime = performance.now();

    // Mouse state for hover interaction
    const mouse = { x: width / 2, y: height / 2, radius: 100 };

    class Star {
      angle: number;
      baseRadius: number;
      radius: number;
      size: number;
      baseSize: number;
      speed: number;
      hue: number;
      x: number;
      y: number;

      constructor() {
        this.angle = Math.random() * 2 * Math.PI;
        this.baseRadius = Math.random() * (width / 3);
        this.radius = this.baseRadius;
        this.baseSize = Math.random() * 2 + 1;
        this.size = this.baseSize;
        this.speed = 0.001 + Math.random() * 0.002;
        this.hue = Math.random() * 360;
        this.x = 0;
        this.y = 0;
      }

      update(dt: number) {
        this.angle += this.speed * dt;
        this.x = width / 2 + Math.cos(this.angle) * this.radius;
        this.y = height / 2 + Math.sin(this.angle) * this.radius;

        // Distance to mouse for hover detection
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          const proximity = 1 - dist / mouse.radius;
          this.size = this.baseSize + proximity * 3; // enlarge near cursor
          this.hue = (this.hue + proximity * 5) % 360; // slight hue shift
        } else {
          // Ease back to normal
          this.size += (this.baseSize - this.size) * 0.05;
        }

        // Continuous orbiting hue cycling
        this.hue = (this.hue + 0.1) % 360;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
        ctx.fillStyle = `hsl(${this.hue}, 100%, 70%)`;
        ctx.shadowColor = `hsl(${this.hue}, 100%, 80%)`;
        ctx.shadowBlur = 10;
        ctx.fill();
      }
    }

    const stars: Star[] = Array.from({ length: 150 }, () => new Star());

    function animate(currentTime: number) {
      const dt = Math.min((currentTime - lastTime) / 16.67, 2); // smooth out timing
      lastTime = currentTime;

      ctx.fillStyle = "rgba(0, 0, 10, 0.2)"; // subtle trail effect
      ctx.fillRect(0, 0, width, height);

      for (let star of stars) {
        star.update(dt);
        star.draw();
      }

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef}></canvas>;
}