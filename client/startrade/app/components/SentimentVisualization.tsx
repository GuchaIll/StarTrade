"use client";
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// @ts-ignore: examples jsm imports
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
// @ts-ignore
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
// @ts-ignore
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

type Topic = {
  name: string;
  sentiment: number;
  strength: number;
};

const SentimentVisualization = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const starsRef = useRef<Array<THREE.Object3D>>([]);
  const labelsRef = useRef<Array<THREE.Object3D>>([]);
  const [hoveredTopic, setHoveredTopic] = useState<Topic | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Sample topics with sentiment (-1 to 1) and strength (0 to 1)
  const topics = [
    { name: "Climate Action", sentiment: 0.7, strength: 0.9 },
    { name: "Economic Growth", sentiment: 0.5, strength: 0.7 },
    { name: "Healthcare Reform", sentiment: -0.3, strength: 0.8 },
    { name: "Technology Innovation", sentiment: 0.8, strength: 0.95 },
    { name: "Privacy Concerns", sentiment: -0.6, strength: 0.85 },
    { name: "Education Access", sentiment: 0.4, strength: 0.6 },
    { name: "Income Inequality", sentiment: -0.7, strength: 0.9 },
    { name: "Renewable Energy", sentiment: 0.75, strength: 0.8 },
    { name: "Political Polarization", sentiment: -0.8, strength: 0.95 },
    { name: "Mental Health", sentiment: 0.2, strength: 0.7 },
    { name: "Job Security", sentiment: -0.4, strength: 0.75 },
    { name: "Social Media", sentiment: -0.2, strength: 0.65 },
    { name: "Space Exploration", sentiment: 0.6, strength: 0.5 },
    { name: "Artificial Intelligence", sentiment: 0.3, strength: 0.85 },
    { name: "Housing Crisis", sentiment: -0.75, strength: 0.9 },
  ];

  const getSentimentColor = (sentiment: number, strength: number): THREE.Color => {
    const color = new THREE.Color();
    
    if (sentiment > 0.1) {
      // Positive: green
      color.setRGB(0, 1, 0);
    } else if (sentiment < -0.1) {
      // Negative: magenta
      color.setRGB(1, 0, 1);
    } else {
      // Neutral: white
      color.setRGB(1, 1, 1);
    }
    
    // Adjust brightness based on strength
    color.multiplyScalar(0.3 + strength * 0.7);
    
    return color;
  };

  const createTextSprite = (text: string, color: string): THREE.Sprite => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;
    if (context) {
      context.font = 'Bold 48px Arial';
      context.fillStyle = color;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, 256, 64);
    }
    
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    
    const spriteMaterial = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true,
      opacity: 0.9
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(15, 3.75, 1);
    
    return sprite;
  };

  useEffect(() => {
  if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000510);
    scene.fog = new THREE.Fog(0x000510, 50, 200);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 80;
    cameraRef.current = camera;

  // Renderer setup
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  // Double pixel ratio to increase drawing buffer resolution (visually sharper)
  const dpr = (window.devicePixelRatio || 1) * 2;
  renderer.setPixelRatio(dpr);
  // set size based on the mount container and double the drawing buffer
  const mw = mountRef.current!.clientWidth;
  const mh = mountRef.current!.clientHeight;
  renderer.setSize(mw * 2, mh * 2, false);
  // ensure the canvas fills the mount container and is absolutely positioned
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.left = '0';
  renderer.domElement.style.top = '0';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  mountRef.current!.appendChild(renderer.domElement);
  rendererRef.current = renderer;

    // Post-processing: EffectComposer + UnrealBloomPass for bloom/glow
  const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(mountRef.current!.clientWidth * 2, mountRef.current!.clientHeight * 2),
      1.2, // strength
      0.6, // radius
      0.05 // threshold
    );
    composer.addPass(bloomPass);
    composerRef.current = composer;

    // Add ambient background stars (many more, smaller)
    const bgStarGeometry = new THREE.BufferGeometry();
    const bgStarVertices = [];
    const bgStarColors = [];
    for (let i = 0; i < 5000; i++) {
      const x = (Math.random() - 0.5) * 500;
      const y = (Math.random() - 0.5) * 500;
      const z = (Math.random() - 0.5) * 500;
      bgStarVertices.push(x, y, z);
      
      // Slight color variation for stars
      const brightness = 0.3 + Math.random() * 0.4;
      bgStarColors.push(brightness, brightness, brightness);
    }
    bgStarGeometry.setAttribute('position', new THREE.Float32BufferAttribute(bgStarVertices, 3));
    bgStarGeometry.setAttribute('color', new THREE.Float32BufferAttribute(bgStarColors, 3));
    const bgStarMaterial = new THREE.PointsMaterial({ 
      size: 0.2, 
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });
    const bgStars = new THREE.Points(bgStarGeometry, bgStarMaterial);
    scene.add(bgStars);

    // Optional: Add HDRI background
    // To use an HDRI galaxy image, uncomment the following code and replace the URL:
    /*
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      './outer-space-background.jpg', // Replace with your HDRI image URL
      (texture) => {
        // Create spherical environment map
        const sphereGeometry = new THREE.SphereGeometry(400, 60, 40);
        sphereGeometry.scale(-1, 1, 1); // Invert to see inside
        const sphereMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.BackSide,
          transparent: true,
          opacity: 0.3
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        scene.add(sphere);
      }
    );
    */

    // Animation state
    const animationState = {
      bloomProgress: 0,
      targetProgress: 1,
      speed: 0.02
    };

    // Create sentiment stars with bloom animation
    topics.forEach((topic, idx) => {
      const angle = (idx / topics.length) * Math.PI * 2;
      const targetRadius = 30 + Math.random() * 20;
      const targetHeight = (Math.random() - 0.5) * 30;
      
      // Create glow effect with bloom (much smaller sizes)
      const glowLayers = 3;
      const glowGroup = [];
      
      for (let i = 0; i < glowLayers; i++) {
        const size = (0.3 + topic.strength * 0.4) * (glowLayers - i) * 0.3;
        const geometry = new THREE.SphereGeometry(size, 16, 16);
        const material = new THREE.MeshBasicMaterial({
          color: getSentimentColor(topic.sentiment, topic.strength),
          transparent: true,
          opacity: (0.3 / (i + 1)) * topic.strength,
        });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.userData = { 
          topic, 
          isCore: i === 0,
          targetRadius,
          targetHeight,
          angle,
          layer: i,
          delay: idx * 0.05
        };
        scene.add(sphere);
        glowGroup.push(sphere);
        
        if (i === 0) {
          starsRef.current.push(sphere);
        }
      }

      // Add core bright star (much smaller)
      const coreGeometry = new THREE.SphereGeometry(0.15, 8, 8);
      const coreMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(1, 1, 1),
        transparent: true,
        opacity: topic.strength,
      });
      const core = new THREE.Mesh(coreGeometry, coreMaterial);
      core.userData = { 
        topic, 
        isCore: true,
        targetRadius,
        targetHeight,
        angle,
        delay: idx * 0.05
      };
      scene.add(core);
      glowGroup.push(core);

      // Add text label (white, positioned above)
      const label = createTextSprite(topic.name, '#ffffff');
      label.userData = {
        targetRadius,
        targetHeight,
        angle,
        delay: idx * 0.05
      };
      label.renderOrder = 999; // Always render on top
      scene.add(label);
      labelsRef.current.push(label);
      glowGroup.push(label);

      // Store group for animation (no connecting line objects)
      starsRef.current.push(...glowGroup);
    });

    // Mouse interaction
    const onMouseMove = (event: MouseEvent) => {
      const rect = mountRef.current!.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    window.addEventListener('mousemove', onMouseMove);

  // Animation loop
  let frameId: number | null = null;
    const animate = () => {
      frameId = requestAnimationFrame(animate);

      // Bloom animation
      if (animationState.bloomProgress < animationState.targetProgress) {
        animationState.bloomProgress += animationState.speed;
        
        starsRef.current.forEach((obj) => {
          if (obj.userData.targetRadius !== undefined) {
            const delay = obj.userData.delay || 0;
            const progress = Math.max(0, Math.min(1, (animationState.bloomProgress - delay) / (1 - delay)));
            const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
            
            const x = Math.cos(obj.userData.angle) * obj.userData.targetRadius * easeProgress;
            const y = obj.userData.targetHeight * easeProgress;
            const z = Math.sin(obj.userData.angle) * obj.userData.targetRadius * easeProgress;
            
            obj.position.set(x, y, z);
            
            // Fade in - cast to Mesh or Sprite if applicable
            try {
              const mesh = obj as THREE.Mesh;
              if ((mesh as any).material && mesh.userData && mesh.userData.topic) {
                const originalOpacity = mesh.userData.isCore ? mesh.userData.topic.strength : 
                                        (0.3 / (mesh.userData.layer + 1)) * mesh.userData.topic.strength;
                (mesh.material as any).opacity = originalOpacity * easeProgress;
              }
            } catch (e) {
              // ignore if not a mesh
            }
          }
        });

        labelsRef.current.forEach((label) => {
          const delay = label.userData.delay || 0;
          const progress = Math.max(0, Math.min(1, (animationState.bloomProgress - delay) / (1 - delay)));
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          
          const x = Math.cos(label.userData.angle) * label.userData.targetRadius * easeProgress;
          const y = (label.userData.targetHeight * easeProgress) + 8;
          const z = Math.sin(label.userData.angle) * label.userData.targetRadius * easeProgress;
          
          label.position.set(x, y, z);
          try {
            (label as THREE.Sprite).material.opacity = 0.9 * easeProgress;
          } catch (e) {
            // ignore
          }
        });

      // No connecting lines to update (lines removed)
      }

      // Rotate camera around scene
      const time = Date.now() * 0.0001;
      camera.position.x = Math.sin(time) * 80;
      camera.position.z = Math.cos(time) * 80;
      camera.lookAt(scene.position);

      // Check for hover
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const coreObjects = starsRef.current.filter(obj => obj.userData.isCore);
      const intersects = raycasterRef.current.intersectObjects(coreObjects as THREE.Object3D[]);
      
      if (intersects.length > 0 && intersects[0].object.userData.topic) {
        setHoveredTopic(intersects[0].object.userData.topic as Topic);
      } else {
        setHoveredTopic(null);
      }

      // Use composer to render with bloom if available
      if (composerRef.current) {
        composerRef.current.render();
      } else {
        renderer.render(scene, camera);
      }
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current!.clientWidth / mountRef.current!.clientHeight;
      camera.updateProjectionMatrix();
      const w = mountRef.current!.clientWidth;
      const h = mountRef.current!.clientHeight;
      // renderer drawing buffer uses doubled resolution
      renderer.setSize(w * 2, h * 2, false);
      if (composerRef.current) {
        composerRef.current.setSize(w * 2, h * 2);
      }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      if (frameId !== null) cancelAnimationFrame(frameId);
      if (mountRef.current && renderer && renderer.domElement.parentElement === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      if (composerRef.current) {
        try {
          composerRef.current.dispose();
        } catch (e) {
          // ignore
        }
        composerRef.current = null;
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="w-full h-full bg-slate-950 relative min-h-0">
  {/* Left-side canvas container: absolute so it doesn't overlay other areas */}
  <div ref={mountRef} className="absolute left-0 top-0 h-full w-[840px]" />
      
      {/* Legend */}
      <div className="absolute top-6 left-6 bg-slate-900/80 backdrop-blur p-4 rounded-lg text-white">
        <h3 className="text-lg font-bold mb-3">Sentiment Galaxy</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span>Positive Sentiment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-fuchsia-500"></div>
            <span>Negative Sentiment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-white"></div>
            <span>Neutral Sentiment</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700">
            <p className="text-xs text-slate-400">Brightness = Sentiment Strength</p>
          </div>
        </div>
      </div>

      {/* Hover info */}
      {hoveredTopic && (
        <div className="absolute top-6 right-6 bg-slate-900/90 backdrop-blur p-4 rounded-lg text-white max-w-xs">
          <h4 className="font-bold text-lg mb-2">{hoveredTopic.name}</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Sentiment:</span>
              <span className={hoveredTopic.sentiment > 0 ? 'text-green-400' : hoveredTopic.sentiment < 0 ? 'text-fuchsia-400' : 'text-white'}>
                {hoveredTopic.sentiment > 0 ? 'Positive' : hoveredTopic.sentiment < 0 ? 'Negative' : 'Neutral'}
                {' '}({hoveredTopic.sentiment.toFixed(2)})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Strength:</span>
              <span>{(hoveredTopic.strength * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SentimentVisualization;