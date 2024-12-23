from fastapi import FastAPI, WebSocket
from pydantic import BaseModel
from typing import List
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from lib.game import Game
from asyncio import sleep

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app origin
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Replace the game_state dictionary with Game instance
game = Game()

class GameConfig(BaseModel):
    num_attackers: int
    num_defenders: int
    num_protected_objects: int
    strategy: str
    formation: str

@app.post("/startgame")
async def start_game(config: GameConfig):
    try:
        game.start_game(config.dict())
        return game.get_state()
    except ValueError as e:
        return JSONResponse(
            status_code=400,
            content={"error": str(e)}
        )

@app.websocket("/ws/gamestate")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    try:
        while True:
            print("Updating game state")
            game_state = game.update_game()
            await websocket.send_json(game_state)
            
            # Wait for 1 second before next update
            await sleep(.1)
            
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()

@app.get("/strategies")
async def get_strategies():
    """Return list of available drone defense strategies"""
    return JSONResponse(content=Game.AVAILABLE_STRATEGIES)

@app.get("/formations")
async def get_formations():
    """Return list of available drone formations"""
    return JSONResponse(content=Game.AVAILABLE_FORMATIONS)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)