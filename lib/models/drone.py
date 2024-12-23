from pydantic import BaseModel
import random
import time
import math
import logging

# Add near top of file
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

FIXED_DELTA_TIME = 0.5  

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
    is_disabled: bool = False
    history: list[Position] = []

    def disable(self):
        self.is_disabled = True 
        self.size = self.size * 2.0
        self.color = "yellow"
        self.position.velocity_x = 0
        self.position.velocity_y = 0
        self.position.velocity_z = 0

    @property
    def max_speed(self) -> float:
        if self.type == "attacking":
            return 10.0
        elif self.type == "defending":
            return 35.0
        return 0.0

    @classmethod
    def create(cls, color, type, x_range=None, y_range=None, z_range=None, size_range=None):
        # Use provided ranges if given, otherwise use defaults, ensuring minimums of 1
        x = random.uniform(1, x_range) if x_range else random.uniform(1, 500)
        y = random.uniform(1, y_range) if y_range else random.uniform(1, 500)
        z = random.uniform(1, z_range) if z_range else random.uniform(1, 500)
        size = random.uniform(1, size_range) if size_range else random.uniform(3, 5)
        position = Position(x=x, y=y, z=z)
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
        self.refresh_history()
        # Update current position
        self.position = new_position

    def update_position_by_velocity(self) -> None:
        """Update drone position based on current velocity and fixed time step"""
        # Log initial state
        delta_time: float = FIXED_DELTA_TIME
        logger.info(f"Drone state before update:")
        logger.info(f"  Position: ({self.position.x:.2f}, {self.position.y:.2f}, {self.position.z:.2f})")
        logger.info(f"  Velocity: ({self.position.velocity_x:.2f}, {self.position.velocity_y:.2f}, {self.position.velocity_z:.2f})")
        logger.info(f"  Delta time: {delta_time:.3f}")

        new_x = self.position.x + (self.position.velocity_x * delta_time)
        new_y = self.position.y + (self.position.velocity_y * delta_time)
        new_z = self.position.z + (self.position.velocity_z * delta_time)
        
        # Log calculated new position
        logger.info(f"Drone state after update:")
        logger.info(f"  New position: ({new_x:.2f}, {new_y:.2f}, {new_z:.2f})")
        
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
        direction_y = target_y - self.position.y # Ensure y direction is never negative
        direction_z = target_z - self.position.z
        
        # Normalize direction vector
        magnitude = math.sqrt(direction_x**2 + direction_y**2 + direction_z**2)  # Using math.sqrt for clarity
        if magnitude > 0:
            # Calculate unit vector components
            normalized_x = direction_x / magnitude
            normalized_y = direction_y / magnitude
            normalized_z = direction_z / magnitude
            
            # Set velocity components using max speed and maintain original direction
            self.position.velocity_x = normalized_x * self.max_speed
            self.position.velocity_y = normalized_y * self.max_speed
            self.position.velocity_z = normalized_z * self.max_speed

    def update_towards_target(self, target_x: float, target_y: float, target_z: float) -> None:
        """Update drone position towards target, accounting for time passed since last update"""
        # Calculate time delta since last position update
        
        # Update velocity direction towards target
        self.update_direction_to_target(target_x, target_y, target_z)
        
        # Update position using calculated velocity and time delta
        self.update_position_by_velocity()

    def refresh_history(self, distance_threshold: float = 1.0, time_threshold: float = 2.0) -> None:
        """
        Clean up position history by removing redundant points.
        
        Args:
            distance_threshold: Minimum distance between points to keep (in units)
            time_threshold: Minimum time between points to keep (in seconds)
        """
        if len(self.history) < 3:  # Keep if too few points
            return

        filtered_history = [self.history[0]]  # Always keep the first point
        
        for i in range(1, len(self.history) - 1):
            prev_pos = filtered_history[-1]
            curr_pos = self.history[i]
            
            # Calculate distance between points
            distance = ((curr_pos.x - prev_pos.x) ** 2 + 
                       (curr_pos.y - prev_pos.y) ** 2 + 
                       (curr_pos.z - prev_pos.z) ** 2) ** 0.5
            
            # Calculate time difference
            time_diff = curr_pos.timestamp - prev_pos.timestamp
            
            # Keep point if it represents significant change
            if distance > distance_threshold or time_diff > time_threshold:
                filtered_history.append(curr_pos)
        
        # Always keep the last point
        if self.history[-1] != filtered_history[-1]:
            filtered_history.append(self.history[-1])
        
        self.history = filtered_history

def create_drones(amount, type, color=None, strategy=None, formation=None):
    if type == "attacking":
        objects = []
        for _ in range(amount):
            drone = DroneObject.create(color=color, type=type)
            
            # Initialize with zero velocity instead of pointing to (1,1,1)
            drone.position.velocity_x = 0
            drone.position.velocity_y = 0
            drone.position.velocity_z = 0
            
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


