'use client'

import dynamic from 'next/dynamic'

const ThreeScene = dynamic(() => import('./ThreeScene'), {
  ssr: false,
  loading: () => <div>Loading 3D scene...</div>
})

export default function Scene() {
  return <ThreeScene />
}