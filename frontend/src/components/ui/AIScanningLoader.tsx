import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function AIScanningLoader() {
  const [count, setCount] = useState(1874);

  useEffect(() => {
    let lastTime = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const timePassed = (now - lastTime) / 1000;

      setCount((prev) => {
        const growth = Math.floor(18 + Math.random() * 22);
        const noise = Math.floor(Math.random() * 13) - 6;

        let newCount = prev + Math.round(growth * timePassed) + noise;

        if (Math.random() < 0.12) {
          newCount += 35 + Math.floor(Math.random() * 45);
        }

        return Math.max(1720, Math.min(2890, newCount));
      });

      lastTime = now;
    }, 650);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-[560px] mx-auto px-4">
      <div className="relative bg-[#0a0b14] border border-[#1f2a44] rounded-3xl p-9 shadow-2xl overflow-hidden">
        <div className="relative mx-auto flex items-center justify-center" style={{ width: 292, height: 292 }}>
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute border border-[#5be3ff]/25 rounded-full"
              style={{ width: 272 - i * 40, height: 272 - i * 40 }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 24 + i * 6,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}

          <motion.div
            className="absolute w-[2px] h-[138px] bg-gradient-to-t from-transparent via-[#5be3ff] to-transparent origin-bottom"
            style={{ top: 77, left: "50%" }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 7.4,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          <motion.div
            className="absolute w-7 h-7 rounded-full bg-[#5be3ff]"
            animate={{
              scale: [1, 1.18, 1],
              boxShadow: [
                "0 0 25px #5be3ff",
                "0 0 55px #5be3ff",
                "0 0 25px #5be3ff",
              ],
            }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <div className="text-center mt-8">
          <p className="text-[#a8c0e0] text-[17px] font-semibold tracking-widest uppercase">
            ИИ АНАЛИЗИРУЕТ
          </p>

          <motion.p
            className="text-[54px] font-bold text-white tracking-[-2px] mt-1"
            key={count}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {count.toLocaleString("ru-RU")}
          </motion.p>

          <p className="text-[#8ca4c8] text-[15px] mt-1">
            матчей в реальном времени
          </p>
        </div>
      </div>
    </div>
  );
}
