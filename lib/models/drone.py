from pydantic import BaseModel
import random

class Position(BaseModel):
    x: float
    y: float
    z: float

    speed: float

class DroneObject(BaseModel):
    position: Position
    size: float
    color: str  
    history: list[Position] = []

    @classmethod
    def create_random(cls, color, x_range=None,  y_range=None, z_range=None, size_range=None):
        # Use provided ranges if given, otherwise use defaults
        x = random.uniform(0, x_range) if x_range else random.uniform(1, 1000)
        y = random.uniform(1, y_range) if y_range else random.uniform(1, 100) # Must be > 0
        z = random.uniform(0, z_range) if z_range else random.uniform(1, 1000)
        size = random.uniform(1, size_range) if size_range else random.uniform(1, 5)
        position = Position(x=x, y=y, z=z, speed=0)
        return cls(
            position=position,
            size=size,
            color=color,
            history=[position]
        )

def create_drones(amount, strategy=None, formation=None, color=None):
    objects = [DroneObject.create_random(color=color) for _ in range(amount)]
    return [{
        "position": {
            "x": obj.position.x,
            "y": obj.position.y, 
            "z": obj.position.z,
            "speed": obj.position.speed
        },
        "size": obj.size,
        "color": obj.color,
        "history": [
            {
                "x": pos.x,
                "y": pos.y,
                "z": pos.z,
                "speed": pos.speed
            } for pos in obj.history
        ]
    } for obj in objects]


