import { AnimatePresence, motion } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { IntroScene } from './video_scenes/IntroScene';
import { WaterPlantScene } from './video_scenes/WaterPlantScene';
import { PharmacyScene } from './video_scenes/PharmacyScene';
import { RestaurantScene } from './video_scenes/RestaurantScene';
import { SchoolScene } from './video_scenes/SchoolScene';
import { RetailScene } from './video_scenes/RetailScene';
import { OutroScene } from './video_scenes/OutroScene';

const SCENE_DURATIONS = {
  intro: 3500,
  waterplant: 4000,
  pharmacy: 4000,
  restaurant: 4000,
  school: 4000,
  retail: 4000,
  outro: 3000
};

// Colors for the floating background orb per scene
const orbColors = [
  'rgba(59, 130, 246, 0.4)', // intro (blue)
  'rgba(20, 184, 166, 0.4)', // water plant (teal)
  'rgba(34, 197, 94, 0.4)',  // pharmacy (green)
  'rgba(249, 115, 22, 0.4)', // restaurant (orange)
  'rgba(168, 85, 247, 0.4)', // school (purple)
  'rgba(239, 68, 68, 0.4)',  // retail (red)
  'rgba(59, 130, 246, 0.6)', // outro (blue)
];

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({
    durations: SCENE_DURATIONS,
  });

  return (
    <div className="w-full h-screen overflow-hidden relative bg-[#080c14]">
      
      {/* Background Base */}
      <img 
        src={`${import.meta.env.BASE_URL}images/tech-grid.png`} 
        alt="Tech Grid" 
        className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-screen"
      />
      <img 
        src={`${import.meta.env.BASE_URL}images/particles.png`} 
        alt="Particles" 
        className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen"
      />

      {/* Persistent Floating Orb */}
      <motion.div 
        className="absolute w-[60vw] h-[60vw] rounded-full blur-[100px] pointer-events-none"
        animate={{
          background: `radial-gradient(circle, ${orbColors[currentScene]}, transparent 70%)`,
          x: ['-10%', '30%', '-20%', '40%', '10%', '-30%', '50%'][currentScene],
          y: ['10%', '-20%', '30%', '-10%', '40%', '20%', '-30%'][currentScene],
          scale: [1, 1.2, 0.8, 1.1, 0.9, 1.3, 1][currentScene]
        }}
        transition={{ duration: 2, ease: "easeInOut" }}
        style={{
          top: '20%',
          left: '20%'
        }}
      />

      <AnimatePresence mode="popLayout">
        {currentScene === 0 && <IntroScene key="intro" />}
        {currentScene === 1 && <WaterPlantScene key="waterplant" />}
        {currentScene === 2 && <PharmacyScene key="pharmacy" />}
        {currentScene === 3 && <RestaurantScene key="restaurant" />}
        {currentScene === 4 && <SchoolScene key="school" />}
        {currentScene === 5 && <RetailScene key="retail" />}
        {currentScene === 6 && <OutroScene key="outro" />}
      </AnimatePresence>
    </div>
  );
}