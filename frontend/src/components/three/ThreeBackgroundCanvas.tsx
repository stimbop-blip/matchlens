import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { useAppTheme } from "../../lib/theme";

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const count = 180;
    const spread = 12;
    const array = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const idx = i * 3;
      array[idx] = (Math.random() - 0.5) * spread;
      array[idx + 1] = (Math.random() - 0.5) * spread;
      array[idx + 2] = -Math.random() * spread;
    }

    return array;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.04;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#00b8ff" transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function shouldDisableBackground3D() {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const lowCpu = typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4;
  const lowMem = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
  const telegramWebView = /Telegram/i.test(nav.userAgent);
  return lowCpu || lowMem || telegramWebView;
}

export function ThreeBackgroundCanvas() {
  const { theme } = useAppTheme();

  if (shouldDisableBackground3D()) return null;

  const dark = theme === "dark";

  return (
    <div className="canvas-root" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 6], fov: 52 }} dpr={[1, 1.15]} gl={{ antialias: false, powerPreference: "low-power" }}>
        <color attach="background" args={[dark ? "#0a0a0a" : "#f8f9fa"]} />
        <fog attach="fog" args={[dark ? "#0a0a0a" : "#f8f9fa", 7, 16]} />
        <ambientLight intensity={dark ? 0.42 : 0.62} />
        <pointLight position={[2.6, 2.4, 4]} intensity={dark ? 1.0 : 0.8} color="#00ff9d" />
        <pointLight position={[-2.6, -1.6, 3]} intensity={0.7} color="#00b8ff" />
        <ParticleField />
      </Canvas>
    </div>
  );
}
