from typing import Dict, List, Any
from lib.models.drone import create_drones
from lib.models.asset import create_protected_objects

class Game:
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

    def __init__(self):
        self.is_active = False
        self.attackers = []
        self.defenders = []
        self.protected_objects = []
        self.strategy = ""
        self.formation = ""

    def start_game(self, config: Dict[str, Any]) -> None:
        if config["strategy"] not in self.AVAILABLE_STRATEGIES:
            raise ValueError(f"Invalid strategy. Must be one of: {self.AVAILABLE_STRATEGIES}")
        
        if config["formation"] not in self.AVAILABLE_FORMATIONS:
            raise ValueError(f"Invalid formation. Must be one of: {self.AVAILABLE_FORMATIONS}")

        self.attackers = create_drones(
            config["num_attackers"], 
            "attacking", 
            "red", 
            config["strategy"], 
            config["formation"]
        )
        self.defenders = create_drones(
            config["num_defenders"], 
            "defending", 
            "blue", 
            config["strategy"], 
            config["formation"]
        )
        self.protected_objects = create_protected_objects(config["num_protected_objects"])
        self.is_active = True
        self.strategy = config["strategy"]
        self.formation = config["formation"]

    def get_state(self) -> Dict[str, Any]:
        return {
            "is_active": self.is_active,
            "attackers": [drone.dict() for drone in self.attackers],
            "defenders": [drone.dict() for drone in self.defenders],
            "protected_objects": self.protected_objects,
            "strategy": self.strategy,
            "formation": self.formation,
        }
    
    def update_game(self) -> Dict[str, Any]:
        for drone in self.attackers + self.defenders:
            drone.update_towards_target(target_x=0, target_y=0, target_z=0)
        return self.get_state()