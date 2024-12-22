import { Box, Container, Heading } from '@chakra-ui/react'
import DynamicScene from './components/DynamicScene'

export default function Home() {
  return (
    <Box>
      <Container maxW="container.xl">
        <Heading my={4}>Welcome to My 3D Website</Heading>
      </Container>
      <Box h="600px">
        <DynamicScene />
      </Box>
    </Box>
  )
}