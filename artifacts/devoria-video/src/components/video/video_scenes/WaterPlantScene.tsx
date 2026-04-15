import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video';

export function WaterPlantScene() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-20"
      {...sceneTransitions.slideUp}
    >
      <div className="absolute top-10 left-10">
        <motion.h2 
          className="text-4xl font-display font-bold text-teal-400"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          Water Plant Manager
        </motion.h2>
      </div>

      <motion.div 
        className="w-[70vw] h-[60vh] bg-[#1e1e2e] rounded-xl border border-teal-500/30 shadow-[0_20px_50px_rgba(20,184,166,0.2)] overflow-hidden flex flex-col"
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25 }}
      >
        {/* Window Header */}
        <div className="h-8 bg-[#2a2a3c] flex items-center px-4 gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <div className="text-xs text-gray-400 ml-4 font-mono">WaterPlant_Dashboard.exe</div>
        </div>

        <div className="flex flex-1 p-6 gap-6">
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex gap-4">
              <motion.div className="flex-1 bg-[#2a2a3c] p-4 rounded-lg border border-white/5" animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}>
                <p className="text-gray-400 text-sm">Daily Sales</p>
                <p className="text-3xl font-bold text-white mt-1">Rs 45,200</p>
              </motion.div>
              <motion.div className="flex-1 bg-[#2a2a3c] p-4 rounded-lg border border-white/5" animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }} transition={{ delay: 0.1 }}>
                <p className="text-gray-400 text-sm">Active Deliveries</p>
                <p className="text-3xl font-bold text-teal-400 mt-1">128</p>
              </motion.div>
            </div>

            <motion.div className="flex-1 bg-[#2a2a3c] rounded-lg border border-white/5 p-4" animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}>
              <p className="text-gray-400 text-sm mb-4">Recent Customers</p>
              <div className="space-y-3">
                {['Ahmed Khan', 'Fatima Ali', 'Raza Malik'].map((name, i) => (
                  <motion.div 
                    key={name}
                    className="flex justify-between items-center bg-[#1e1e2e] p-3 rounded"
                    initial={{ opacity: 0, x: -20 }}
                    animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.15 }}
                  >
                    <span className="text-white">{name}</span>
                    <span className="text-teal-400 font-mono">19L Bottle x 2</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}