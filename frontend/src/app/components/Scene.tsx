'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

export default function Scene() {
  return (
    <Canvas style={{ height: '100vh' }}>
      <OrbitControls />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />
      <mesh>
        <boxGeometry />
        <meshStandardMaterial color="orange" />
      </mesh>
    </Canvas>
  )
}