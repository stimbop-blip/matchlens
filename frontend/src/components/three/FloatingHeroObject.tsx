import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

type FloatingHeroType = "trophy" | "football" | "tennis";

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
      <mesh scale={1.38}>
        <sphereGeometry args={[0.7, 24, 24]} />
        <meshBasicMaterial color="#2f8cff" transparent opacity={0.1} />
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
      <mesh scale={1.35}>
        <sphereGeometry args={[0.68, 22, 22]} />
        <meshBasicMaterial color="#e0ff76" transparent opacity={0.11} />
      </mesh>
    </group>
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
      {type === "football" ? <Football /> : null}
      {type === "tennis" ? <Tennis /> : null}
      {type === "trophy" ? <Trophy /> : null}
    </group>
  );
}
