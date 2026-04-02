import { Canvas } from "@react-three/fiber";
import { motion } from "framer-motion";

type SubscriptionProgress3DProps = {
  percent: number;
  label?: string;
  caption?: string;
  height?: number;
};

function Ring({ progress }: { progress: number }) {
  const clamped = Math.max(0, Math.min(100, progress));
  const angle = (clamped / 100) * Math.PI * 2;

  return (
    <group>
      <mesh>
        <torusGeometry args={[0.8, 0.1, 32, 128]} />
        <meshStandardMaterial color="#333" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.72, 0.9, 80, 1, 0, angle]} />
        <meshStandardMaterial color="#00ff9d" emissive="#00ff9d" emissiveIntensity={0.6} metalness={0.8} roughness={0.25} />
      </mesh>
    </group>
  );
}

export function SubscriptionProgress3D({ percent, label = "Subscription", caption = "Access progress", height = 230 }: SubscriptionProgress3DProps) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div className="glass neon relative overflow-hidden" style={{ height, borderRadius: 22 }}>
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 2.6], fov: 44 }} dpr={[1, 1.2]} gl={{ antialias: false, powerPreference: "low-power" }}>
          <ambientLight intensity={0.9} />
          <pointLight position={[2, 2, 3]} intensity={1.4} color="#00ff9d" />
          <pointLight position={[-2, -1, 2]} intensity={1.0} color="#00b8ff" />
          <Ring progress={clamped} />
        </Canvas>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">{label}</p>
        <div className="mt-1 flex items-end justify-between">
          <motion.p className="text-3xl font-semibold text-[var(--text-primary)]">{clamped}%</motion.p>
          <p className="text-xs text-[var(--text-secondary)]">{caption}</p>
        </div>
      </div>
    </div>
  );
}
