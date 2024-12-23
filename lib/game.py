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
        # Get active attackers
        active_attackers = [drone for drone in self.attackers if not drone.is_disabled]
        
        for drone in active_attackers:
            # Check for collisions with protected objects
            closest_distance = 1000000
            closest_obj = None
            active_objects = [obj for obj in self.protected_objects if not obj["is_destroyed"]]
            for obj in active_objects:
                # Calculate distance between drone and object
                distance = ((drone.position.x - obj["position"]["x"])**2 + 
                          (drone.position.y - obj["position"]["y"])**2 + 
                          (drone.position.z - obj["position"]["z"])**2)**0.5
                if distance < closest_distance: 
                    closest_distance = distance
                    closest_obj = obj
            # If within 5 units, destroy object and disable drone
            if closest_distance < 5:
                closest_obj["is_destroyed"] = True
                drone.disable()
            # Add check for closest_obj before accessing it
            elif closest_obj is not None:
                drone.update_towards_target(
                    target_x=closest_obj["position"]["x"],
                    target_y=closest_obj["position"]["y"],
                    target_z=closest_obj["position"]["z"]
                )
            # If no valid targets remain, disable the drone
            else:
                drone.disable()

        active_attackers = [drone for drone in self.attackers if not drone.is_disabled]        
        active_defenders = [drone for drone in self.defenders if not drone.is_disabled]
        for drone in active_defenders:
            closest_attacker = None
            closest_distance = 1000000
            for attacker in active_attackers:
                distance = ((drone.position.x - attacker.position.x)**2 + 
                          (drone.position.y - attacker.position.y)**2 + 
                          (drone.position.z - attacker.position.z)**2)**0.5
                if distance < closest_distance: 
                    closest_distance = distance
                    closest_attacker = attacker
            if closest_distance < 5:
                closest_attacker.disable()
            
            if closest_attacker is not None:
                drone.update_towards_target(target_x=closest_attacker.position.x, target_y=closest_attacker.position.y, target_z=closest_attacker.position.z)

            drone.update_towards_target(target_x=0, target_y=0, target_z=0)
        return self.get_state()