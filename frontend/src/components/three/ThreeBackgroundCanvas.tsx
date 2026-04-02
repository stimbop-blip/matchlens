import { Suspense, useMemo, useRef } from "react";

import { Canvas, useFrame } from "@react-three/fiber";
import type { Points } from "three";

function ParticleCloud() {
  const pointsRef = useRef<Points>(null);

  const positions = useMemo(() => {
    const array = new Float32Array(280 * 3);
    for (let i = 0; i < 280; i += 1) {
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
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#2cd8b7" size={0.035} sizeAttenuation transparent opacity={0.42} depthWrite={false} />
    </points>
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
        <Suspense fallback={null}>
          <ParticleCloud />
        </Suspense>
      </Canvas>
    </div>
  );
}
