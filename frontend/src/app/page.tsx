'use client'

import { useEffect, useState, useRef } from 'react'
import { Box, Container, Heading, VStack, HStack, FormControl, FormLabel, NumberInput, NumberInputField, Select, Button, Switch, Text } from '@chakra-ui/react'
import { WorldVisualization } from './components/WorldVisualization'

interface GameConfig {
  num_attackers: number;
  num_defenders: number;
  num_protected_objects: number;
  strategy: string;
  formation: string;
}

// Add new interface for camera selection
interface CameraTarget {
  type: 'attacker' | 'defender' | 'protected_object';
  index: number;
}

export default function Home() {
  const [strategies, setStrategies] = useState<string[]>([])
  const [formations, setFormations] = useState<string[]>([])
  const [gameStarted, setGameStarted] = useState(false)
  const [config, setConfig] = useState<GameConfig>({
    num_attackers: 30,
    num_defenders: 3,
    num_protected_objects: 3,
    strategy: '',
    formation: ''
  })
  const [gameState, setGameState] = useState<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedCamera, setSelectedCamera] = useState<CameraTarget>({ type: 'defender', index: 0 });
  const droneCameraRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

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

  const handleStartGame = async (restart: boolean = false) => {
    try {
      // Reset game state first
      setGameState(null);
      
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
        console.log('restart type:', typeof restart, 'value:', restart);
        if (!restart) {
          connectToWebSocket();
        }
      }
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  }

  const connectToWebSocket = () => {
    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket('ws://localhost:8000/ws/gamestate');
    wsRef.current = ws;
    
    ws.onmessage = (event) => {
      const newGameState = JSON.parse(event.data);
      console.log('New game state:', newGameState);
      setGameState({...newGameState});
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      wsRef.current = null;
    };
  };

  // Clean up WebSocket on component unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <Box bg="black" color="white" minH="100vh">
       <Container maxW="90%" px={4} pt="50px">
        <Box position="absolute" top={4} left={4} width="200px">
          <img src="/images/SAI-Logo-Horizontal-White.svg" alt="SAI Logo" width="100%" />
        </Box>
       
        <Heading my={4} color="white">Drone Shield Demo</Heading>
        
        <HStack spacing={4} align="start">
          {/* Left Column - Main view - 45% */}
          <Box w="45%" mt={4}>
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

          {/* Middle Column - 45% - Drone Camera View */}
          <Box w="45%">
            {gameStarted && gameState && (
              <>

                <Box
                  ref={droneCameraRef}
                  w="100%"
                  h="600px"
                  border="2px solid blue"
                  className="drone-camera"
                />
                <WorldVisualization
                  containerRef={droneCameraRef}
                  worldData={gameState}
                  isDroneView={true}
                  cameraTarget={selectedCamera}
                />
              </>
            )}
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

              <Button colorScheme="blue" onClick={() => handleStartGame(false)}>
                Start Game
              </Button>
            </VStack>
          </Box>
          <Box width="10%" display={gameStarted ? 'block': 'none'}>                
            <FormControl mb={4}>
                  <FormLabel color="white">Camera View</FormLabel>
                  <Select
                    value={`${selectedCamera.type}-${selectedCamera.index}`}
                    onChange={(e) => {
                      const [type, index] = e.target.value.split('-');
                      setSelectedCamera({
                        type: type as CameraTarget['type'],
                        index: parseInt(index)
                      });
                    }}
                    color="white"
                    sx={{
                      'option': {
                        color: 'black'     
                      }
                    }}
                  >
                    {gameState?.defenders.map((_: any, i: number) => (
                      <option key={`defender-${i}`} value={`defender-${i}`}>
                        Defender {i + 1}
                      </option>
                    ))}
                    {gameState?.attackers.map((_: any, i: number) => (
                      <option key={`attacker-${i}`} value={`attacker-${i}`}>
                        Attacker {i + 1}
                      </option>
                    ))}
                    {gameState?.protected_objects.map((_: any, i: number) => (
                      <option key={`protected_object-${i}`} value={`protected_object-${i}`}>
                        Asset {i + 1}
                      </option>
                    ))}
                  </Select>
              </FormControl>
              
              <VStack spacing={2} align="stretch" mb={4}>
                <Heading size="sm" color="white">Statistics</Heading>
                <Box color="white">
                  <Text>Live Attackers: {gameState?.attackers?.filter((a: any) => !a.is_disabled).length || 0}</Text>
                  <Text>Disabled Attackers: {gameState?.attackers?.filter((a: any) => a.is_disabled).length || 0}</Text>
                  <Text>Active Defenders: {gameState?.defenders?.length || 0}</Text>
                  <Text>Live Assets: {gameState?.protected_objects?.filter((p: any) => !p.is_destroyed).length || 0}</Text>
                  <Text>Destroyed Assets: {gameState?.protected_objects?.filter((p: any) => p.is_destroyed).length || 0}</Text>
                </Box>
              </VStack>

              <Button colorScheme="blue" onClick={() => handleStartGame(true)}>
                Restart Game
              </Button>
          </Box>
        </HStack>
      </Container>
    </Box>
  )
}