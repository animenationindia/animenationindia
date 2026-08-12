'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

type MouseRef = {
  current: [number, number];
};

const floatingConfigs: Array<{
  position: [number, number, number];
  scale: number;
  color: string;
  geometry: 'sphere' | 'torus' | 'plane';
}> = [
  { position: [-2.8, 0.7, -3.2], scale: 0.9, color: '#ff6400', geometry: 'sphere' }, // Crunchyroll Orange
  { position: [2.4, 0.2, -3.5], scale: 0.7, color: '#f9c83c', geometry: 'torus' },  // Gold
  { position: [0.8, -0.2, -2.5], scale: 0.55, color: '#4f46e5', geometry: 'plane' }, // Indigo
  { position: [-1.5, -0.8, -3.8], scale: 1.05, color: '#ff3b4b', geometry: 'sphere' }, // Vibrant Red
  { position: [1.9, 0.9, -4.1], scale: 0.65, color: '#ff4dd2', geometry: 'torus' },  // Violet
];

function FloatingEffect({
  index,
  position,
  scale,
  color,
  geometry,
  mouse,
}: {
  index: number;
  position: [number, number, number];
  scale: number;
  color: string;
  geometry: 'sphere' | 'torus' | 'plane';
  mouse: MouseRef;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const initial = useMemo(() => new THREE.Vector3(...position), [position]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const time = state.clock.elapsedTime;
    const mx = mouse.current[0] * 1.35;
    const my = mouse.current[1] * 0.8;

    ref.current.position.x = initial.x + Math.sin(time * 0.55 + index) * 0.17 + mx;
    ref.current.position.y = initial.y + Math.cos(time * 0.45 + index) * 0.13 + my;
    ref.current.position.z = initial.z + Math.sin(time * 0.3 + index) * 0.12;
    ref.current.rotation.x += delta * 0.06;
    ref.current.rotation.y += delta * 0.08;
  });

  const materialProps = {
    color,
    emissive: color,
    emissiveIntensity: 0.55,
    roughness: 0.2,
    metalness: 0.45,
    opacity: 0.8,
    transparent: true,
  };

  return (
    <mesh ref={ref} position={position} scale={scale}>
      {geometry === 'sphere' && <sphereGeometry args={[0.55, 36, 32]} />}
      {geometry === 'torus' && <torusGeometry args={[0.5, 0.16, 28, 64]} />}
      {geometry === 'plane' && <planeGeometry args={[1.2, 1.2]} />}
      <meshStandardMaterial {...materialProps} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}

function SparkField({ mouse }: { mouse: MouseRef }) {
  const pointsRef = useRef<THREE.Points>(null!);
  
  const positions = useMemo(() => {
    const count = 60;
    const array = new Float32Array(count * 3);
    
    // 🌟 Pure Deterministic Hash function to satisfy React 19's rule of purity
    const pseudoRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    for (let i = 0; i < count; i += 1) {
      array[i * 3] = (pseudoRandom(i * 12.9898) - 0.5) * 16;
      array[i * 3 + 1] = (pseudoRandom(i * 78.233) - 0.5) * 6;
      array[i * 3 + 2] = -pseudoRandom(i * 4.1414) * 5 - 1.5;
    }
    return array;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    pointsRef.current.position.x = mouse.current[0] * 0.6;
    pointsRef.current.position.y = mouse.current[1] * 0.35;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#ff8c00" // Golden-Orange Sparks
        size={0.08}
        sizeAttenuation
        transparent
        opacity={0.75}
      />
    </points>
  );
}

export default function HeroBackground3D() {
  const mouse = useRef<[number, number]>([0, 0]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mouse.current[0] = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.current[1] = -((event.clientY / window.innerHeight) * 2 - 1);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none">
      <Canvas
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 8], fov: 32 }}
        className="w-full h-full"
      >
        <color attach="background" args={["#070708"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 6, 5]} intensity={1.1} color="#f9f2ff" />
        <directionalLight position={[-4, -1, -3]} intensity={0.8} color="#6ca8ff" />

        {floatingConfigs.map((item, index) => (
          <FloatingEffect key={index} index={index} mouse={mouse as MouseRef} {...item} />
        ))}

        <SparkField mouse={mouse as MouseRef} />
      </Canvas>
    </div>
  );
}
