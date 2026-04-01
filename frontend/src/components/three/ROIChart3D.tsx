import { Suspense, useMemo, useRef } from "react";

import { Canvas, useFrame } from "@react-three/fiber";
import type { Group } from "three";
import * as THREE from "three";

import { ErrorBoundary } from "../motion/ErrorBoundary";

function ChartBars({ values }: { values: number[] }) {
  const groupRef = useRef<Group>(null);
  const max = useMemo(() => Math.max(1, ...values), [values]);
  const curve = useMemo(() => {
    const points = values.map((value, index) => {
      const normalized = Math.max(0.12, value / max);
      const x = (index - (values.length - 1) / 2) * 0.55;
      const y = normalized * 1.5 + 0.08;
      return new THREE.Vector3(x, y, 0.24);
    });
    return new THREE.CatmullRomCurve3(points);
  }, [max, values]);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    group.rotation.y = Math.sin(clock.elapsedTime * 0.3) * 0.18;
  });

  return (
    <group ref={groupRef} position={[0, -0.65, 0]}>
      {values.map((value, index) => {
        const normalized = Math.max(0.12, value / max);
        const height = normalized * 1.5;
        const x = (index - (values.length - 1) / 2) * 0.55;

        return (
          <group key={`${index}-${value}`} position={[x, height / 2, 0]}>
            <mesh>
              <boxGeometry args={[0.3, height, 0.3]} />
              <meshStandardMaterial color={index % 2 === 0 ? "#2cd8b7" : "#2f8cff"} metalness={0.58} roughness={0.32} emissive={index % 2 === 0 ? "#2cd8b7" : "#2f8cff"} emissiveIntensity={0.26} />
            </mesh>
          </group>
        );
      })}

      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[values.length * 0.56, 0.08, 0.64]} />
        <meshStandardMaterial color="#112435" metalness={0.4} roughness={0.55} />
      </mesh>

      <mesh>
        <tubeGeometry args={[curve, 72, 0.035, 10, false]} />
        <meshStandardMaterial color="#8effe9" emissive="#2cd8b7" emissiveIntensity={0.52} metalness={0.74} roughness={0.26} />
      </mesh>
    </group>
  );
}

export function ROIChart3D({ title, values, height = 210 }: { title: string; values: number[]; height?: number }) {
  return (
    <section className="pb-three-chart" style={{ height }}>
      <div className="pb-three-chart-canvas" aria-hidden="true">
        <ErrorBoundary fallback={<div className="pb-home-r3f-fallback">3D</div>}>
          <Suspense fallback={<div className="pb-home-r3f-fallback">3D</div>}>
            <Canvas camera={{ position: [0, 0.35, 3.4], fov: 45 }} dpr={[1, 1.4]} gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}>
              <ambientLight intensity={0.78} />
              <pointLight position={[2.5, 2.2, 3]} intensity={1.15} color="#2cd8b7" />
              <pointLight position={[-2.3, -1.2, 2.4]} intensity={0.9} color="#2f8cff" />
              <ChartBars values={values} />
            </Canvas>
          </Suspense>
        </ErrorBoundary>
      </div>

      <div className="pb-three-chart-caption">{title}</div>
    </section>
  );
}
