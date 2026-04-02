import { Line, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

import { useAppTheme } from "../../lib/theme";

type ROIChart3DProps = {
  values: number[];
  height?: number;
  className?: string;
};

function normalize(values: number[]) {
  const safe = values.length ? values : [0];
  const min = Math.min(...safe);
  const max = Math.max(...safe);
  const span = Math.max(1, max - min);
  return safe.map((v) => (v - min) / span);
}

function Scene({ values }: { values: number[] }) {
  const { theme } = useAppTheme();
  const dark = theme === "dark";
  const accent = dark ? "#00ff9d" : "#00cc7a";
  const accent2 = "#00b8ff";
  const normalized = useMemo(() => normalize(values), [values]);

  const points = useMemo(
    () =>
      normalized.map((v, i) => new THREE.Vector3(-2.8 + i * (5.6 / Math.max(1, normalized.length - 1)), -0.75 + v * 2.2, 0.35)),
    [normalized],
  );

  return (
    <>
      <ambientLight intensity={dark ? 0.6 : 0.8} />
      <pointLight position={[2.5, 4, 4]} intensity={1.35} color={accent} />
      <pointLight position={[-3, 1, 3]} intensity={1.15} color={accent2} />

      <group position={[-2.8, -1.1, 0]}>
        {normalized.map((v, i) => {
          const x = i * (5.6 / Math.max(1, normalized.length - 1));
          const h = 0.25 + v * 2.25;
          return (
            <mesh key={i} position={[x, h / 2, 0]}>
              <boxGeometry args={[0.3, h, 0.3]} />
              <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={dark ? 0.55 : 0.18} metalness={0.86} roughness={0.2} />
            </mesh>
          );
        })}
      </group>

      <Line points={points} color={accent2} lineWidth={2.2} transparent opacity={0.95} />

      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.45} minPolarAngle={Math.PI / 2.7} maxPolarAngle={Math.PI / 2.1} />
    </>
  );
}

export function ROIChart3D({ values, height = 220, className }: ROIChart3DProps) {
  const safeValues = values.length ? values : [5, 9, 7, 12, 15, 14, 18];

  return (
    <div className={className} style={{ height, borderRadius: 22, overflow: "hidden", border: "1px solid var(--border)", background: "color-mix(in srgb, var(--card) 86%, transparent)" }}>
      <Canvas camera={{ position: [0, 1, 6], fov: 40 }} dpr={[1, 1.2]} gl={{ antialias: false, powerPreference: "low-power" }}>
        <Scene values={safeValues} />
      </Canvas>
    </div>
  );
}
