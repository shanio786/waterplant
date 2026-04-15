import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video';

export function RestaurantScene() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 1400),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-20"
      {...sceneTransitions.slideUp}
    >
      <div className="absolute bottom-10 left-10">
        <motion.h2 
          className="text-4xl font-display font-bold text-orange-500"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Restaurant Billing
        </motion.h2>
      </div>

      <motion.div 
        className="w-[70vw] h-[65vh] bg-[#111827] rounded-xl border border-orange-500/20 shadow-[0_20px_50px_rgba(249,115,22,0.15)] overflow-hidden flex flex-col"
        initial={{ scale: 0.8, opacity: 0, rotateX: -10 }}
        animate={{ scale: 1, opacity: 1, rotateX: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        style={{ perspective: 1000 }}
      >
        {/* Window Header */}
        <div className="h-8 bg-[#1f2937] flex items-center px-4 gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-600"></div>
          <div className="w-3 h-3 rounded-full bg-gray-600"></div>
          <div className="w-3 h-3 rounded-full bg-gray-600"></div>
          <div className="text-xs text-gray-400 ml-4 font-mono">DinePOS_Terminal.exe</div>
        </div>

        <div className="flex flex-1 p-6 gap-6">
          {/* Tables Grid */}
          <div className="w-2/3 flex flex-col gap-4">
            <motion.div className="flex justify-between items-center" animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}>
              <h3 className="text-white font-medium">Floor Plan</h3>
              <div className="flex gap-2">
                <span className="text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-400">Occupied (4)</span>
                <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-400">Available (8)</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-4 gap-4 flex-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((table, i) => {
                const isOccupied = [2, 5, 7, 9].includes(table);
                return (
                  <motion.div 
                    key={table}
                    className={`rounded-lg flex flex-col items-center justify-center p-2 border ${isOccupied ? 'bg-orange-500/10 border-orange-500/30' : 'bg-gray-800 border-gray-700'}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={phase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <span className={`text-lg font-bold ${isOccupied ? 'text-orange-400' : 'text-gray-500'}`}>T-{table}</span>
                    {isOccupied && <span className="text-xs text-gray-400 mt-1">Rs {Math.floor(Math.random() * 5000) + 1000}</span>}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Current Order */}
          <motion.div 
            className="w-1/3 bg-[#1f2937] rounded-lg border border-gray-700 flex flex-col"
            initial={{ opacity: 0, x: 20 }}
            animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
          >
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white font-medium">Table 7 Order</h3>
              <p className="text-sm text-gray-400">Server: Ali Hassan</p>
            </div>
            <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
              {[
                { item: 'Chicken Karahi (Half)', price: 1200 },
                { item: 'Garlic Naan x4', price: 240 },
                { item: 'Mint Margarita x2', price: 500 },
              ].map((order, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-300">{order.item}</span>
                  <span className="text-white font-mono">Rs {order.price}</span>
                </div>
              ))}
            </div>
            <div className="p-4 bg-gray-800 rounded-b-lg border-t border-gray-700 flex justify-between items-center">
              <span className="text-gray-400 font-medium">Total</span>
              <span className="text-2xl font-bold text-orange-500 font-mono">Rs 1,940</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}