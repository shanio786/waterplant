import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video';

export function RetailScene() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1400),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-20"
      {...sceneTransitions.slideLeft}
    >
      <div className="absolute top-10 left-10">
        <motion.h2 
          className="text-4xl font-display font-bold text-red-500"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          Retail Inventory
        </motion.h2>
      </div>

      <motion.div 
        className="w-[75vw] h-[65vh] bg-[#18181b] rounded-xl border border-red-500/20 shadow-[0_20px_50px_rgba(239,68,68,0.15)] overflow-hidden flex flex-col"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 25 }}
      >
        {/* Window Header */}
        <div className="h-8 bg-[#0f172a] flex items-center px-4 justify-between border-b border-gray-800">
          <div className="text-xs text-gray-400 font-mono">RetailSync_Dashboard.exe</div>
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-600"></div>
            <div className="w-3 h-3 rounded-full bg-gray-600"></div>
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
          </div>
        </div>

        <div className="flex flex-1 p-6 gap-6">
          <div className="flex-1 flex flex-col gap-6">
            <div className="flex gap-4 h-24">
              {[
                { label: 'Total Revenue', value: 'Rs 145,000', color: 'text-white' },
                { label: 'Transactions', value: '342', color: 'text-gray-300' },
                { label: 'Avg Order Value', value: 'Rs 423', color: 'text-gray-300' },
              ].map((stat, i) => (
                <motion.div 
                  key={stat.label}
                  className="flex-1 bg-[#1f2937] p-4 rounded-lg border border-gray-800 flex flex-col justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <p className="text-sm text-gray-400">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
                </motion.div>
              ))}
            </div>

            <motion.div 
              className="flex-1 bg-[#1f2937] border border-gray-800 rounded-lg p-5 relative overflow-hidden"
              animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
            >
              <h3 className="text-sm font-medium text-gray-400 mb-6">Sales Trend (Last 7 Days)</h3>
              
              {/* Fake SVG Line Chart */}
              <div className="absolute inset-0 top-16 px-5 pb-5">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                  {/* Grid lines */}
                  <line x1="0" y1="25" x2="100" y2="25" stroke="#374151" strokeWidth="0.5" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#374151" strokeWidth="0.5" />
                  <line x1="0" y1="75" x2="100" y2="75" stroke="#374151" strokeWidth="0.5" />
                  
                  {/* Line */}
                  <motion.path 
                    d="M0,80 Q15,70 30,40 T60,50 T80,20 T100,10" 
                    fill="none" 
                    stroke="#ef4444" 
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={phase >= 3 ? { pathLength: 1 } : { pathLength: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                  />
                  
                  {/* Area under line */}
                  <motion.path 
                    d="M0,80 Q15,70 30,40 T60,50 T80,20 T100,10 L100,100 L0,100 Z" 
                    fill="url(#redGradient)"
                    initial={{ opacity: 0 }}
                    animate={phase >= 3 ? { opacity: 0.2 } : { opacity: 0 }}
                    transition={{ delay: 0.5, duration: 1 }}
                  />
                  <defs>
                    <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#1f2937" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </motion.div>
          </div>

          <motion.div 
            className="w-1/3 bg-[#1f2937] border border-gray-800 rounded-lg flex flex-col overflow-hidden"
            animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
          >
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-white font-medium">Top Selling Items</h3>
            </div>
            <div className="flex-1 p-4 flex flex-col gap-4">
              {[
                { name: 'Lays Chips (Large)', qty: 145, pct: '80%' },
                { name: 'Coca Cola 1.5L', qty: 98, pct: '60%' },
                { name: 'Nestle Juice 1L', qty: 76, pct: '45%' },
                { name: 'Dairy Milk Choc', qty: 54, pct: '30%' },
              ].map((item, i) => (
                <div key={item.name} className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">{item.name}</span>
                    <span className="text-gray-500">{item.qty} units</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-red-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={phase >= 3 ? { width: item.pct } : { width: 0 }}
                      transition={{ delay: i * 0.1 + 0.5, duration: 0.8 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}