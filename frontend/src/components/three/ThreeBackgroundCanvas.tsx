import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { useAppTheme } from "../../lib/theme";
import { NeonParticles } from "./NeonParticles";

function ParallaxField() {
  const rootRef = useRef<THREE.Group>(null);
  const targetRef = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      targetRef.current.set(x, y);
    };

    window.addEventListener("pointermove", onPointer, { passive: true });
    return () => window.removeEventListener("pointermove", onPointer);
  }, []);

  const clusters = useMemo(
    () =>
      Array.from({ length: 22 }).map((_, i) => ({
        id: i,
        pos: new THREE.Vector3((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 11, -2 - Math.random() * 10),
        scale: 0.15 + Math.random() * 0.45,
        speed: 0.15 + Math.random() * 0.55,
      })),
    [],
  );

  useFrame((state, delta) => {
    if (!rootRef.current) return;
    const t = targetRef.current.clone().multiplyScalar(0.16);
    rootRef.current.rotation.y = THREE.MathUtils.damp(rootRef.current.rotation.y, t.x, 3.5, delta);
    rootRef.current.rotation.x = THREE.MathUtils.damp(rootRef.current.rotation.x, -t.y * 0.6, 3.5, delta);
    rootRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.23) * 0.1;
  });

  return (
    <group ref={rootRef}>
      {clusters.map((node) => (
        <mesh key={node.id} position={node.pos} rotation={[node.speed, node.speed * 0.6, 0]} scale={node.scale}>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#00ff9d" emissive="#00ff9d" emissiveIntensity={0.2} roughness={0.22} metalness={0.85} transparent opacity={0.14} />
        </mesh>
      ))}
    </group>
  );
}

export function ThreeBackgroundCanvas() {
  const { theme } = useAppTheme();
  const isDark = theme === "dark";
  const [dpr, setDpr] = useState(1.4);

  useEffect(() => {
    setDpr(Math.min(window.devicePixelRatio || 1, 1.8));
  }, []);

  return (
    <div className="canvas-root">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 54 }}
        dpr={dpr}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <ambientLight intensity={isDark ? 0.45 : 0.7} />
        <pointLight position={[3, 4, 4]} intensity={isDark ? 1.5 : 1.25} color={isDark ? "#00ff9d" : "#00cc7a"} />
        <pointLight position={[-4, -2, 5]} intensity={1.1} color="#00b8ff" />

        <ParallaxField />
        <NeonParticles count={1100} spread={18} speed={0.35} />

        {isDark ? (
          <EffectComposer multisampling={0}>
            <Bloom intensity={0.82} luminanceThreshold={0.14} luminanceSmoothing={0.22} mipmapBlur />
            <ChromaticAberration
              blendFunction={BlendFunction.NORMAL}
              offset={new THREE.Vector2(0.0008, 0.0005)}
              radialModulation={false}
              modulationOffset={0}
            />
            <Vignette eskil={false} offset={0.18} darkness={0.78} />
            <Noise opacity={0.032} premultiply blendFunction={BlendFunction.SOFT_LIGHT} />
          </EffectComposer>
        ) : null}
      </Canvas>
    </div>
  );
}
