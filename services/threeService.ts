import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment';
import { COLORS, CONFIG } from '../constants';
import { AppMode, ParticleData } from '../types';

export class ThreeService {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private composer!: EffectComposer;
  private mainGroup!: THREE.Group;
  private particles: ParticleData[] = [];
  private dustSystem!: THREE.Points;
  private mode: AppMode = AppMode.TREE;
  private targetRotation = new THREE.Vector2(0, 0);
  private canvas: HTMLCanvasElement;
  private animationFrameId: number | null = null;
  private textureLoader = new THREE.TextureLoader();
  
  // Track the specifically selected photo for Focus mode
  private focusTarget: THREE.Object3D | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.init();
  }

  private init() {
    // 1. Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 2.2;
    this.renderer.shadowMap.enabled = true;

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 2, 50);

    // 3. Scene & Env
    this.scene = new THREE.Scene();
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    
    // 4. Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const innerLight = new THREE.PointLight(0xffaa00, 2, 20);
    innerLight.position.set(0, 5, 0);
    this.scene.add(innerLight);

    const spotGold = new THREE.SpotLight(COLORS.GOLD, 1200);
    spotGold.position.set(30, 40, 40);
    spotGold.angle = Math.PI / 4;
    spotGold.penumbra = 0.5;
    this.scene.add(spotGold);

    const spotBlue = new THREE.SpotLight(COLORS.BLUE_LIGHT, 600);
    spotBlue.position.set(-30, 20, -30);
    this.scene.add(spotBlue);

    // 5. Post Processing
    const renderScene = new RenderPass(this.scene, this.camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.45, // strength
      0.4,  // radius
      0.7   // threshold
    );

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderScene);
    this.composer.addPass(bloomPass);

    // 6. Content Generation
    this.mainGroup = new THREE.Group();
    this.scene.add(this.mainGroup);

    this.createParticles();
    this.createDust();
    this.addDefaultPhoto();

    // 7. Event Listeners
    window.addEventListener('resize', this.onWindowResize);
  }

  // --- Content Creators ---

  private createParticles() {
    const geometries = [
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.SphereGeometry(0.3, 16, 16),
      this.createCandyCaneGeometry(),
    ];

    const materials = [
      new THREE.MeshStandardMaterial({ color: COLORS.GOLD, metalness: 1, roughness: 0.2 }),
      new THREE.MeshStandardMaterial({ color: 0x0a4422, metalness: 0.2, roughness: 0.8 }), // Deep Green
      new THREE.MeshPhysicalMaterial({ color: COLORS.RED, metalness: 0.1, roughness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.1 }),
      this.createCandyCaneMaterial(),
    ];

    for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
      const geom = geometries[Math.floor(Math.random() * geometries.length)];
      const mat = materials[Math.floor(Math.random() * materials.length)];
      
      const mesh = new THREE.Mesh(geom, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Random initial position (Scatter state)
      const pos = this.getSpherePosition(8, 20);
      mesh.position.copy(pos);
      
      // Random rotation
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      this.mainGroup.add(mesh);

      this.particles.push({
        mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1),
        initialPos: pos.clone(),
        type: 'DECORATION',
        rotationSpeed: new THREE.Vector3(Math.random() * 0.02, Math.random() * 0.02, Math.random() * 0.02),
      });
    }
  }

  private createCandyCaneGeometry(): THREE.BufferGeometry {
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0.3, 1.3, 0),
      new THREE.Vector3(0.5, 1, 0),
    ]);
    return new THREE.TubeGeometry(path, 20, 0.08, 8, false);
  }

  private createCandyCaneMaterial(): THREE.MeshStandardMaterial {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0,0,32,32);
    ctx.fillStyle = '#aa0000';
    // Draw stripes
    for(let i=0; i<32; i+=4) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(32, i+4);
      ctx.lineTo(32, i+8);
      ctx.lineTo(0, i+4);
      ctx.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 4);

    return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.3 });
  }

  private createDust() {
    const geom = new THREE.BufferGeometry();
    const positions = [];
    for (let i = 0; i < CONFIG.DUST_COUNT; i++) {
      const pos = this.getSpherePosition(0, 30);
      positions.push(pos.x, pos.y, pos.z);
    }
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: COLORS.CREAM,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    this.dustSystem = new THREE.Points(geom, mat);
    this.scene.add(this.dustSystem);
  }

  // --- Photo Handling ---

  private createPhotoMesh(texture: THREE.Texture): THREE.Mesh {
    const frameGeom = new THREE.BoxGeometry(1.2, 1.2, 0.1);
    const frameMat = new THREE.MeshStandardMaterial({ color: COLORS.GOLD, metalness: 0.9, roughness: 0.1 });
    const photoMat = new THREE.MeshBasicMaterial({ map: texture });
    
    // Material Indices: 0:x+, 1:x-, 2:y+, 3:y-, 4:z+ (Front), 5:z- (Back)
    // We want the photo on the FRONT face (index 4) so it faces camera when we lookAt()
    const mesh = new THREE.Mesh(frameGeom, [frameMat, frameMat, frameMat, frameMat, photoMat, frameMat]);
    return mesh;
  }

  private addDefaultPhoto() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 512, 512);
    
    ctx.font = 'bold 60px "Times New Roman"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#d4af37';
    ctx.fillText('JOYEUX', 256, 220);
    ctx.fillText('NOEL', 256, 292);
    
    // Add border
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, 472, 472);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.addPhotoToScene(texture);
  }

  public addPhotoFromURL(dataUrl: string) {
    this.textureLoader.load(dataUrl, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      this.addPhotoToScene(t);
    });
  }

  private addPhotoToScene(texture: THREE.Texture) {
    const mesh = this.createPhotoMesh(texture);
    const pos = this.getSpherePosition(5, 15);
    mesh.position.copy(pos);
    this.mainGroup.add(mesh);
    
    this.particles.push({
      mesh,
      velocity: new THREE.Vector3(0,0,0),
      initialPos: pos.clone(),
      type: 'PHOTO',
      rotationSpeed: new THREE.Vector3(0.005, 0.005, 0),
    });
  }

  // --- Logic Helpers ---

  private getSpherePosition(minR: number, maxR: number): THREE.Vector3 {
    const r = minR + Math.random() * (maxR - minR);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    return new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
  }

  private getTreePosition(index: number, total: number): THREE.Vector3 {
    // Cone/Tree logic
    const t = index / total;
    const h = t * 30 - 15; // Height range -15 to 15
    const maxRadius = 12 * (1 - t);
    const angle = t * 50 * Math.PI;
    
    // Add some noise
    const r = maxRadius + (Math.random() - 0.5);
    
    return new THREE.Vector3(
      r * Math.cos(angle),
      h,
      r * Math.sin(angle)
    );
  }

  // --- Animation Loop ---

  public setMode(mode: AppMode) {
    if (this.mode === mode) return;
    this.mode = mode;

    if (mode === AppMode.FOCUS) {
        // Randomly select one photo to focus on
        const photos = this.particles.filter(p => p.type === 'PHOTO');
        if (photos.length > 0) {
            const randomPhoto = photos[Math.floor(Math.random() * photos.length)];
            this.focusTarget = randomPhoto.mesh;
        } else {
            this.focusTarget = null;
        }
    } else {
        this.focusTarget = null;
    }
  }

  public setRotationFromHand(x: number, y: number) {
    // Input is 0..1 normalized. Map to rotation angles.
    // X controls Y rotation (yaw), Y controls X rotation (pitch)
    this.targetRotation.set(
      (y - 0.5) * 1.5, // Pitch
      (x - 0.5) * 3.0  // Yaw
    );
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    // 1. Scene Rotation (Interpolated)
    this.mainGroup.rotation.x += (this.targetRotation.x - this.mainGroup.rotation.x) * 0.05;
    this.mainGroup.rotation.y += (this.targetRotation.y - this.mainGroup.rotation.y) * 0.05;

    // 2. Particle Logic based on Mode
    const time = Date.now() * 0.001;

    this.particles.forEach((p, i) => {
      let targetPos = new THREE.Vector3();
      let targetScale = new THREE.Vector3(1, 1, 1);
      
      if (this.mode === AppMode.TREE) {
        // Tree Logic
        targetPos = this.getTreePosition(i, this.particles.length);
        p.mesh.rotation.x += p.rotationSpeed.x;
        p.mesh.rotation.y += p.rotationSpeed.y;
      } 
      else if (this.mode === AppMode.SCATTER) {
        // Scatter Logic
        targetPos = p.initialPos;
        // Rotation spins freely
        p.mesh.rotation.x += p.rotationSpeed.x * 5;
        p.mesh.rotation.y += p.rotationSpeed.y * 5;
      } 
      else if (this.mode === AppMode.FOCUS) {
        if (this.focusTarget && p.mesh === this.focusTarget) {
          // --- FIX: World Space Compensation ---
          // The mainGroup is likely rotated by hand gestures.
          // To make the photo appear directly in front of the camera (World Space: 0, 2, 35),
          // we must calculate the local position that corresponds to that world position
          // given the current parent rotation.
          
          // 1. Calculate Inverse Rotation of the container
          const invQuaternion = this.mainGroup.quaternion.clone().invert();
          
          // 2. Desired World Position: Center screen, slightly in front of origin (Camera is at 0, 2, 50)
          const desiredWorldPos = new THREE.Vector3(0, 2, 35);
          
          // 3. Transform World -> Local
          // We apply the inverse rotation to the world vector to find where it sits in the rotated container.
          targetPos.copy(desiredWorldPos).applyQuaternion(invQuaternion);
          
          targetScale.set(4.5, 4.5, 4.5);
          
          // 4. Counter-rotate the mesh so it always faces the camera flatly
          // We want World Rotation = Identity (since camera is looking down -Z, mesh front is +Z)
          // LocalRot = InvParentRot * WorldRot
          // LocalRot = InvParentRot * Identity
          p.mesh.quaternion.slerp(invQuaternion, 0.1);

        } else {
          // Push other particles away
          const dir = p.initialPos.clone().normalize();
          targetPos = dir.multiplyScalar(60); 
        }
      }

      // LERP Position
      p.mesh.position.lerp(targetPos, 0.03);
      
      // LERP Scale
      p.mesh.scale.lerp(targetScale, 0.05);
    });

    // 3. Dust Animation
    const positions = this.dustSystem.geometry.attributes.position.array as Float32Array;
    for(let i=0; i<positions.length; i+=3) {
        positions[i+1] -= 0.02; // Fall down
        if(positions[i+1] < -20) positions[i+1] = 20; // Reset height
    }
    this.dustSystem.geometry.attributes.position.needsUpdate = true;
    this.dustSystem.rotation.y = time * 0.05;

    // 4. Render
    this.composer.render();
  };

  private onWindowResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  };

  public start() {
    this.animate();
  }

  public dispose() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.dispose();
    this.scene.clear();
  }
}