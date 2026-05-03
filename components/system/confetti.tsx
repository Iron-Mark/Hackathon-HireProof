'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  color: string
  size: number
  angle: number
  velocity: number
}

const COLORS = ['#58d04d', '#3da334', '#ffffff', '#a7f3d0', '#10b981']

export function Confetti() {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    const newParticles: Particle[] = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: 50,
      y: 50,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 8 + 4,
      angle: Math.random() * Math.PI * 2,
      velocity: Math.random() * 20 + 10,
    }))
    setParticles(newParticles)

    // Cleanup after 3 seconds
    const timer = setTimeout(() => setParticles([]), 3000)
    return () => clearTimeout(timer)
  }, [])

  if (particles.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ 
            x: '50vw', 
            y: '50vh', 
            scale: 0, 
            opacity: 1,
            rotate: 0 
          }}
          animate={{ 
            x: `calc(50vw + ${Math.cos(p.angle) * p.velocity * 20}px)`,
            y: `calc(50vh + ${Math.sin(p.angle) * p.velocity * 20}px + 200px)`,
            scale: [0, 1, 0.5],
            opacity: [1, 1, 0],
            rotate: 360
          }}
          transition={{ 
            duration: 2, 
            ease: 'easeOut' 
          }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  )
}
