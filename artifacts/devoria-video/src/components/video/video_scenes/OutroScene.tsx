import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video';

export function OutroScene() {
  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#080c14] z-30"
      {...sceneTransitions.scaleFade}
    >
      <motion.div 
        className="w-24 h-24 bg-blue-500 rounded-xl flex items-center justify-center rotate-45 shadow-[0_0_60px_rgba(59,130,246,0.6)] mb-8"
        initial={{ scale: 0, rotate: 0 }}
        animate={{ scale: 1, rotate: 45 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <span className="text-white text-4xl font-bold -rotate-45 font-display">DT</span>
      </motion.div>
      
      <motion.h1 
        className="text-[5vw] font-bold text-white tracking-tight font-display mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        devoria.tech
      </motion.h1>

      <motion.p 
        className="text-[2vw] text-blue-400 font-display font-medium"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        We Build Software That Works
      </motion.p>
    </motion.div>
  );
}