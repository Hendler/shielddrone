from pydantic import BaseModel, Field
from typing import Dict, Tuple, List
import numpy as np




class Terrain:
    """Represents different terrain types and their properties"""
    WATER = "water"
    GRASS = "grass"
    MOUNTAIN = "mountain"
    SAND = "sand"

class World(BaseModel):
    """Represents a 3D world with dimensions and terrain"""
    width: float = Field(..., description="Width of the world in feet")
    height: float = Field(..., description="Height of the world in feet")
    depth: float = Field(..., description="Depth of the world in feet")
    
    # Terrain is stored as a 3D grid of values
    # Each position contains a terrain type
    terrain_grid: Dict[Tuple[int, int, int], str] = Field(
        default_factory=dict,
        description="3D grid mapping coordinates to terrain types"
    )
    
    def generate_random_terrain(self, resolution: int = 10):
        """Generates random terrain at specified resolution"""
        for x in range(resolution):
            for y in range(resolution):
                for z in range(resolution):
                    # Simple example - you might want more sophisticated terrain generation
                    terrain_type = np.random.choice(
                        [Terrain.WATER, Terrain.GRASS, Terrain.MOUNTAIN, Terrain.SAND]
                    )
                    self.terrain_grid[(x, y, z)] = terrain_type

    def world_to_threejs(self):
        """Convert World model to Three.js compatible format"""
        return {
            "dimensions": {
                "width": self.width,
                "height": self.height,
                "depth": self.depth
            },
            "terrain": [
                {
                    "position": list(pos),
                    "type": terrain_type,
                }
                for pos, terrain_type in self.terrain_grid.items()
            ]
        }
