'use client'

import { motion } from 'framer-motion'

export function WorldMap() {
  return (
    <div className="relative w-full aspect-[2/1] opacity-20 group-hover:opacity-30 transition-opacity duration-700">
      <svg
        viewBox="0 0 800 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-foreground"
      >
        {/* Simple simplified world map path */}
        <path
          d="M150 100 Q 180 80 200 120 T 250 140 T 300 100 T 350 120 T 400 100 T 450 140 T 500 100 T 550 120 T 600 100 T 650 140 T 700 100"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeDasharray="2 2"
        />
        <path
          d="M100 200 Q 150 180 200 220 T 300 200 T 400 240 T 500 200 T 600 220 T 700 200"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeDasharray="2 2"
        />
        
        {/* Activity Nodes */}
        {[
          { x: 200, y: 120, delay: 0 },
          { x: 450, y: 180, delay: 1.5 },
          { x: 600, y: 140, delay: 0.8 },
          { x: 300, y: 240, delay: 2.2 },
          { x: 150, y: 200, delay: 0.5 },
          { x: 550, y: 260, delay: 1.2 },
        ].map((node, i) => (
          <g key={i}>
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="3"
              className="fill-safe"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [1, 2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: node.delay,
              }}
            />
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="12"
              className="stroke-safe"
              strokeWidth="0.5"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [1, 3], opacity: [0.3, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: node.delay,
              }}
            />
          </g>
        ))}
      </svg>
      
      {/* Scanning Line overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-safe/5 to-transparent h-20 w-full pointer-events-none"
        animate={{ top: ['-20%', '120%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
    </div>
  )
}
