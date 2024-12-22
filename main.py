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
    # Create a sample world
    world = World(
        width=100,
        height=50,
        depth=100
    )
    world.generate_random_terrain()
    
    # Convert to JSON for Three.js
    world_data = world_to_threejs(world)
    
    # Create HTML with Three.js viewer
    html = f"""
    <div id="world-container"></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script>
        const worldData = {json.dumps(world_data)};
        
        // Three.js setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        
        // Add terrain blocks
        worldData.terrain.forEach(block => {{
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({{
                color: getTerrainColor(block.type)
            }});
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(...block.position);
            scene.add(cube);
        }});
        
        function getTerrainColor(type) {{
            switch(type) {{
                case 'water': return 0x0000ff;
                case 'grass': return 0x00ff00;
                case 'mountain': return 0x808080;
                case 'sand': return 0xffff00;
                default: return 0xffffff;
            }}
        }}
        
        // Animation loop
        function animate() {{
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        }}
        animate();
    </script>
    """
    
    return gr.HTML(html)

# Create Gradio interface
interface = gr.Interface(
    fn=render_world,
    inputs=[],
    outputs=gr.HTML(),
    title="3D World Viewer"
)

if __name__ == "__main__":
    interface.launch()