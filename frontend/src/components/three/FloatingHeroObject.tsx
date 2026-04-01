import { Html, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

type HeroObjectType = "trophy" | "football" | "tennis";

type Props = {
  type?: HeroObjectType;
  scale?: number;
  glow?: string;
};

const MODEL_MAP: Record<HeroObjectType, string> = {
  trophy: "/models/trophy.glb",
  football: "/models/football.glb",
  tennis: "/models/tennis.glb",
};

useGLTF.preload(MODEL_MAP.trophy);
useGLTF.preload(MODEL_MAP.football);
useGLTF.preload(MODEL_MAP.tennis);

function Model({ type }: { type: HeroObjectType }) {
  const gltf = useGLTF(MODEL_MAP[type]);
  return <primitive object={gltf.scene.clone()} />;
}

function LoaderFallback() {
  return (
    <Html center>
      <div className="rounded-full border border-[var(--border)] bg-[var(--surface)]/90 px-3 py-1 text-[11px] text-[var(--text-secondary)]">
        Loading 3D...
      </div>
    </Html>
  );
}

export function FloatingHeroObject({ type = "trophy", scale = 1, glow = "#00ff9d" }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const glowColor = useMemo(() => new THREE.Color(glow), [glow]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = t * 0.5;
    groupRef.current.rotation.x = Math.sin(t * 0.9) * 0.08;
    groupRef.current.position.y = Math.sin(t * 1.8) * 0.12;

    if (glowRef.current) {
      const s = 1 + Math.sin(t * 2.2) * 0.05;
      glowRef.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={groupRef} scale={scale}>
      <Suspense fallback={<LoaderFallback />}>
        <Model type={type} />
      </Suspense>

      <mesh ref={glowRef} scale={1.5}>
        <sphereGeometry args={[1, 28, 28]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.1} />
      </mesh>
    </group>
  );
}
