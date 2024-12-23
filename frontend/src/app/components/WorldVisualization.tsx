'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

interface WorldVisualizationProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

export function WorldVisualization({ containerRef }: WorldVisualizationProps) {
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up existing renderer
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = null;
    }

    const container = containerRef.current;
    const scene = new THREE.Scene();
    
    // Set black background
    scene.background = new THREE.Color(0x000000);

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(200, 200, 200);
    camera.lookAt(0, 0, 0);

    // Create grid planes
    const gridSize = 100;
    const gridDivisions = 10;
    
    // XZ plane (grey)
    const gridXZ = new THREE.GridHelper(gridSize, gridDivisions, 0x444444, 0x444444);
    scene.add(gridXZ);
    
    // XY plane (grey)
    const gridXY = new THREE.GridHelper(gridSize, gridDivisions, 0x444444, 0x444444);
    gridXY.rotation.x = Math.PI / 2;
    scene.add(gridXY);
    
    // YZ plane (grey)
    const gridYZ = new THREE.GridHelper(gridSize, gridDivisions, 0x444444, 0x444444);
    gridYZ.rotation.z = Math.PI / 2;
    scene.add(gridYZ);

    // Create axes
    const axesHelper = new THREE.AxesHelper(100);
    // Set axes colors (red for all)
    axesHelper.setColors(0xff0000, 0xff0000, 0xff0000);
    scene.add(axesHelper);

    // Setup renderer
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(rendererRef.current.domElement);

    // Add OrbitControls
    const controls = new OrbitControls(camera, rendererRef.current.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Handle window resizing
    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (rendererRef.current) {
        rendererRef.current.setSize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      if (rendererRef.current) {
        rendererRef.current.render(scene, camera);
      }
    }
    animate();

    // Cleanup
    return () => {
      controls.dispose();
      if (rendererRef.current) {
        rendererRef.current.dispose();
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current = null;
      }
      window.removeEventListener('resize', handleResize);
      scene.clear();
    };
  }, [containerRef]);

  return null;
}