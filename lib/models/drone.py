from pydantic import BaseModel
import random
import time
import math

class Position(BaseModel):
    x: float
    y: float
    z: float
    timestamp: float = time.time()
    velocity_x: float = 0.0
    velocity_y: float = 0.0
    velocity_z: float = 0.0
    pitch: float = 0.0
    yaw: float = 0.0
    roll: float = 0.0

    @property
    def speed(self) -> float:
        """Calculate the actual speed (magnitude of velocity vector)"""
        return (self.velocity_x**2 + self.velocity_y**2 + self.velocity_z**2)**0.5

    @property
    def heading(self) -> tuple[float, float]:
        """Returns (azimuth, elevation) in radians"""
        azimuth = math.atan2(self.velocity_y, self.velocity_x)
        elevation = math.atan2(self.velocity_z, (self.velocity_x**2 + self.velocity_y**2)**0.5)
        return (azimuth, elevation)

class DroneObject(BaseModel):
    position: Position
    size: float
    color: str  
    type: str
    history: list[Position] = []

    @property
    def max_speed(self) -> float:
        if self.type == "attacking":
            return 10.0
        elif self.type == "defending":
            return 16.0
        return 0.0

    @classmethod
    def create(cls, color, type,  x_range=None,  y_range=None, z_range=None, size_range=None):
        # Use provided ranges if given, otherwise use defaults
        x = random.uniform(0, x_range) if x_range else random.uniform(1, 1000)
        y = random.uniform(1, y_range) if y_range else random.uniform(1, 100) # Must be > 0
        z = random.uniform(0, z_range) if z_range else random.uniform(1, 1000)
        size = random.uniform(1, size_range) if size_range else random.uniform(1, 5)
        position = Position(x=x, y=y, z=z, speed=0)
        return cls(
            position=position,
            size=size,
            type=type,
            color=color,
            history=[position]
        )
    
    def update_position(self, new_x: float, new_y: float, new_z: float, 
                       velocity_x: float = 0.0, velocity_y: float = 0.0, velocity_z: float = 0.0,
                       pitch: float = 0.0, yaw: float = 0.0, roll: float = 0.0) -> None:
        # Create new position with current timestamp
        new_position = Position(
            x=new_x,
            y=new_y,
            z=new_z,
            velocity_x=velocity_x,
            velocity_y=velocity_y,
            velocity_z=velocity_z,
            pitch=pitch,
            yaw=yaw,
            roll=roll,
            timestamp=time.time()
        )
        
        # Add current position to history before updating
        self.history.append(self.position)
        
        # Update current position
        self.position = new_position

    def update_position_by_velocity(self, delta_time: float) -> None:
        """Update drone position based on current velocity and time delta"""
        new_x = self.position.x + (self.position.velocity_x * delta_time)
        new_y = self.position.y + (self.position.velocity_y * delta_time)
        new_z = self.position.z + (self.position.velocity_z * delta_time)
        
        self.update_position(
            new_x=new_x,
            new_y=new_y,
            new_z=new_z,
            velocity_x=self.position.velocity_x,
            velocity_y=self.position.velocity_y,
            velocity_z=self.position.velocity_z,
            pitch=self.position.pitch,
            yaw=self.position.yaw,
            roll=self.position.roll
        )

    def update_direction_to_target(self, target_x: float, target_y: float, target_z: float) -> None:
        """Update drone velocity direction to point towards a target position"""
        # Calculate direction vector to target
        direction_x = target_x - self.position.x
        direction_y = target_y - self.position.y
        direction_z = target_z - self.position.z
        
        # Normalize direction vector
        magnitude = (direction_x**2 + direction_y**2 + direction_z**2)**0.5
        if magnitude > 0:
            direction_x /= magnitude
            direction_y /= magnitude
            direction_z /= magnitude
            
            # Set velocity components using max speed
            self.position.velocity_x = direction_x * self.max_speed
            self.position.velocity_y = direction_y * self.max_speed
            self.position.velocity_z = direction_z * self.max_speed

    def update_towards_target(self, target_x: float, target_y: float, target_z: float) -> None:
        """Update drone position towards target, accounting for time passed since last update"""
        # Calculate time delta since last position update
        current_time = time.time()
        delta_time = current_time - self.position.timestamp
        
        # Update velocity direction towards target
        self.update_direction_to_target(target_x, target_y, target_z)
        
        # Update position using calculated velocity and time delta
        self.update_position_by_velocity(delta_time)

def create_drones(amount, type, color=None, strategy=None, formation=None):
    if type == "attacking":
        objects = []
        for _ in range(amount):
            drone = DroneObject.create(color=color, type=type)
            
            # Calculate direction vector to origin
            direction_x = -drone.position.x
            direction_y = -drone.position.y
            direction_z = -drone.position.z
            
            # Normalize direction vector
            magnitude = (direction_x**2 + direction_y**2 + direction_z**2)**0.5
            if magnitude > 0:
                direction_x /= magnitude
                direction_y /= magnitude 
                direction_z /= magnitude
            
            # Set velocity components using max speed
            drone.position.velocity_x = direction_x * drone.max_speed
            drone.position.velocity_y = direction_y * drone.max_speed
            drone.position.velocity_z = direction_z * drone.max_speed
            
            objects.append(drone)
        return objects
            
    elif type == "defending":
        # For defending drones, set y=0 and speed=0
        objects = []
        for _ in range(amount):
            drone = DroneObject.create(color=color, type=type)
            drone.position.y = 0
            drone.position.velocity_x = 0
            drone.position.velocity_y = 0
            drone.position.velocity_z = 0
            objects.append(drone)
        return objects
    objects = [DroneObject.create(color=color, type=type) for _ in range(amount)]
    return objects


