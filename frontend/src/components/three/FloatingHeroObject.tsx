import { Suspense, useMemo, useRef } from "react";

import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

type FloatingHeroType =
  | "trophy"
  | "football"
  | "hockey"
  | "tennis"
  | "basketball"
  | "volleyball"
  | "baseball"
  | "mma"
  | "esports"
  | "darts"
  | "generic";

function Trophy() {
  return (
    <group>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.28, 0.42, 0.44, 24]} />
        <meshStandardMaterial color="#f6c77a" metalness={0.72} roughness={0.24} />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.26, 18]} />
        <meshStandardMaterial color="#f6c77a" metalness={0.7} roughness={0.28} />
      </mesh>
      <mesh position={[0, -0.18, 0]}>
        <cylinderGeometry args={[0.34, 0.4, 0.14, 22]} />
        <meshStandardMaterial color="#2f8cff" metalness={0.56} roughness={0.32} />
      </mesh>
      <mesh position={[0.24, 0.42, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.14, 0.03, 12, 28, Math.PI]} />
        <meshStandardMaterial color="#f6c77a" metalness={0.64} roughness={0.36} />
      </mesh>
      <mesh position={[-0.24, 0.42, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <torusGeometry args={[0.14, 0.03, 12, 28, Math.PI]} />
        <meshStandardMaterial color="#f6c77a" metalness={0.64} roughness={0.36} />
      </mesh>
      <mesh scale={1.42}>
        <sphereGeometry args={[0.78, 26, 26]} />
        <meshBasicMaterial color="#2cd8b7" transparent opacity={0.09} />
      </mesh>
    </group>
  );
}

function Football() {
  return (
    <group>
      <mesh>
        <icosahedronGeometry args={[0.52, 1]} />
        <meshStandardMaterial color="#f4f8ff" metalness={0.2} roughness={0.42} />
      </mesh>
      <mesh scale={0.74}>
        <dodecahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial color="#152434" metalness={0.2} roughness={0.6} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.52, 0.012, 10, 70]} />
        <meshStandardMaterial color="#dce5f3" metalness={0.12} roughness={0.74} />
      </mesh>
      <mesh scale={1.38}>
        <sphereGeometry args={[0.7, 24, 24]} />
        <meshBasicMaterial color="#2f8cff" transparent opacity={0.1} />
      </mesh>
      <mesh position={[0, -0.72, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35, 0.8, 32]} />
        <meshBasicMaterial color="#3be28b" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

function Hockey() {
  return (
    <group>
      <mesh position={[0, -0.04, 0]}>
        <cylinderGeometry args={[0.48, 0.48, 0.16, 26]} />
        <meshStandardMaterial color="#171d26" metalness={0.58} roughness={0.46} />
      </mesh>
      <mesh position={[0.2, 0.38, 0.06]} rotation={[0, 0, 0.45]}>
        <boxGeometry args={[0.1, 0.92, 0.08]} />
        <meshStandardMaterial color="#d8a66a" metalness={0.2} roughness={0.72} />
      </mesh>
      <mesh position={[0.36, -0.02, 0.06]} rotation={[0, 0, 0.45]}>
        <boxGeometry args={[0.34, 0.08, 0.08]} />
        <meshStandardMaterial color="#2d3f54" metalness={0.48} roughness={0.36} />
      </mesh>
      <mesh position={[0, -0.76, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.86, 44]} />
        <meshBasicMaterial color="#c9f0ff" transparent opacity={0.22} />
      </mesh>
    </group>
  );
}

function Tennis() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.5, 26, 26]} />
        <meshStandardMaterial color="#e0ff76" metalness={0.2} roughness={0.45} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.5, 0.015, 12, 60]} />
        <meshStandardMaterial color="#bfd95f" metalness={0.1} roughness={0.7} />
      </mesh>
      <mesh position={[0.42, -0.42, 0]} rotation={[0, 0, Math.PI / 5]}>
        <cylinderGeometry args={[0.04, 0.05, 0.62, 16]} />
        <meshStandardMaterial color="#5c3b2a" metalness={0.16} roughness={0.72} />
      </mesh>
      <mesh position={[0.08, -0.12, 0.04]} rotation={[0, 0, Math.PI / 5]}>
        <torusGeometry args={[0.34, 0.013, 10, 56]} />
        <meshStandardMaterial color="#d7dde8" metalness={0.3} roughness={0.6} />
      </mesh>
      <mesh scale={1.35}>
        <sphereGeometry args={[0.68, 22, 22]} />
        <meshBasicMaterial color="#e0ff76" transparent opacity={0.11} />
      </mesh>
    </group>
  );
}

