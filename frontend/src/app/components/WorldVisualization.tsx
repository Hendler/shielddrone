'use client'

import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

interface WorldVisualizationProps {
  containerRef: React.RefObject<HTMLDivElement>;
  worldData: any;
  isDroneView?: boolean;
  cameraTarget?: {
    type: 'attacker' | 'defender' | 'protected_object';
    index: number;
  };
}

export function WorldVisualization({ containerRef, worldData, isDroneView, cameraTarget }: WorldVisualizationProps) {
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  const setupKeyboardControls = useCallback(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      keysPressed.current[event.key.toLowerCase()] = true;
    };

    const onKeyUp = (event: KeyboardEvent) => {
      keysPressed.current[event.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      10000
    );
    cameraRef.current = camera;

    if (isDroneView) {
      camera.position.set(0, 50, 0);
      camera.lookAt(0, 0, 0);
    } else {
      camera.position.set(200, 200, 200);
      camera.lookAt(0, 0, 0);
    }

    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(rendererRef.current.domElement);

    const controls = new OrbitControls(camera, rendererRef.current.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minPolarAngle = 0;

    const gridSize = 1000;
    const gridDivisions = 100;
    
    const createHalfGrid = (size: number, divisions: number, color: number) => {
      const vertices = [];
      const step = size / divisions;
      
      // Draw lines parallel to x-axis
      for (let i = 0; i <= divisions; i++) {
        const y = i * step;
        vertices.push(0, y, 0);      // Start from 0 instead of -halfSize
        vertices.push(size, y, 0);    // Go to full size instead of halfSize
      }
      
      // Draw lines parallel to y-axis
      for (let i = 0; i <= divisions; i++) {
        const x = i * step;
        vertices.push(x, 0, 0);
        vertices.push(x, size, 0);
      }
      
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      const material = new THREE.LineBasicMaterial({ color });
      return new THREE.LineSegments(geometry, material);
    };
    
    const gridXZ = createHalfGrid(gridSize, gridDivisions, 0x444444);
    gridXZ.rotation.x = Math.PI / 2;
    gridXZ.name = 'gridXZ';
    scene.add(gridXZ);
    
    const gridXY = createHalfGrid(gridSize, gridDivisions, 0x444444);
    gridXY.name = 'gridXY';
    scene.add(gridXY);
    
    const gridYZ = createHalfGrid(gridSize, gridDivisions, 0x444444);
    gridYZ.rotation.y = -Math.PI / 2;
    gridYZ.name = 'gridYZ';
    scene.add(gridYZ);

    const axesHelper = new THREE.AxesHelper(100);
    axesHelper.setColors(0xff0000, 0xff0000, 0xff0000);
    scene.add(axesHelper);

    const createBox = (position: any, size: number, color: string) => {
      const geometry = new THREE.BoxGeometry(size, size, size);
      const material = new THREE.MeshBasicMaterial({ color: color || 0x00ff00 });
      const box = new THREE.Mesh(geometry, material);
      box.position.set(position.x, position.y, position.z);
      return box;
    };

    // const createDirectionArrow = (position: any, velocity: any, speed: number) => {
    //   const direction = new THREE.Vector3(
    //     velocity.velocity_x,
    //     velocity.velocity_y,
    //     velocity.velocity_z
    //   );
      
    //   if (direction.length() === 0) return null;

    //   // Increase visibility of arrows
    //   const arrowLength = 20; // Fixed length instead of using speed
    //   const headLength = arrowLength * 0.2; // 20% of arrow length
    //   const headWidth = headLength * 0.5; // 50% of head length
      
    //   const arrowHelper = new THREE.ArrowHelper(
    //     direction.normalize(),
    //     new THREE.Vector3(position.x, position.y, position.z),
    //     arrowLength,
    //     0xff0000, // Bright red color instead of white
    //     headLength,
    //     headWidth
    //   );
      
    //   return arrowHelper;
    // };

    worldData.attackers.forEach((attacker: any) => {
      const box = createBox(attacker.position, attacker.size, attacker.color);
      scene.add(box);
      
      // const arrow = createDirectionArrow(attacker.position, attacker, attacker.speed);
      // if (arrow) scene.add(arrow);
    });

    worldData.defenders.forEach((defender: any) => {
      const box = createBox(defender.position, defender.size, defender.color);
      scene.add(box);
      
      // const arrow = createDirectionArrow(defender.position, defender, defender.speed);
      // if (arrow) scene.add(arrow);
    });

    worldData.protected_objects.forEach((object: any) => {
      const box = createBox(object.position, object.size, 0x00ff00);
      scene.add(box);
    });

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    const moveSpeed = 10.0;
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (isDroneView && cameraTarget && worldData) {
        const targetObject = worldData[`${cameraTarget.type}s`]?.[cameraTarget.index];
        if (targetObject) {
          const targetPos = targetObject.position;
          camera.position.set(targetPos.x, targetPos.y + 50, targetPos.z);
          camera.lookAt(targetPos.x, targetPos.y, targetPos.z);
        }
      }

      if (cameraRef.current) {
        // Get the camera's forward direction (negative z-axis)
        const forward = new THREE.Vector3();
        cameraRef.current.getWorldDirection(forward);
        forward.y = 0; // Lock movement to the horizontal plane
        forward.normalize();
        
        // Calculate the right vector by crossing forward with world up
        const right = new THREE.Vector3();
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
        
        const moveDirection = new THREE.Vector3();
        
        if (keysPressed.current['w']) {
          moveDirection.add(forward.multiplyScalar(moveSpeed));
        }
        if (keysPressed.current['s']) {
          moveDirection.sub(forward.multiplyScalar(moveSpeed));
        }
        if (keysPressed.current['a']) {
          moveDirection.sub(right.multiplyScalar(moveSpeed));
        }
        if (keysPressed.current['d']) {
          moveDirection.add(right.multiplyScalar(moveSpeed));
        }
        
        cameraRef.current.position.add(moveDirection);
      }

      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && cameraRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    const cleanupKeyboardControls = setupKeyboardControls();
    
    animate();

    return () => {
      cleanupKeyboardControls();
      controls.dispose();
      if (rendererRef.current) {
        rendererRef.current.dispose();
        containerRef.current?.removeChild(rendererRef.current.domElement);
        rendererRef.current = null;
      }
      window.removeEventListener('resize', handleResize);
      scene.clear();
    };
  }, [containerRef, setupKeyboardControls, isDroneView, cameraTarget]);

  useEffect(() => {
    if (!worldData || !sceneRef.current) return;

    const objectsToRemove = sceneRef.current.children.filter(
      child => (child instanceof THREE.Mesh || child instanceof THREE.ArrowHelper || child instanceof THREE.Line) 
               && !child.name?.includes('grid')
    );
    objectsToRemove.forEach(obj => sceneRef.current?.remove(obj));

    const createBox = (position: any, size: number, color: string) => {
      const geometry = new THREE.BoxGeometry(size, size, size);
      const material = new THREE.MeshBasicMaterial({ color: color || 0x00ff00 });
      const box = new THREE.Mesh(geometry, material);
      box.position.set(position.x, position.y, position.z);
      return box;
    };

    // Updated function to create trail from position history
    const createTrajectoryTrail = (positions: any[], color: string) => {
      if (!positions || positions.length < 2) return null;

      const curves: THREE.QuadraticBezierCurve3[] = [];
      
      // Create a curve for each pair of consecutive positions
      for (let i = 0; i < positions.length - 1; i++) {
        const currentPos = positions[i];
        const nextPos = positions[i + 1];
        
        // Create control point for the curve (midpoint raised up)
        const midPoint = new THREE.Vector3(
          (nextPos.x + currentPos.x) / 2,
          ((nextPos.y + currentPos.y) / 2) + 1,
          (nextPos.z + currentPos.z) / 2
        );

        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z),
          midPoint,
          new THREE.Vector3(nextPos.x, nextPos.y, nextPos.z)
        );
        
        curves.push(curve);
      }

      // Combine all curves into one set of points
      const allPoints: THREE.Vector3[] = [];
      curves.forEach(curve => {
        allPoints.push(...curve.getPoints(20));
      });

      const geometry = new THREE.BufferGeometry().setFromPoints(allPoints);
      const material = new THREE.LineBasicMaterial({ 
        color,
        opacity: 0.5,
        transparent: true
      });
      
      return new THREE.Line(geometry, material);
    };

    worldData.attackers?.forEach((attacker: any) => {
      const box = createBox(attacker.position, attacker.size, attacker.color || '#ff0000');
      sceneRef.current?.add(box);
      
      // Add trajectory trail using position history
      if (attacker.history?.length) {
        const trail = createTrajectoryTrail([...attacker.history, attacker.position], attacker.color || '#ff0000');
        if (trail) sceneRef.current?.add(trail);
      }
    });

    worldData.defenders?.forEach((defender: any) => {
      const box = createBox(defender.position, defender.size, defender.color || '#0000ff');
      sceneRef.current?.add(box);
      
      // Add trajectory trail using position history
      if (defender.history?.length) {
        const trail = createTrajectoryTrail([...defender.history, defender.position], defender.color || '#0000ff');
        if (trail) sceneRef.current?.add(trail);
      }
    });

    worldData.protected_objects?.forEach((object: any) => {
      const box = createBox(object.position, object.size, object.color);
      sceneRef.current?.add(box);
    });
  }, [worldData]);

  return null;
}