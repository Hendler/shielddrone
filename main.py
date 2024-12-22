import gradio as gr
import json
from lib.models.world import World

def world_to_threejs(world: World):
    """Convert World model to Three.js compatible format"""
    return {
        "dimensions": {
            "width": world.width,
            "height": world.height,
            "depth": world.depth
        },
        "terrain": [
            {
                "position": list(pos),
                "type": terrain_type,
            }
            for pos, terrain_type in world.terrain_grid.items()
        ]
    }

def render_world():
    try:
        print("Starting render_world function")
        world = World(
            width=100,
            height=50,
            depth=100
        )
        world.generate_random_terrain()
        
        world_data = world_to_threejs(world)
        
        # Create the HTML with proper script loading and initialization
        html = f"""
        <div id="world-container" style="width: 100%; height: 600px; border: 2px solid red;"></div>
        
        <!-- Load Three.js first -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
        
        <script>
            // Add the missing getTerrainColor function
            function getTerrainColor(terrainType) {{
                const colorMap = {{
                    'grass': 0x00ff00,
                    'water': 0x0000ff,
                    'mountain': 0x808080,
                    'sand': 0xffff00
                }};
                return colorMap[terrainType] || 0xff0000;
            }}

            function initWorld() {{
                console.log('Starting World initialization');
                const worldData = {json.dumps(world_data)};
                console.log('World data:', worldData);
                
                // Three.js setup
                const container = document.getElementById('world-container');
                const scene = new THREE.Scene();
                const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
                const renderer = new THREE.WebGLRenderer({{ antialias: true }});
                
                renderer.setSize(container.clientWidth, container.clientHeight);
                renderer.setPixelRatio(window.devicePixelRatio);
                container.appendChild(renderer.domElement);
                
                renderer.setClearColor(0x333333);
                
                // Camera setup
                camera.position.set(50, 50, 100);
                camera.lookAt(50, 0, 50);
                
                // Create terrain
                worldData.terrain.forEach((block) => {{
                    const geometry = new THREE.BoxGeometry(1, 1, 1);
                    const material = new THREE.MeshPhongMaterial({{
                        color: getTerrainColor(block.type)
                    }});
                    const cube = new THREE.Mesh(geometry, material);
                    cube.position.set(...block.position);
                    scene.add(cube);
                }});
                
                // Add lights
                const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
                scene.add(ambientLight);
                const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
                directionalLight.position.set(100, 100, 100);
                scene.add(directionalLight);
                
                // Handle window resizing
                window.addEventListener('resize', () => {{
                    const width = container.clientWidth;
                    const height = container.clientHeight;
                    
                    camera.aspect = width / height;
                    camera.updateProjectionMatrix();
                    
                    renderer.setSize(width, height);
                }});
                
                // Animation loop
                function animate() {{
                    requestAnimationFrame(animate);
                    renderer.render(scene, camera);
                }}
                
                animate();
            }}
            
            // Wait for both DOM and Three.js to be ready
            if (document.readyState === 'loading') {{
                document.addEventListener('DOMContentLoaded', () => {{
                    if (typeof THREE !== 'undefined') {{
                        initWorld();
                    }} else {{
                        console.error('Three.js not loaded');
                    }}
                }});
            }} else {{
                if (typeof THREE !== 'undefined') {{
                    initWorld();
                }} else {{
                    console.error('Three.js not loaded');
                }}
            }}
        </script>
        """
        
        return gr.HTML(value=html)
    except Exception as e:
        print(f"Error in render_world: {str(e)}")
        raise e

# Create Gradio interface
interface = gr.Interface(
    fn=render_world,
    inputs=[],
    outputs=gr.HTML(),
    title="3D World Viewer",
    cache_examples=False,  # Disable caching
    live=False  # Ensure it's not in live mode
)

if __name__ == "__main__":
    interface.launch(debug=True, inbrowser=True)  # Add debug=True