/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildOfficeScene, SceneObjects } from '../scene/officeSceneBuilder.ts';
import { Asset, Portfolio, OpusStrategyConfig } from '../trading/types.ts';

export type CameraPreset = 'DESK' | 'OPUS_AI' | 'CHART' | 'PORTFOLIO' | 'SKYLINE';

interface VirtualOfficeViewProps {
  activeAsset: Asset;
  portfolio: Portfolio;
  strategyConfig: OpusStrategyConfig;
  latestDecision: string;
  cameraPreset: CameraPreset;
  onPresetChange?: (preset: CameraPreset) => void;
}

const PRESET_TARGETS: Record<CameraPreset, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
  DESK: {
    pos: new THREE.Vector3(0, 1.58, 2.3),
    target: new THREE.Vector3(0, 1.1, -0.1),
  },
  OPUS_AI: {
    pos: new THREE.Vector3(-0.82, 1.25, 0.85),
    target: new THREE.Vector3(-0.84, 1.18, 0.14),
  },
  CHART: {
    pos: new THREE.Vector3(0, 1.22, 0.85),
    target: new THREE.Vector3(0, 1.18, -0.25),
  },
  PORTFOLIO: {
    pos: new THREE.Vector3(0.82, 1.25, 0.85),
    target: new THREE.Vector3(0.84, 1.18, 0.14),
  },
  SKYLINE: {
    pos: new THREE.Vector3(0, 2.2, 4.0),
    target: new THREE.Vector3(0, 1.3, -2.0),
  },
};

export const VirtualOfficeView: React.FC<VirtualOfficeViewProps> = ({
  activeAsset,
  portfolio,
  strategyConfig,
  latestDecision,
  cameraPreset,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneObjects | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const targetCamPos = useRef<THREE.Vector3>(PRESET_TARGETS[cameraPreset].pos.clone());
  const targetCamLook = useRef<THREE.Vector3>(PRESET_TARGETS[cameraPreset].target.clone());
  const isTransitioningRef = useRef<boolean>(true);

  // Keep latest props in refs to avoid tearing down the WebGL scene
  const propsRef = useRef({
    activeAsset,
    portfolio,
    strategyConfig,
    latestDecision,
  });

  useEffect(() => {
    propsRef.current = {
      activeAsset,
      portfolio,
      strategyConfig,
      latestDecision,
    };
  }, [activeAsset, portfolio, strategyConfig, latestDecision]);

  // Handle camera preset changes smoothly
  useEffect(() => {
    const preset = PRESET_TARGETS[cameraPreset] || PRESET_TARGETS.DESK;
    targetCamPos.current.copy(preset.pos);
    targetCamLook.current.copy(preset.target);
    isTransitioningRef.current = true;
  }, [cameraPreset]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL from GPU renderer string
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Build Scene & Renderer
    const { sceneObjects, renderer } = buildOfficeScene(container, isSoftwareGl);
    sceneRef.current = sceneObjects;

    container.appendChild(renderer.domElement);

    // Procedural Studio Room Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    sceneObjects.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // OrbitControls
    const controls = new OrbitControls(sceneObjects.camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.minDistance = 0.5;
    controls.maxDistance = 6.0;
    controls.target.copy(targetCamLook.current);
    controlsRef.current = controls;

    // On user manual interaction start, pause camera animation
    controls.addEventListener('start', () => {
      isTransitioningRef.current = false;
    });

    // Initial Screen Textures Draw
    sceneObjects.screenManager.updateChartScreen(
      propsRef.current.activeAsset,
      propsRef.current.latestDecision
    );
    sceneObjects.screenManager.updateOpusScreen(
      propsRef.current.strategyConfig,
      propsRef.current.latestDecision,
      propsRef.current.portfolio.winningTrades / Math.max(1, propsRef.current.portfolio.totalTrades)
    );
    sceneObjects.screenManager.updatePortfolioScreen(propsRef.current.portfolio);

    let frameId = 0;
    let clock = new THREE.Clock();

    // Software WebGL pacing helper from threejs skill
    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    let lastScreenUpdate = 0;

    function tick() {
      const delta = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      // Animate Holographic AI Core
      if (sceneObjects.hologramCore) {
        sceneObjects.hologramCore.rotation.x = time * 0.8;
        sceneObjects.hologramCore.rotation.y = time * 1.2;
        sceneObjects.hologramRing1.rotation.z = time * 0.9;
        sceneObjects.hologramRing1.rotation.x = Math.PI / 2 + Math.sin(time * 0.6) * 0.2;
        sceneObjects.hologramRing2.rotation.z = -time * 0.7;
        sceneObjects.hologramRing2.rotation.y = Math.PI / 2 + Math.cos(time * 0.5) * 0.25;
        sceneObjects.hologramParticles.rotation.y = time * 0.15;
      }

      // Smooth camera preset interpolation
      if (isTransitioningRef.current) {
        const cam = sceneObjects.camera;
        cam.position.x = THREE.MathUtils.damp(cam.position.x, targetCamPos.current.x, 3.5, delta);
        cam.position.y = THREE.MathUtils.damp(cam.position.y, targetCamPos.current.y, 3.5, delta);
        cam.position.z = THREE.MathUtils.damp(cam.position.z, targetCamPos.current.z, 3.5, delta);

        controls.target.x = THREE.MathUtils.damp(controls.target.x, targetCamLook.current.x, 3.5, delta);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, targetCamLook.current.y, 3.5, delta);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, targetCamLook.current.z, 3.5, delta);

        // Check if settled
        if (cam.position.distanceTo(targetCamPos.current) < 0.02) {
          isTransitioningRef.current = false;
        }
      }

      controls.update();

      // Periodic screen texture updates
      if (time - lastScreenUpdate > 0.4) {
        lastScreenUpdate = time;
        const p = propsRef.current;
        sceneObjects.screenManager.updateChartScreen(p.activeAsset, p.latestDecision);
        sceneObjects.screenManager.updateOpusScreen(
          p.strategyConfig,
          p.latestDecision,
          p.portfolio.winningTrades / Math.max(1, p.portfolio.totalTrades)
        );
        sceneObjects.screenManager.updatePortfolioScreen(p.portfolio);
      }

      renderer.render(sceneObjects.scene, sceneObjects.camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    // Start loop
    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    // Handle Window Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      sceneObjects.camera.aspect = w / h;
      sceneObjects.camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      controls.dispose();
      sceneObjects.screenManager.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-testid="three-canvas-container"
      className="absolute inset-0 w-full h-full bg-[#F8FAFC] overflow-hidden select-none cursor-grab active:cursor-grabbing"
    />
  );
};
