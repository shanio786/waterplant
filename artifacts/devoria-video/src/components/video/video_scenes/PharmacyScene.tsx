import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video';

export function PharmacyScene() {
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
      {...sceneTransitions.slideRight}
    >
      <div className="absolute top-10 right-10">
        <motion.h2 
          className="text-4xl font-display font-bold text-green-400"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          Pharmacy POS
        </motion.h2>
      </div>

      <motion.div 
        className="w-[75vw] h-[65vh] bg-[#f8fafc] rounded-xl border border-green-200 shadow-[0_20px_50px_rgba(34,197,94,0.15)] overflow-hidden flex flex-col"
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25 }}
      >
        {/* Window Header */}
        <div className="h-8 bg-gray-200 flex items-center px-4 gap-2 border-b border-gray-300">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
          <div className="text-xs text-gray-500 ml-4 font-mono font-medium">PharmaCare_v2.exe</div>
        </div>

        <div className="flex flex-1">
          {/* Sidebar */}
          <div className="w-48 bg-[#0f172a] p-4 flex flex-col gap-4">
            <div className="w-8 h-8 rounded bg-green-500/20 mb-4 flex items-center justify-center">
              <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
            </div>
            {['Dashboard', 'Inventory', 'Sales', 'Reports'].map((item, i) => (
              <div key={item} className={`p-2 rounded flex items-center gap-3 ${i === 1 ? 'bg-green-500/10 text-green-400' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-green-400' : 'bg-gray-600'}`}></div>
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 flex flex-col gap-6 bg-white">
            <div className="flex gap-4">
              <motion.div className="flex-1 bg-green-50 p-4 rounded-lg border border-green-100" animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}>
                <p className="text-gray-500 text-sm font-medium">Today's Sales</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">Rs 89,450</p>
              </motion.div>
              <motion.div className="flex-1 bg-red-50 p-4 rounded-lg border border-red-100 relative overflow-hidden" animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }} transition={{ delay: 0.1 }}>
                <p className="text-gray-500 text-sm font-medium">Low Stock Alerts</p>
                <p className="text-3xl font-bold text-red-600 mt-1">14 Items</p>
                <motion.div 
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              </motion.div>
            </div>

            <motion.div className="flex-1 border border-gray-200 rounded-lg overflow-hidden" animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}>
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 grid grid-cols-4 font-medium text-sm text-gray-500">
                <div className="col-span-2">Medicine Name</div>
                <div>Stock</div>
                <div>Status</div>
              </div>
              <div className="divide-y divide-gray-100">
                {[
                  { name: 'Panadol Extra 500mg', stock: 450, status: 'Good' },
                  { name: 'Augmentin 500mg', stock: 12, status: 'Low' },
                  { name: 'Brufen 400mg', stock: 85, status: 'Good' },
                ].map((med, i) => (
                  <motion.div 
                    key={med.name}
                    className="px-4 py-3 grid grid-cols-4 items-center text-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.15 }}
                  >
                    <div className="col-span-2 font-medium text-gray-800">{med.name}</div>
                    <div className="text-gray-600">{med.stock} strips</div>
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${med.status === 'Low' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {med.status}
                      </span>
                    </div>
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