'use client'

import dynamic from 'next/dynamic'
import { ErrorBoundary } from 'react-error-boundary'

const Scene = dynamic(() => import('./Scene'), { 
  ssr: false,
  loading: () => <div>Loading 3D scene...</div>
})

export default function DynamicScene() {
  return (
    <ErrorBoundary fallback={<div>Error loading 3D scene</div>}>
      <Scene />
    </ErrorBoundary>
  )
}