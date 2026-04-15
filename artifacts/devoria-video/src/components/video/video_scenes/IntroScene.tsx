import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video';

export function IntroScene() {
  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-transparent z-20"
      {...sceneTransitions.scaleFade}
    >
      <motion.div 
        className="flex items-center gap-4 mb-6"
        initial={{ opacity: 0, scale: 0.8, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div className="w-20 h-20 bg-blue-500 rounded-xl flex items-center justify-center rotate-45 shadow-[0_0_40px_rgba(59,130,246,0.5)]">
          <span className="text-white text-3xl font-bold -rotate-45 font-display">DT</span>
        </div>
        <h1 className="text-[6vw] font-bold text-white tracking-tight font-display">
          Devoria <span className="text-blue-400">Tech</span>
        </h1>
      </motion.div>
      
      <motion.p 
        className="text-[2.5vw] text-gray-300 font-display"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        Custom Software for Every Business
      </motion.p>
    </motion.div>
  );
}