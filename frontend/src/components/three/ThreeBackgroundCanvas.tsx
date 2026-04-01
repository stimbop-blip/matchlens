import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group, Points } from "three";
import * as THREE from "three";

function ParticleCloud() {
  const pointsRef = useRef<Points>(null);
  const ringRef = useRef<Group>(null);

  const positions = useMemo(() => {
    const array = new Float32Array(420 * 3);
    for (let i = 0; i < 420; i += 1) {
      const radius = 1.8 + Math.random() * 3.4;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 3.2;
      array[i * 3] = Math.cos(theta) * radius;
      array[i * 3 + 1] = y;
      array[i * 3 + 2] = Math.sin(theta) * radius;
    }
    return array;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t * 0.02;
      pointsRef.current.rotation.x = Math.sin(t * 0.08) * 0.05;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.035;
      ringRef.current.position.y = Math.sin(t * 0.35) * 0.08;
    }
  });

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color="#2cd8b7" size={0.035} sizeAttenuation transparent opacity={0.45} depthWrite={false} />
      </points>

      <group ref={ringRef}>
        <mesh position={[2.4, 0.2, -2.4]}>
          <torusGeometry args={[0.9, 0.04, 14, 60]} />
          <meshBasicMaterial color="#2f8cff" transparent opacity={0.22} />
        </mesh>
        <mesh position={[-2.6, -0.3, -2.8]} rotation={[0.4, 0.2, 0.1]}>
          <torusGeometry args={[0.7, 0.03, 12, 56]} />
          <meshBasicMaterial color="#2cd8b7" transparent opacity={0.2} />
        </mesh>
      </group>
    </group>
  );
}

export function ThreeBackgroundCanvas() {
  return (
    <div className="pb-three-global-canvas" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 7], fov: 48 }} dpr={[1, 1.4]} gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}>
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#031018", 5.5, 13]} />
        <ambientLight intensity={0.36} />
        <pointLight position={[2.6, 2.1, 4]} intensity={0.9} color="#2cd8b7" />
        <pointLight position={[-2.3, -1.4, 3]} intensity={0.65} color="#2f8cff" />
        <ParticleCloud />
      </Canvas>
    </div>
  );
}