function Basketball() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.52, 28, 28]} />
        <meshStandardMaterial color="#f39d4d" metalness={0.26} roughness={0.44} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.52, 0.015, 10, 72]} />
        <meshStandardMaterial color="#6e3f1d" metalness={0.1} roughness={0.8} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.52, 0.015, 10, 72]} />
        <meshStandardMaterial color="#6e3f1d" metalness={0.1} roughness={0.8} />
      </mesh>
    </group>
  );
}

function Volleyball() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.52, 28, 28]} />
        <meshStandardMaterial color="#f8fbff" metalness={0.18} roughness={0.36} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 3]}>
        <torusGeometry args={[0.42, 0.012, 10, 60]} />
        <meshStandardMaterial color="#b8c9de" metalness={0.2} roughness={0.7} />
      </mesh>
      <mesh rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[0.42, 0.012, 10, 60]} />
        <meshStandardMaterial color="#b8c9de" metalness={0.2} roughness={0.7} />
      </mesh>
    </group>
  );
}

function Baseball() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.45, 26, 26]} />
        <meshStandardMaterial color="#fcfdff" metalness={0.18} roughness={0.35} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[0.35, 0.01, 8, 40]} />
        <meshStandardMaterial color="#d96565" metalness={0.1} roughness={0.8} />
      </mesh>
    </group>
  );
}

function MMA() {
  return (
    <group>
      <mesh>
        <octahedronGeometry args={[0.54, 0]} />
        <meshStandardMaterial color="#5e8cff" metalness={0.56} roughness={0.33} />
      </mesh>
      <mesh position={[0, -0.76, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.7, 0.03, 10, 60]} />
        <meshBasicMaterial color="#2cd8b7" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

function Esports() {
  return (
    <group>
      <mesh>
        <boxGeometry args={[0.66, 0.66, 0.66]} />
        <meshStandardMaterial color="#74d3ff" metalness={0.62} roughness={0.28} />
      </mesh>
      <mesh scale={1.35}>
        <sphereGeometry args={[0.64, 22, 22]} />
        <meshBasicMaterial color="#2cd8b7" transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

function Darts() {
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.14, 0.44, 20]} />
        <meshStandardMaterial color="#ff7b7b" metalness={0.22} roughness={0.56} />
      </mesh>
      <mesh position={[0.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.44, 14]} />
        <meshStandardMaterial color="#d2e5f7" metalness={0.4} roughness={0.44} />
      </mesh>
    </group>
  );
}

function FallbackObject({ type }: { type: FloatingHeroType }) {
  const tone = useMemo(() => {
    if (type === "tennis") return "#e0ff76";
    if (type === "hockey") return "#c9f0ff";
    if (type === "football") return "#2f8cff";
    return "#2cd8b7";
  }, [type]);

  return (
    <mesh>
      <sphereGeometry args={[0.48, 24, 24]} />
      <meshStandardMaterial color={tone} emissive={tone} emissiveIntensity={0.22} metalness={0.38} roughness={0.4} />
    </mesh>
  );
}

export function FloatingHeroObject({ type = "trophy", scale = 1 }: { type?: FloatingHeroType; scale?: number }) {
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    const t = clock.elapsedTime;
    group.rotation.y = t * 0.55;
    group.rotation.x = Math.sin(t * 0.8) * 0.1;
    group.position.y = Math.sin(t * 1.8) * 0.09;
  });

  return (
    <group ref={groupRef} scale={scale}>
      <Suspense fallback={<FallbackObject type={type} />}>
        {type === "generic" ? <Trophy /> : null}
        {type === "football" ? <Football /> : null}
        {type === "hockey" ? <Hockey /> : null}
        {type === "tennis" ? <Tennis /> : null}
        {type === "basketball" ? <Basketball /> : null}
        {type === "volleyball" ? <Volleyball /> : null}
        {type === "baseball" ? <Baseball /> : null}
        {type === "mma" ? <MMA /> : null}
        {type === "esports" ? <Esports /> : null}
        {type === "darts" ? <Darts /> : null}
        {type === "trophy" ? <Trophy /> : null}
      </Suspense>
    </group>
  );
}
