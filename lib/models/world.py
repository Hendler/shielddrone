from pydantic import BaseModel, Field
from typing import Dict, Tuple, List
import numpy as np
from noise import snoise2




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
    
    def generate_terrain(self, resolution: int = 100):
        """Generates realistic terrain using Perlin noise"""
        scale = 50.0
        octaves = 6
        persistence = 0.5
        lacunarity = 2.0

        for x in range(resolution):
            for z in range(resolution):
                # Generate height using Perlin noise
                nx = x/resolution - 0.5
                nz = z/resolution - 0.5
                height = snoise2(nx * scale, 
                               nz * scale, 
                               octaves=octaves, 
                               persistence=persistence, 
                               lacunarity=lacunarity)
                
                # Normalize height to 0-1 range and scale
                height = (height + 1) / 2
                y = int(height * resolution * 0.5)  # Scale height
                
                # Determine terrain type based on height
                if height < 0.3:
                    terrain_type = Terrain.WATER
                elif height < 0.5:
                    terrain_type = Terrain.SAND
                elif height < 0.7:
                    terrain_type = Terrain.GRASS
                else:
                    terrain_type = Terrain.MOUNTAIN
                    
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
