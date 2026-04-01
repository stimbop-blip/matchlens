import { Canvas } from "@react-three/fiber";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { FloatingHeroObject } from "./FloatingHeroObject";

function objectByVariant(variant: number): "trophy" | "football" | "tennis" {
  if (variant % 3 === 1) return "football";
  if (variant % 3 === 2) return "tennis";
  return "trophy";
}

export function NewsCard3D({
  to,
  title,
  preview,
  date,
  variant,
}: {
  to: string;
  title: string;
  preview: string;
  date: string;
  variant: number;
}) {
  const type = objectByVariant(variant);

  return (
    <motion.article whileHover={{ y: -3 }} whileTap={{ scale: 0.995 }} transition={{ duration: 0.15, ease: "easeOut" }}>
      <Link className={`pb-news3d-card variant-${variant % 3}`} to={to}>
        <div className="pb-news3d-canvas" aria-hidden="true">
          <Canvas camera={{ position: [0, 0, 3], fov: 42 }} dpr={[1, 1.3]} gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}>
            <ambientLight intensity={0.8} />
            <pointLight position={[2, 1.8, 3]} intensity={1.1} color="#2cd8b7" />
            <pointLight position={[-2, -1.2, 2.7]} intensity={0.78} color="#2f8cff" />
            <FloatingHeroObject type={type} scale={0.82} />
          </Canvas>
        </div>

        <div className="pb-news3d-copy">
          <small>{date}</small>
          <h4>{title}</h4>
          <p>{preview}</p>
        </div>
      </Link>
    </motion.article>
  );
}
