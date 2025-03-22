import * as THREE from 'three';
import { GameSettings, GameState, SceneManager } from '../types';

// Main function to create and manage the Three.js scene
export const createGameScene = (container: HTMLElement, settings: GameSettings): SceneManager => {
  // Initialize scene, camera, renderer
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75, // FOV
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1, // Near clipping plane
    1000 // Far clipping plane
  );
  
  // Set camera position
  camera.position.z = 5;
  
  // Create renderer with antialiasing based on graphics quality
  const renderer = new THREE.WebGLRenderer({
    antialias: settings.graphicsQuality !== 'low',
    alpha: true,
  });
  
  // Set renderer size and pixel ratio
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(
    settings.graphicsQuality === 'high' 
      ? window.devicePixelRatio 
      : (settings.graphicsQuality === 'medium' ? 1 : 0.75)
  );
  
  // Set clear color
  renderer.setClearColor(0x000000, 1);
  
  // Add renderer's canvas to DOM
  container.appendChild(renderer.domElement);
  
  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  // Add directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);
  
  // Create a simple cube as a placeholder
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0x3388ff });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
  
  // Raycaster for mouse/touch interaction
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  
  // Click effects group
  const clickEffects = new THREE.Group();
  scene.add(clickEffects);
  
  // FPS counter variables
  let frameCount = 0;
  let lastTime = performance.now();
  let fps = 0;
  
  // Store the current game state reference
  let currentGameState: GameState = {
    score: 0,
    level: 1,
    lives: 3,
    clicks: 0  // New counter for clicks on cube
  };
  
  // Create click effect at position
  const createClickEffect = (x: number, y: number, hit: boolean) => {
    // Create a circle geometry for the click effect
    const effectGeometry = new THREE.CircleGeometry(0.1, 32);
    const effectMaterial = new THREE.MeshBasicMaterial({ 
      color: hit ? 0x00ff00 : 0xffff00,
      transparent: true,
      opacity: 1.0
    });
    
    const effect = new THREE.Mesh(effectGeometry, effectMaterial);
    
    // Convert screen coordinates to world coordinates
    // Use an invisible plane at z=0 for mapping
    const vector = new THREE.Vector3();
    vector.set(
      (x / window.innerWidth) * 2 - 1,
      -(y / window.innerHeight) * 2 + 1,
      0.5
    );
    vector.unproject(camera);
    
    // Calculate a proper z position for the effect that's visible by the camera
    // We'll place the effect at a fixed distance in front of the camera for non-hit clicks
    const direction = vector.sub(camera.position).normalize();
    let effectZ;
    
    if (hit) {
      // If we hit the cube, place effect slightly in front of the cube
      effectZ = cube.position.z + 0.55;
    } else {
      // If we missed, place effect at a fixed distance in front of the camera (3 units)
      effectZ = camera.position.z - 3;
    }
    
    // Recalculate the proper x,y coordinates for the new z position
    const t = (effectZ - camera.position.z) / direction.z;
    const effectX = camera.position.x + direction.x * t;
    const effectY = camera.position.y + direction.y * t;
    
    effect.position.set(effectX, effectY, effectZ);
    effect.lookAt(camera.position); // Make effect face the camera
    effect.userData = { createdAt: Date.now() };
    
    clickEffects.add(effect);
  };
  
  // Handle window resize
  const handleResize = (): void => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  
  window.addEventListener('resize', handleResize);
  
  // Handle mouse/touch events
  const handleClick = (event: MouseEvent | TouchEvent): void => {
    // Get click/tap position
    let clientX, clientY;
    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    // Update mouse position for raycasting
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;
    
    // Cast a ray from the camera
    raycaster.setFromCamera(mouse, camera);
    
    // Check for intersections with the cube
    const intersects = raycaster.intersectObject(cube);
    
    if (intersects.length > 0) {
      // Hit the cube - increment counter
      currentGameState.clicks = (currentGameState.clicks || 0) + 1;
      
      // Animate the cube scale on hit - more subtle animation
      const originalScale = cube.scale.clone();
      cube.scale.set(1.05, 1.05, 1.05);
      
      // Use a smoother animation with setTimeout
      let animationStep = 0;
      const totalSteps = 10;
      const animationDuration = 200; // ms
      const stepDuration = animationDuration / totalSteps;
      
      const animateCube = () => {
        animationStep++;
        if (animationStep <= totalSteps) {
          // Gradually return to original scale
          const progress = animationStep / totalSteps;
          const currentScale = 1.1 - (0.1 * progress);
          cube.scale.set(currentScale, currentScale, currentScale);
          setTimeout(animateCube, stepDuration);
        } else {
          // Ensure we're exactly back to original scale at the end
          cube.scale.copy(originalScale);
        }
      };
      
      // Start the animation
      setTimeout(animateCube, stepDuration);
      
      createClickEffect(clientX, clientY, true);
    } else {
      // Just show a click effect
      createClickEffect(clientX, clientY, false);
    }
  };
  
  // Add event listeners
  renderer.domElement.addEventListener('click', handleClick);
  renderer.domElement.addEventListener('touchstart', handleClick);
  
  // Animation loop
  let animationFrameId: number | null = null;
  
  const animate = (): void => {
    animationFrameId = requestAnimationFrame(animate);
    
    // Calculate FPS
    frameCount++;
    const currentTime = performance.now();
    const elapsed = currentTime - lastTime;
    
    // Update FPS counter every second
    if (elapsed >= 1000) {
      fps = Math.round((frameCount * 1000) / elapsed);
      frameCount = 0;
      lastTime = currentTime;
    }
    
    // Rotate cube
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    
    // Update click effects (fade out and remove old ones)
    const currentTimestamp = Date.now();
    clickEffects.children.forEach((effect: THREE.Object3D) => {
      if (effect.userData && effect.userData.createdAt) {
        const age = currentTimestamp - effect.userData.createdAt;
        if (age > 1000) {
          // Remove after 1 second
          clickEffects.remove(effect);
          (effect as THREE.Mesh).geometry.dispose();
          ((effect as THREE.Mesh).material as THREE.Material).dispose();
        } else {
          // Fade out and scale up gradually
          const opacity = 1 - (age / 1000);
          const scale = 1 + (age / 500);
          ((effect as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = opacity;
          effect.scale.set(scale, scale, scale);
        }
      }
    });
    
    // Render scene
    renderer.render(scene, camera);
  };
  
  // Start animation loop
  animate();
  
  // Return an object with methods to control the scene
  return {
    // Method to update the scene with new game state
    update: (gameState: GameState): void => {
      // Store reference to current game state
      currentGameState = gameState;
    },
    
    // Method to get current click count
    getClickCount: (): number => {
      return currentGameState.clicks || 0;
    },
    
    // Method to get current FPS
    getFPS: (): number => {
      return fps;
    },
    
    // Method to clean up scene resources when unmounting
    dispose: (): void => {
      // Cancel animation frame
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      
      // Remove event listeners
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.removeEventListener('touchstart', handleClick);
      
      // Dispose of Three.js resources
      renderer.dispose();
      
      // Dispose geometries and materials
      geometry.dispose();
      material.dispose();
      
      // Remove renderer from DOM
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      
      // Clear all children from the scene
      while (scene.children.length > 0) {
        const object = scene.children[0];
        scene.remove(object);
        
        // Dispose of geometries and materials recursively
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      }
    }
  };
}; 