import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video';

export function SchoolScene() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 1600),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-20"
      {...sceneTransitions.morphExpand}
    >
      <div className="absolute top-10 flex w-full justify-center">
        <motion.h2 
          className="text-4xl font-display font-bold text-purple-400"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          School Management
        </motion.h2>
      </div>

      <motion.div 
        className="w-[75vw] h-[60vh] bg-white rounded-xl border border-purple-200 shadow-[0_20px_50px_rgba(168,85,247,0.15)] overflow-hidden flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 25 }}
      >
        {/* Window Header */}
        <div className="h-8 bg-purple-50 flex items-center px-4 gap-2 border-b border-purple-100">
          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
          <div className="text-xs text-purple-600 ml-4 font-mono font-medium">EduManage_Pro.exe</div>
        </div>

        <div className="flex flex-1 p-6 gap-6">
          {/* Stats & Charts */}
          <div className="w-1/3 flex flex-col gap-6">
            <motion.div 
              className="bg-purple-50 p-5 rounded-xl border border-purple-100"
              animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            >
              <h3 className="text-sm font-medium text-purple-600 mb-1">Fee Collection (Oct)</h3>
              <p className="text-3xl font-bold text-gray-900">Rs 1.2M</p>
              <div className="mt-4 h-2 bg-purple-200 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-purple-500"
                  initial={{ width: 0 }}
                  animate={phase >= 2 ? { width: '85%' } : { width: 0 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">85% of total expected</p>
            </motion.div>

            <motion.div 
              className="flex-1 border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center relative"
              animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            >
              <h3 className="absolute top-4 left-4 text-sm font-medium text-gray-500">Today's Attendance</h3>
              <div className="relative w-32 h-32 mt-4">
                {/* SVG Donut Chart */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="50" stroke="#f3f4f6" strokeWidth="12" fill="none" />
                  <motion.circle 
                    cx="64" cy="64" r="50" 
                    stroke="#a855f7" 
                    strokeWidth="12" 
                    fill="none"
                    strokeDasharray="314"
                    initial={{ strokeDashoffset: 314 }}
                    animate={phase >= 3 ? { strokeDashoffset: 31 } : { strokeDashoffset: 314 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl font-bold text-gray-900">90%</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Student List */}
          <motion.div 
            className="w-2/3 border border-gray-200 rounded-xl overflow-hidden flex flex-col"
            animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          >
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-medium text-gray-700">Class 10-A Students</h3>
              <div className="px-3 py-1 bg-white border border-gray-300 rounded text-sm text-gray-500">Search...</div>
            </div>
            <div className="flex-1 p-0">
              <div className="px-4 py-2 border-b border-gray-100 grid grid-cols-4 text-xs font-medium text-gray-500 bg-white">
                <div className="col-span-2">Student Name</div>
                <div>Roll No</div>
                <div>Status</div>
              </div>
              <div className="divide-y divide-gray-50 bg-white">
                {[
                  { name: 'Sara Ahmed', roll: '10A-01', status: 'Present' },
                  { name: 'Zainab Bibi', roll: '10A-02', status: 'Present' },
                  { name: 'Omar Farooq', roll: '10A-03', status: 'Absent' },
                  { name: 'Ayesha Khan', roll: '10A-04', status: 'Present' },
                ].map((student, i) => (
                  <motion.div 
                    key={student.roll}
                    className="px-4 py-3 grid grid-cols-4 items-center text-sm"
                    initial={{ opacity: 0, x: 20 }}
                    animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="col-span-2 flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs">
                        {student.name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-800">{student.name}</span>
                    </div>
                    <div className="text-gray-500 font-mono">{student.roll}</div>
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.status === 'Absent' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {student.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}