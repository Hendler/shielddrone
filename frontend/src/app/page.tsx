import { Box, Container, Heading } from '@chakra-ui/react'
import dynamic from 'next/dynamic'

// Import Scene component dynamically to avoid SSR issues with Three.js
const Scene = dynamic(() => import('@/components/Scene'), { ssr: false })

export default function Home() {
  return (
    <Box>
      <Container maxW="container.xl">
        <Heading my={4}>Welcome to My 3D Website</Heading>
      </Container>
      <Box h="600px">
        <Scene />
      </Box>
    </Box>
  )
}