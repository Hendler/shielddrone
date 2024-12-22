from fastapi import FastAPI, WebSocket
from pydantic import BaseModel
from typing import List
import json

app = FastAPI()

# Store game state (in a real application, you might want to use a database)
game_state = {
    "is_active": False,
    "attackers": 0,
    "defenders": 0,
    "protected_objects": 0,
    # Add other game state variables as needed
}

class GameConfig(BaseModel):
    num_attackers: int
    num_defenders: int
    num_protected_objects: int

@app.post("/startgame")
async def start_game(config: GameConfig):
    global game_state
    
    game_state = {
        "is_active": True,
        "attackers": config.num_attackers,
        "defenders": config.num_defenders,
        "protected_objects": config.num_protected_objects
    }
    
    return {"message": "Game started", "game_state": game_state}

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)