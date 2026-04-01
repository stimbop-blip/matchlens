import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Component, Suspense, useMemo, useRef } from "react";
import type { ReactNode } from "react";
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

let preloadScheduled = false;

function scheduleSafePreload() {
  if (preloadScheduled || typeof window === "undefined") return;
  preloadScheduled = true;

  const run = () => {
    const paths = [MODEL_MAP.trophy, MODEL_MAP.football, MODEL_MAP.tennis];
    for (const path of paths) {
      try {
        useGLTF.preload(path);
      } catch {
        // Ignore preload errors; runtime fallback mesh will be shown.
      }
    }
  };

  const withIdle = window as typeof window & {
    requestIdleCallback?: (cb: () => void) => number;
  };

  if (typeof withIdle.requestIdleCallback === "function") {
    withIdle.requestIdleCallback(run);
    return;
  }
  window.setTimeout(run, 0);
}

scheduleSafePreload();

function Model({ type }: { type: HeroObjectType }) {
  const gltf = useGLTF(MODEL_MAP[type]);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  return <primitive object={scene} />;
}

function FallbackMesh({ color = "#00ff9d" }: { color?: string }) {
  return (
    <group>
      <mesh>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshStandardMaterial color="#f0f4f7" metalness={0.35} roughness={0.45} />
      </mesh>
      <mesh scale={1.35}>
        <sphereGeometry args={[0.6, 24, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} />
      </mesh>
    </group>
  );
}

type ModelBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

type ModelBoundaryState = {
  hasError: boolean;
};

class ModelBoundary extends Component<ModelBoundaryProps, ModelBoundaryState> {
  state: ModelBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ModelBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(): void {
    // Swallow model load/render errors and keep app alive.
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
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
      <ModelBoundary fallback={<FallbackMesh color={glow} />}>
        <Suspense fallback={<FallbackMesh color={glow} />}>
          <Model type={type} />
        </Suspense>
      </ModelBoundary>

      <mesh ref={glowRef} scale={1.5}>
        <sphereGeometry args={[1, 28, 28]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.1} />
      </mesh>
    </group>
  );
}
