import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type NeonParticlesProps = {
  count?: number;
  spread?: number;
  speed?: number;
};

export function NeonParticles({ count = 800, spread = 14, speed = 0.28 }: NeonParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  const seed = useMemo(() => new Float32Array(count), [count]);

  useMemo(() => {
    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * spread;
      positions[i3 + 1] = (Math.random() - 0.5) * spread;
      positions[i3 + 2] = -Math.random() * spread;
      seed[i] = Math.random() * 10;
    }
  }, [count, positions, seed, spread]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const attr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3;
      arr[i3 + 1] += delta * speed * (0.08 + (seed[i] % 0.3));
      arr[i3] += Math.sin(t * 0.3 + seed[i]) * 0.0007;
      if (arr[i3 + 1] > spread * 0.5) arr[i3 + 1] = -spread * 0.5;
    }

    attr.needsUpdate = true;
    pointsRef.current.rotation.z = Math.sin(t * 0.12) * 0.04;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#00b8ff"
        transparent
        opacity={0.65}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
