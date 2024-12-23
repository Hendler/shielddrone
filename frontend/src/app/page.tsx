'use client'

import { useEffect, useState, useRef } from 'react'
import { Box, Container, Heading, VStack, HStack, FormControl, FormLabel, NumberInput, NumberInputField, Select, Button, Switch } from '@chakra-ui/react'
import { WorldVisualization } from './components/WorldVisualization'

interface GameConfig {
  num_attackers: number;
  num_defenders: number;
  num_protected_objects: number;
  strategy: string;
  formation: string;
}

export default function Home() {
  const [strategies, setStrategies] = useState<string[]>([])
  const [formations, setFormations] = useState<string[]>([])
  const [gameStarted, setGameStarted] = useState(false)
  const [config, setConfig] = useState<GameConfig>({
    num_attackers: 3,
    num_defenders: 3,
    num_protected_objects: 3,
    strategy: '',
    formation: ''
  })
  const [gameState, setGameState] = useState<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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
        
        // Set initial strategy and formation once data is loaded
        if (strategiesData.length > 0) {
          setConfig(prev => ({ ...prev, strategy: strategiesData[0] }))
        }
        if (formationsData.length > 0) {
          setConfig(prev => ({ ...prev, formation: formationsData[0] }))
        }
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
      });
      
      if (response.ok) {
        const initialGameState = await response.json();
        setGameStarted(true);
        
        // Store the initial game state
        setGameState(initialGameState);
        
        // Connect to WebSocket for future updates
        connectToWebSocket();
      }
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  }

  const connectToWebSocket = () => {
    const ws = new WebSocket('ws://localhost:8000/ws/gamestate');
    
    ws.onmessage = (event) => {
      const newGameState = JSON.parse(event.data);
      setGameState(newGameState);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  };

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
            {gameStarted && gameState && (
              <>
                <Box
                  ref={containerRef}
                  w="100%"
                  h="600px"
                  border="2px solid red"
                  className="world-container"
                />
                <WorldVisualization
                  containerRef={containerRef}
                  worldData={gameState}
                />
              </>
            )}
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
                  value={config.num_attackers}
                  onChange={(_, value) => setConfig(prev => ({ ...prev, num_attackers: value }))}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel color="white">Defending Drones</FormLabel>
                <NumberInput 
                  min={0} 
                  value={config.num_defenders}
                  onChange={(_, value) => setConfig(prev => ({ ...prev, num_defenders: value }))}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel color="white">Assets</FormLabel>
                <NumberInput 
                  min={0} 
                  value={config.num_protected_objects}
                  onChange={(_, value) => setConfig(prev => ({ ...prev, num_protected_objects: value }))}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel color="white">Strategy</FormLabel>
                <Select 
                  value={config.strategy}
                  onChange={(e) => {
                    console.log('Selected strategy:', e.target.value);
                    setConfig(prev => {
                      console.log('Previous config:', prev);
                      const newConfig = { ...prev, strategy: e.target.value };
                      console.log('New config:', newConfig);
                      return newConfig;
                    });
                  }}
                  color="white"
                  sx={{
                    'option': {
                      color: 'black'
                    }
                  }}
                >
                  {strategies.map(strategy => (
                    <option key={strategy} value={strategy}>{strategy}</option>
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