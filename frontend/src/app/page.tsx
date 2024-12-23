'use client'

import { useEffect, useState } from 'react'
import { Box, Container, Heading, VStack, HStack, FormControl, FormLabel, NumberInput, NumberInputField, Select, Button, Switch } from '@chakra-ui/react'

interface GameConfig {
  attackingDrones: number;
  defendingDrones: number;
  assets: number;
  strategy: string;
  formation: string;
}

export default function Home() {
  const [strategies, setStrategies] = useState<string[]>([])
  const [formations, setFormations] = useState<string[]>([])
  const [gameStarted, setGameStarted] = useState(false)
  const [config, setConfig] = useState<GameConfig>({
    attackingDrones: 3,
    defendingDrones: 3,
    assets: 3,
    strategy: '',
    formation: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [strategiesRes, formationsRes] = await Promise.all([
          fetch('http://localhost:8000/strategies'),
          fetch('http://localhost:8000/formations')
        ])
        const strategiesData = await strategiesRes.json()
        const formationsData = await formationsRes.json()
        
        setStrategies(strategiesData)
        setFormations(formationsData)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      }
    }
    fetchData()
  }, [])

  const handleStartGame = async () => {
    try {
      const response = await fetch('http://localhost:8000/startgame', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      })
      
      if (response.ok) {
        setGameStarted(true)
        // Connect to gamestate (you might want to use WebSocket here)
        // Example: connectToGameState()
      }
    } catch (error) {
      console.error('Failed to start game:', error)
    }
  }

  return (
    <Box bg="black" color="white" minH="100vh">
      <Container maxW="container.xl">
        <Box position="absolute" top={4} left={4} width="200px">
          <img src="/images/SAI-Logo-Horizontal-White.svg" alt="SAI Logo" width="100%" />
        </Box>
        <Heading my={4} color="white">Drone Shield Demo</Heading>
        
        <HStack spacing={4} align="start">
          {/* Left Column - 45% */}
          <Box w="45%">
            {/* Content for left column */}
          </Box>

          {/* Middle Column - 45% */}
          <Box w="45%">
            {/* Content for middle column */}
          </Box>

          {/* Right Column - 10% - Controls */}
          <Box w="10%" display={gameStarted ? 'none' : 'block'}>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel color="white">Attacking Drones</FormLabel>
                <NumberInput 
                  min={0} 
                  value={config.attackingDrones}
                  onChange={(_, value) => setConfig(prev => ({ ...prev, attackingDrones: value }))}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel color="white">Defending Drones</FormLabel>
                <NumberInput min={0} defaultValue={3} precision={0}>
                  <NumberInputField />
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel color="white">Assets</FormLabel>
                <NumberInput min={0} defaultValue={3} precision={0}>
                  <NumberInputField />
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel color="white">Strategy</FormLabel>
                <Select 
                  value={config.strategy}
                  onChange={(e) => setConfig(prev => ({ ...prev, strategy: e.target.value }))}
                  color="white"
                  sx={{
                    'option': {
                      color: 'black'  // Options need to remain dark for visibility against white background
                    }
                  }}
                >
                  {strategies.map(strategy => (
                    <option key={strategy}>{strategy}</option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel color="white">Formation</FormLabel>
                <Select 
                  value={config.formation}
                  onChange={(e) => setConfig(prev => ({ ...prev, formation: e.target.value }))}
                  color="white"
                  sx={{
                    'option': {
                      color: 'black'  // Options need to remain dark for visibility against white background
                    }
                  }}
                >
                  {formations.map(formation => (
                    <option key={formation}>{formation}</option>
                  ))}
                </Select>
              </FormControl>

              <Button colorScheme="blue" onClick={handleStartGame}>
                Start Game
              </Button>

              <FormControl display="none"> {/* Initially hidden */}
                <FormLabel color="white">Camera View</FormLabel>
                <Switch />
              </FormControl>
            </VStack>
          </Box>
        </HStack>
      </Container>
    </Box>
  )
}