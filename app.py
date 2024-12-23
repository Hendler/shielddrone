from fastapi import FastAPI, WebSocket
from pydantic import BaseModel
from typing import List
import json
from lib.models.world import World
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
 
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app origin
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Store game state (in a real application, you might want to use a database)
game_state = {
    "is_active": False,
    "attackers": 0,
    "defenders": 0,
    "protected_objects": 0,
    "world_data": None  # Add world data storage
}

class GameConfig(BaseModel):
    num_attackers: int
    num_defenders: int
    num_protected_objects: int
    strategy: str
    formation: str

# Add these near the top of your file with other constants/configurations
AVAILABLE_STRATEGIES = [
    "Aggressive",
    "Defensive",
    "Patrol",
    "Random"
]

AVAILABLE_FORMATIONS = [
    "Circle",
    "Triangle",
    "Line",
    "Grid"
]

@app.post("/startgame")
async def start_game(config: GameConfig):
    global game_state
    
    # Validate strategy and formation
    if config.strategy not in AVAILABLE_STRATEGIES:
        return JSONResponse(
            status_code=400,
            content={"error": f"Invalid strategy. Must be one of: {AVAILABLE_STRATEGIES}"}
        )
    
    if config.formation not in AVAILABLE_FORMATIONS:
        return JSONResponse(
            status_code=400,
            content={"error": f"Invalid formation. Must be one of: {AVAILABLE_FORMATIONS}"}
        )
    
    # Create and generate world
    world = World(width=100, height=50, depth=100)
    world.generate_terrain()
    world_data = world.world_to_threejs()
    
    game_state = {
        "is_active": True,
        "attackers": config.num_attackers,
        "defenders": config.num_defenders,
        "protected_objects": config.num_protected_objects,
        "strategy": config.strategy,
        "formation": config.formation,
        "world_data": world_data
    }
    
    return game_state

@app.websocket("/ws/gamestate")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    try:
        while True:
            # Send current game state to the client
            await websocket.send_json(game_state)
            
            # You might want to add a delay here to control update frequency
            # await asyncio.sleep(1)
            
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()

@app.get("/strategies")
async def get_strategies():
    """Return list of available drone defense strategies"""
    return JSONResponse(content=AVAILABLE_STRATEGIES)

@app.get("/formations")
async def get_formations():
    """Return list of available drone formations"""
    return JSONResponse(content=AVAILABLE_FORMATIONS)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)