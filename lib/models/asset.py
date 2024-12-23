from pydantic import BaseModel
import random

class ProtectedObject(BaseModel):
    x: float
    y: float
    z: float
    size: float

    @classmethod
    def create_random(cls):
        return cls(
            x=random.uniform(0, 1000),
            y=0,  # Always 0 as specified
            z=random.uniform(0, 1000),
            size=random.uniform(1, 5)
        )

def create_protected_objects(num_protected_objects):
    objects = [ProtectedObject.create_random() for _ in range(num_protected_objects)]
    return [{
        "position": {
            "x": obj.x,
            "y": obj.y, 
            "z": obj.z
        },
        "size": obj.size
    } for obj in objects]


