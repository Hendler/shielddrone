'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

interface WorldVisualizationProps {
  containerRef: React.RefObject<HTMLDivElement>;
  worldData: any;
}

export function WorldVisualization({ containerRef, worldData }: WorldVisualizationProps) {
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;
    camera.position.set(200, 200, 200);
    camera.lookAt(0, 0, 0);

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
    scene.add(gridXZ);
    
    const gridXY = createHalfGrid(gridSize, gridDivisions, 0x444444);
    scene.add(gridXY);
    
   const gridYZ = createHalfGrid(gridSize, gridDivisions, 0x444444);
    gridYZ.rotation.y = -Math.PI / 2;
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

    const createDirectionArrow = (position: any, history: any[]) => {
      if (history.length < 2) return null;
      
      const direction = new THREE.Vector3(
        history[1].x - history[0].x,
        history[1].y - history[0].y,
        history[1].z - history[0].z
      );
      
      if (direction.length() === 0) return null;

      const arrowHelper = new THREE.ArrowHelper(
        direction.normalize(),
        new THREE.Vector3(position.x, position.y, position.z),
        10,
        0xffffff
      );
      
      return arrowHelper;
    };

    worldData.attackers.forEach((attacker: any) => {
      const box = createBox(attacker.position, attacker.size, attacker.color);
      scene.add(box);
      
      const arrow = createDirectionArrow(attacker.position, attacker.history);
      if (arrow) scene.add(arrow);
    });

    worldData.defenders.forEach((defender: any) => {
      const box = createBox(defender.position, defender.size, defender.color);
      scene.add(box);
      
      const arrow = createDirectionArrow(defender.position, defender.history);
      if (arrow) scene.add(arrow);
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

    const animate = () => {
      requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && cameraRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      controls.dispose();
      if (rendererRef.current) {
        rendererRef.current.dispose();
        containerRef.current?.removeChild(rendererRef.current.domElement);
        rendererRef.current = null;
      }
      window.removeEventListener('resize', handleResize);
      scene.clear();
    };
  }, [containerRef]);

  useEffect(() => {
    if (!worldData || !sceneRef.current) return;

    const objectsToRemove = sceneRef.current.children.filter(
      child => child instanceof THREE.Mesh || child instanceof THREE.ArrowHelper
    );
    objectsToRemove.forEach(obj => sceneRef.current?.remove(obj));

    const createBox = (position: any, size: number, color: string) => {
      const geometry = new THREE.BoxGeometry(size, size, size);
      const material = new THREE.MeshBasicMaterial({ color: color || 0x00ff00 });
      const box = new THREE.Mesh(geometry, material);
      box.position.set(position.x, position.y, position.z);
      return box;
    };

    worldData.attackers?.forEach((attacker: any) => {
      const box = createBox(attacker.position, attacker.size, attacker.color || '#ff0000');
      sceneRef.current?.add(box);
    });

    worldData.defenders?.forEach((defender: any) => {
      const box = createBox(defender.position, defender.size, defender.color || '#0000ff');
      sceneRef.current?.add(box);
    });

    worldData.protected_objects?.forEach((object: any) => {
      const box = createBox(object.position, object.size, '#00ff00');
      sceneRef.current?.add(box);
    });
  }, [worldData]);

  useEffect(() => {
    const animate = () => {
      requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && cameraRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();
  }, []);

  return null;
}