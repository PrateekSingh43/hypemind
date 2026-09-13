"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function MemoryConstellation({ phase, glowFiles }: { phase: number, glowFiles: string[] }) {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  
  // Generate random points for the "memories"
  const particleCount = 150;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5 - 2;
    }
    return pos;
  }, []);

  // Generate lines connecting nearby points
  const linePositions = useMemo(() => {
    const lines = [];
    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < particleCount; j++) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const distSq = dx * dx + dy * dy + dz * dz;
        
        if (distSq < 4) { // Only connect if close
          lines.push(
            positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
            positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
          );
        }
      }
    }
    return new Float32Array(lines);
  }, [positions]);

  useFrame((state) => {
    if (!pointsRef.current || !linesRef.current) return;
    const t = state.clock.getElapsedTime();
    
    // Slow rotation
    pointsRef.current.rotation.y = t * 0.05;
    linesRef.current.rotation.y = t * 0.05;
    
    pointsRef.current.rotation.x = Math.sin(t * 0.02) * 0.1;
    linesRef.current.rotation.x = Math.sin(t * 0.02) * 0.1;

    // Pulse based on phase
    const material = pointsRef.current.material as THREE.PointsMaterial;
    const lineMaterial = linesRef.current.material as THREE.LineBasicMaterial;
    
    if (phase === 1) {
      // Searching: rapid pulsing
      material.opacity = 0.3 + Math.sin(t * 8) * 0.2;
      lineMaterial.opacity = 0.1 + Math.sin(t * 8) * 0.1;
      material.color.setHex(0x8A8F98);
      lineMaterial.color.setHex(0x8A8F98);
    } else if (phase === 2) {
      // Synthesizing: intense glowing connection
      material.opacity = 0.6 + Math.sin(t * 3) * 0.3;
      lineMaterial.opacity = 0.3 + Math.sin(t * 3) * 0.2;
      material.color.setHex(0x5E6AD2); // mkt-accent
      lineMaterial.color.setHex(0x5E6AD2);
    } else if (phase === 3) {
      // Answered: steady glow
      material.opacity = 0.4;
      lineMaterial.opacity = 0.15;
      material.color.setHex(0x5E6AD2);
      lineMaterial.color.setHex(0x5E6AD2);
    }
  });

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
            count={positions.length / 3}
          />
        </bufferGeometry>
        <pointsMaterial 
          size={0.05} 
          color="#8A8F98" 
          transparent 
          opacity={0.3} 
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
            count={linePositions.length / 3}
          />
        </bufferGeometry>
        <lineBasicMaterial 
          color="#8A8F98" 
          transparent 
          opacity={0.1}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}

export function MemoryWebGL({ phase, glowFiles }: { phase: number, glowFiles: string[] }) {
  // Only render if we are actively thinking or answering
  if (phase === 0) return null;

  return (
    <div style={{ 
      position: "absolute", 
      top: 0, 
      left: 0, 
      width: "100%", 
      height: "100%", 
      zIndex: 0, // Behind UI
      pointerEvents: "none",
      opacity: phase === 0 ? 0 : 1,
      transition: "opacity 1s ease-in-out"
    }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <fog attach="fog" args={['#0A0A0B', 5, 15]} />
        <MemoryConstellation phase={phase} glowFiles={glowFiles} />
      </Canvas>
    </div>
  );
}
