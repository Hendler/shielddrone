from fastapi import FastAPI, WebSocket
from pydantic import BaseModel
from typing import List
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from lib.game import Game
from lib.models.drone import FIXED_DELTA_TIME
from asyncio import sleep
import traceback
import uvicorn

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
gconfig = None

class GameConfig(BaseModel):
    num_attackers: int
    num_defenders: int
    num_protected_objects: int
    strategy: str
    formation: str

@app.post("/startgame")
async def start_game(config: GameConfig):
    try:
        global game 
        global gconfig # Add global declaration to modify the game object
        game = Game()  # Reinitialize game object
        gconfig= config.dict()
        game.start_game(gconfig)
        return game.get_state()
    except ValueError as e:
        return JSONResponse(
            status_code=400,
            content={"error": str(e)}
        )

@app.websocket("/ws/gamestate")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connection_open = True
    
    try:
        while True:
            if not connection_open:
                break
                
            global game
            if game:
                print("Updating game state")
                try:
                    game_state = game.update_game()
                    await websocket.send_json(game_state)
                except RuntimeError as ws_error:
                    # WebSocket is already closed
                    print(f"WebSocket communication error: {ws_error}")
                    connection_open = False
                    break
            
            # Wait for 0.1 second before next update
            await sleep(FIXED_DELTA_TIME)
            
    except Exception as e:
        print(f"WebSocket error: {e}")
        traceback.print_exc()
    finally:
        if connection_open:
            try:
                await websocket.close()
            except RuntimeError:
                # Ignore error if connection is already closed
                pass

@app.get("/strategies")
async def get_strategies():
    """Return list of available drone defense strategies"""
    return JSONResponse(content=Game.AVAILABLE_STRATEGIES)

@app.get("/formations")
async def get_formations():
    """Return list of available drone formations"""
    return JSONResponse(content=Game.AVAILABLE_FORMATIONS)

if __name__ == "__main__":

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)