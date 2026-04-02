import { Canvas } from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

function RingModel({ percent }: { percent: number }) {
  const safe = Math.max(0, Math.min(100, Math.round(percent)));
  const angle = (safe / 100) * Math.PI * 2;
  const ringRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    const ring = ringRef.current;
    if (!ring) return;
    const t = clock.elapsedTime;
    ring.rotation.y = t * 0.35;
    ring.rotation.x = Math.sin(t * 0.7) * 0.12;
  });

  return (
    <group ref={ringRef}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.75, 0.11, 22, 120]} />
        <meshStandardMaterial color="#203849" metalness={0.5} roughness={0.44} />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.62, 0.86, 84, 1, -Math.PI / 2, angle]} />
        <meshStandardMaterial color="#2cd8b7" emissive="#2cd8b7" emissiveIntensity={0.56} metalness={0.72} roughness={0.25} />
      </mesh>

      <mesh position={[0, -0.72, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 0.06, 28]} />
        <meshStandardMaterial color="#132737" metalness={0.4} roughness={0.5} />
      </mesh>
    </group>
  );
}

export function SubscriptionProgress3D({
  percent,
  label,
  caption,
  height = 220,
}: {
  percent: number;
  label: string;
  caption: string;
  height?: number;
}) {
  const safe = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <section className="pb-three-progress" style={{ height }}>
      <div className="pb-three-progress-canvas" aria-hidden="true">
        <Canvas camera={{ position: [0, 0, 2.7], fov: 44 }} dpr={[1, 1.4]} gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}>
          <ambientLight intensity={0.82} />
          <pointLight position={[2.2, 1.8, 3]} intensity={1.1} color="#2cd8b7" />
          <pointLight position={[-2.2, -1.6, 2.8]} intensity={0.9} color="#2f8cff" />
          <RingModel percent={safe} />
        </Canvas>
      </div>

      <div className="pb-three-progress-copy">
        <small>{label}</small>
        <strong>{safe}%</strong>
        <p>{caption}</p>
      </div>
    </section>
  );
}
