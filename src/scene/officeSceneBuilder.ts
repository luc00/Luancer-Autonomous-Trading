/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { ScreenTextureManager } from './screenTextures.ts';

export interface SceneObjects {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  screenManager: ScreenTextureManager;
  hologramGroup: THREE.Group;
  hologramCore: THREE.Mesh;
  hologramRing1: THREE.Mesh;
  hologramRing2: THREE.Mesh;
  hologramParticles: THREE.Points;
  deskLampLight: THREE.PointLight;
  skylineGroup: THREE.Group;
  monitorsGroup: THREE.Group;
  chairGroup: THREE.Group;
}

export function buildOfficeScene(
  container: HTMLDivElement,
  isSoftwareGl: boolean,
): { sceneObjects: SceneObjects; renderer: THREE.WebGLRenderer } {
  const width = container.clientWidth || 1200;
  const height = container.clientHeight || 800;

  // 1. Scene & Camera Setup (Bright White Minimalist Atmosphere)
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#EEF2F6');
  scene.fog = new THREE.FogExp2('#EEF2F6', 0.022);

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 1.6, 2.8);

  // 2. WebGL Renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
    alpha: false,
  });
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // 3. Studio Daylight Lighting Rig
  // Daylight sky hemisphere fill
  const hemiLight = new THREE.HemisphereLight('#FFFFFF', '#E2E8F0', 0.85);
  scene.add(hemiLight);

  // Warm natural sun key light
  const keyLight = new THREE.DirectionalLight('#FFFBEB', 1.4);
  keyLight.position.set(3, 5, 2.5);
  if (!isSoftwareGl) {
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 15;
    keyLight.shadow.camera.left = -3;
    keyLight.shadow.camera.right = 3;
    keyLight.shadow.camera.top = 3;
    keyLight.shadow.camera.bottom = -3;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
  }
  scene.add(keyLight);

  // Desk accent light (Luancer emerald tint)
  const deskLampLight = new THREE.PointLight('#059669', 0.5, 3.5, 2.0);
  deskLampLight.position.set(-1.1, 0.9, 0.35);
  scene.add(deskLampLight);

  // Hologram center glow light
  const holoLight = new THREE.PointLight('#00D09C', 0.8, 2.5, 2.0);
  holoLight.position.set(0, 1.05, 0.15);
  scene.add(holoLight);

  // 4. Materials (White Minimalist Palette)
  const deskMat = new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    roughness: 0.22,
    metalness: 0.05,
  });

  const steelMat = new THREE.MeshStandardMaterial({
    color: '#D1D5DB',
    roughness: 0.2,
    metalness: 0.85,
  });

  const bezelMat = new THREE.MeshStandardMaterial({
    color: '#181E29',
    roughness: 0.4,
    metalness: 0.7,
  });

  const screenManager = new ScreenTextureManager();
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  screenManager.chartTexture.anisotropy = maxAniso;
  screenManager.opusTexture.anisotropy = maxAniso;
  screenManager.portfolioTexture.anisotropy = maxAniso;

  // 5. Build White Marble / Light Floor & Executive Architecture
  const floorGeo = new THREE.PlaneGeometry(24, 24);
  const floorMat = new THREE.MeshStandardMaterial({
    color: '#F8FAFC',
    roughness: 0.12,
    metalness: 0.15,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = !isSoftwareGl;
  scene.add(floor);

  // Side Architectural White Walls
  const wallMat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.6 });
  const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(4, 7, 0.2), wallMat);
  wallLeft.position.set(-6, 3.5, -3.2);
  scene.add(wallLeft);

  const wallRight = new THREE.Mesh(new THREE.BoxGeometry(4, 7, 0.2), wallMat);
  wallRight.position.set(6, 3.5, -3.2);
  scene.add(wallRight);

  // Ceiling with recessed clean white cove
  const ceiling = new THREE.Mesh(
    new THREE.BoxGeometry(20, 0.2, 12),
    new THREE.MeshStandardMaterial({ color: '#FAFAFA', roughness: 0.8 })
  );
  ceiling.position.set(0, 5.5, 0);
  scene.add(ceiling);

  // Ceiling LED glow strip
  const coveStrip = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.05, 0.1),
    new THREE.MeshBasicMaterial({ color: '#00D09C' })
  );
  coveStrip.position.set(0, 5.38, -2.8);
  scene.add(coveStrip);

  // 6. Build Daytime Financial Skyline Beyond Window
  const skylineGroup = new THREE.Group();
  skylineGroup.position.set(0, 0, -5.2);

  const towerMatLit = new THREE.MeshStandardMaterial({
    color: '#E2E8F0',
    roughness: 0.3,
    metalness: 0.4,
  });
  const towerGlassMat = new THREE.MeshBasicMaterial({ color: '#93C5FD' });
  const towerCyanMat = new THREE.MeshBasicMaterial({ color: '#6EE7B7' });

  // Generate 45 skyscraper towers with realistic daylight silhouette
  for (let i = 0; i < 45; i++) {
    const heightT = 3.5 + Math.sin(i * 0.7) * 2.2 + Math.random() * 4.5;
    const widthT = 0.9 + Math.random() * 1.5;
    const depthT = 0.9 + Math.random() * 1.5;
    const x = (i - 22) * 1.15;
    const z = -Math.random() * 6;

    const tower = new THREE.Mesh(new THREE.BoxGeometry(widthT, heightT, depthT), towerMatLit);
    tower.position.set(x, heightT / 2 - 0.5, z);
    skylineGroup.add(tower);

    // Glowing window strips on skyscraper facades
    const windowStripCount = Math.floor(3 + Math.random() * 6);
    for (let w = 0; w < windowStripCount; w++) {
      const winGeo = new THREE.PlaneGeometry(widthT * 0.7, 0.08);
      const winColor = w % 2 === 0 ? towerGlassMat : towerCyanMat;
      const winMesh = new THREE.Mesh(winGeo, winColor);
      winMesh.position.set(x, 1 + w * 0.8 + Math.random() * 0.2, z + depthT / 2 + 0.01);
      skylineGroup.add(winMesh);
    }
  }
  scene.add(skylineGroup);

  // Floor-to-ceiling Panoramic Window Mullions (Minimalist Brushed White-Aluminum)
  const windowFrameMat = new THREE.MeshStandardMaterial({ color: '#CBD5E1', metalness: 0.8, roughness: 0.2 });
  [-3.8, -1.9, 0, 1.9, 3.8].forEach((posX) => {
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.08, 6, 0.1), windowFrameMat);
    mullion.position.set(posX, 2.7, -3.2);
    scene.add(mullion);
  });
  const horizBar = new THREE.Mesh(new THREE.BoxGeometry(10, 0.08, 0.1), windowFrameMat);
  horizBar.position.set(0, 3.8, -3.2);
  scene.add(horizBar);

  // 7. Build Modern Executive Trading Desk (THREE.Group)
  const deskGroup = new THREE.Group();
  deskGroup.position.set(0, 0, 0);

  // Desktop Tabletop
  const topGeo = new THREE.BoxGeometry(2.4, 0.06, 1.1);
  const deskTop = new THREE.Mesh(topGeo, deskMat);
  deskTop.position.set(0, 0.74, 0);
  deskTop.castShadow = !isSoftwareGl;
  deskTop.receiveShadow = !isSoftwareGl;
  deskGroup.add(deskTop);

  // Desk Beveled Edge Trim
  const edgeGeo = new THREE.BoxGeometry(2.42, 0.02, 1.12);
  const edgeTrim = new THREE.Mesh(edgeGeo, steelMat);
  edgeTrim.position.set(0, 0.73, 0);
  deskGroup.add(edgeTrim);

  // Left & Right Dual-Strut Steel Legs
  const legGeo = new THREE.BoxGeometry(0.08, 0.72, 0.9);
  const legLeft = new THREE.Mesh(legGeo, steelMat);
  legLeft.position.set(-1.05, 0.36, 0);
  legLeft.castShadow = !isSoftwareGl;
  deskGroup.add(legLeft);

  const legRight = new THREE.Mesh(legGeo, steelMat);
  legRight.position.set(1.05, 0.36, 0);
  legRight.castShadow = !isSoftwareGl;
  deskGroup.add(legRight);

  // Cable Tray / Under-Desk Chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.4), bezelMat);
  chassis.position.set(0, 0.65, -0.2);
  deskGroup.add(chassis);

  // 8. Triple Curved Trading Monitors (THREE.Group)
  const monitorsGroup = new THREE.Group();
  monitorsGroup.position.set(0, 0.77, -0.25);

  // Center Monitor: Ultrawide Curved Screen
  const centerStand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.35, 16), steelMat);
  centerStand.position.set(0, 0.175, 0);
  monitorsGroup.add(centerStand);

  const centerBase = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 0.25), steelMat);
  centerBase.position.set(0, 0.01, 0.05);
  monitorsGroup.add(centerBase);

  // Center Bezel
  const centerBezel = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.58, 0.04), bezelMat);
  centerBezel.position.set(0, 0.42, 0);
  centerBezel.castShadow = !isSoftwareGl;
  monitorsGroup.add(centerBezel);

  // Center Screen Face with Canvas Texture
  const centerScreenMat = new THREE.MeshBasicMaterial({
    map: screenManager.chartTexture,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  const centerScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 0.54), centerScreenMat);
  centerScreen.position.set(0, 0, 0.022);
  centerBezel.add(centerScreen);

  // Left Monitor: Opus 5.5 AI Matrix (Angled 26 deg toward user)
  const leftBezel = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.58, 0.04), bezelMat);
  leftBezel.position.set(-0.86, 0.42, 0.14);
  leftBezel.rotation.y = Math.PI * 0.15;
  leftBezel.castShadow = !isSoftwareGl;
  monitorsGroup.add(leftBezel);

  const leftScreenMat = new THREE.MeshBasicMaterial({
    map: screenManager.opusTexture,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  const leftScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.54), leftScreenMat);
  leftScreen.position.set(0, 0, 0.022);
  leftBezel.add(leftScreen);

  // Right Monitor: Trade Republic Portfolio & Depth (Angled -26 deg toward user)
  const rightBezel = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.58, 0.04), bezelMat);
  rightBezel.position.set(0.86, 0.42, 0.14);
  rightBezel.rotation.y = -Math.PI * 0.15;
  rightBezel.castShadow = !isSoftwareGl;
  monitorsGroup.add(rightBezel);

  const rightScreenMat = new THREE.MeshBasicMaterial({
    map: screenManager.portfolioTexture,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  const rightScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.54), rightScreenMat);
  rightScreen.position.set(0, 0, 0.022);
  rightBezel.add(rightScreen);

  deskGroup.add(monitorsGroup);

  // 9. Floating Central Opus 5.5 Hologram Emitter & Core
  const hologramGroup = new THREE.Group();
  hologramGroup.position.set(0, 0.77, 0.18);

  // Emitter Base Pedestal
  const emitterBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.14, 0.04, 32),
    new THREE.MeshStandardMaterial({ color: '#1A202C', metalness: 0.8, roughness: 0.2 })
  );
  emitterBase.position.y = 0.02;
  hologramGroup.add(emitterBase);

  // Glowing Emitter Ring
  const emitterRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.1, 0.015, 16, 32),
    new THREE.MeshBasicMaterial({ color: '#00D09C' })
  );
  emitterRing.rotation.x = Math.PI / 2;
  emitterRing.position.y = 0.042;
  hologramGroup.add(emitterRing);

  // Polyhedral Crystal Core
  const coreGeo = new THREE.IcosahedronGeometry(0.08, 1);
  const coreMat = new THREE.MeshPhysicalMaterial({
    color: '#00D09C',
    emissive: '#00D09C',
    emissiveIntensity: 0.4,
    roughness: 0.1,
    metalness: 0.2,
    wireframe: true,
  });
  const hologramCore = new THREE.Mesh(coreGeo, coreMat);
  hologramCore.position.y = 0.22;
  hologramGroup.add(hologramCore);

  // Orbital Ring 1
  const ringGeo1 = new THREE.TorusGeometry(0.16, 0.005, 16, 48);
  const ringMat1 = new THREE.MeshBasicMaterial({ color: '#38BDF8', transparent: true, opacity: 0.7 });
  const hologramRing1 = new THREE.Mesh(ringGeo1, ringMat1);
  hologramRing1.position.y = 0.22;
  hologramGroup.add(hologramRing1);

  // Orbital Ring 2
  const ringGeo2 = new THREE.TorusGeometry(0.2, 0.005, 16, 48);
  const ringMat2 = new THREE.MeshBasicMaterial({ color: '#A78BFA', transparent: true, opacity: 0.6 });
  const hologramRing2 = new THREE.Mesh(ringGeo2, ringMat2);
  hologramRing2.position.y = 0.22;
  hologramGroup.add(hologramRing2);

  // Holographic Particle Cloud
  const particleCount = 80;
  const particleGeo = new THREE.BufferGeometry();
  const particlePos = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const rad = 0.05 + Math.random() * 0.2;
    particlePos[i * 3] = Math.cos(angle) * rad;
    particlePos[i * 3 + 1] = 0.1 + Math.random() * 0.25;
    particlePos[i * 3 + 2] = Math.sin(angle) * rad;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
  const particleMat = new THREE.PointsMaterial({
    color: '#00D09C',
    size: 0.015,
    transparent: true,
    opacity: 0.8,
  });
  const hologramParticles = new THREE.Points(particleGeo, particleMat);
  hologramGroup.add(hologramParticles);

  deskGroup.add(hologramGroup);

  // 10. Desk Accessories (Minimalist Aluminum Keyboard, Leather Pad, Mouse)
  // Low-profile mechanical keyboard (brushed silver)
  const kbGroup = new THREE.Group();
  kbGroup.position.set(-0.35, 0.78, 0.25);
  const kbBase = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.016, 0.14), steelMat);
  kbGroup.add(kbBase);
  // Keycaps strip (clean white/light gray keys)
  const keys = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.01, 0.12),
    new THREE.MeshStandardMaterial({ color: '#F1F5F9', roughness: 0.3 })
  );
  keys.position.y = 0.01;
  kbGroup.add(keys);
  deskGroup.add(kbGroup);

  // Mouse & Mat (Minimalist light gray desk pad)
  const mouseMatDesk = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.005, 0.22),
    new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.7 })
  );
  mouseMatDesk.position.set(0.42, 0.773, 0.25);
  deskGroup.add(mouseMatDesk);

  const mouse = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.025, 0.1),
    new THREE.MeshStandardMaterial({ color: '#F8FAFC', roughness: 0.2, metalness: 0.1 })
  );
  mouse.position.set(0.42, 0.788, 0.25);
  deskGroup.add(mouse);

  // 3D Physical Trade Republic Mirror Card on Desk
  const cardGroup = new THREE.Group();
  cardGroup.position.set(0.05, 0.772, 0.28);
  cardGroup.rotation.y = -0.15; // Natural desk angle

  // Card body with mirror steel finish
  const cardBodyMat = new THREE.MeshStandardMaterial({
    color: '#D8E0EE',
    metalness: 0.95,
    roughness: 0.12,
  });
  const cardBody = new THREE.Mesh(new THREE.BoxGeometry(0.086, 0.0012, 0.054), cardBodyMat);
  cardGroup.add(cardBody);

  // Gold EMV Chip
  const chipMat = new THREE.MeshStandardMaterial({
    color: '#F59E0B',
    metalness: 0.8,
    roughness: 0.2,
  });
  const chip = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.0016, 0.009), chipMat);
  chip.position.set(-0.022, 0.0007, -0.004);
  cardGroup.add(chip);

  // TR Logo badge
  const trLogoBadge = new THREE.Mesh(
    new THREE.BoxGeometry(0.008, 0.0015, 0.008),
    new THREE.MeshBasicMaterial({ color: '#FFFFFF' })
  );
  trLogoBadge.position.set(-0.028, 0.0007, -0.018);
  cardGroup.add(trLogoBadge);

  // Cardholder name strip
  const nameStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.038, 0.0014, 0.004),
    new THREE.MeshBasicMaterial({ color: '#E2E8F0' })
  );
  nameStrip.position.set(0.008, 0.0007, 0.016);
  cardGroup.add(nameStrip);

  deskGroup.add(cardGroup);

  // Trade Republic / Luancer Ceramic Coffee Mug - Minimalist White Ceramic
  const mug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.038, 0.09, 24),
    new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.15, metalness: 0.05 })
  );
  mug.position.set(-0.85, 0.815, 0.28);
  deskGroup.add(mug);

  scene.add(deskGroup);

  // 11. Ergonomic Luxury Trading Chair (THREE.Group) - Minimalist Light Leather & Brushed Chrome
  const chairGroup = new THREE.Group();
  chairGroup.position.set(-0.15, 0, 1.15);
  chairGroup.rotation.y = 0.18; // Natural slight angle toward screens

  const leatherMat = new THREE.MeshStandardMaterial({
    color: '#E8EDF5',
    roughness: 0.35,
    metalness: 0.1,
  });

  // Seat cushion
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.07, 0.48), leatherMat);
  seat.position.set(0, 0.42, 0);
  seat.castShadow = !isSoftwareGl;
  chairGroup.add(seat);

  // Backrest (lowered to standard executive profile)
  const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.48, 0.05), leatherMat);
  backrest.position.set(0, 0.68, 0.22);
  backrest.rotation.x = -0.12;
  backrest.castShadow = !isSoftwareGl;
  chairGroup.add(backrest);

  // Armrests
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.26), bezelMat);
  armL.position.set(-0.29, 0.55, 0.02);
  chairGroup.add(armL);
  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.26), bezelMat);
  armR.position.set(0.29, 0.55, 0.02);
  chairGroup.add(armR);

  // Cylinder stem
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 16), steelMat);
  stem.position.set(0, 0.24, 0);
  chairGroup.add(stem);

  // 5-Spoke Wheel Base
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.28), steelMat);
    spoke.position.set(Math.sin(angle) * 0.14, 0.06, Math.cos(angle) * 0.14);
    spoke.rotation.y = angle;
    chairGroup.add(spoke);

    // Caster Wheel
    const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), bezelMat);
    wheel.position.set(Math.sin(angle) * 0.27, 0.03, Math.cos(angle) * 0.27);
    chairGroup.add(wheel);
  }

  scene.add(chairGroup);

  // Contact shadow grounding plane
  const shadowGeo = new THREE.PlaneGeometry(3.2, 2.2);
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d')!;
  const grad = sCtx.createRadialGradient(64, 64, 10, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 128, 128);
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowPlane = new THREE.Mesh(
    shadowGeo,
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.6,
    })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(0, 0.005, 0.2);
  scene.add(shadowPlane);

  return {
    sceneObjects: {
      scene,
      camera,
      screenManager,
      hologramGroup,
      hologramCore,
      hologramRing1,
      hologramRing2,
      hologramParticles,
      deskLampLight,
      skylineGroup,
      monitorsGroup,
      chairGroup,
    },
    renderer,
  };
}
