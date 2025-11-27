
import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Center, Environment, Grid } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { AppState, ColorMode, ParticleShape } from '../types';

interface ModelViewerProps {
  textureUrl: string | null;
  appState: AppState;
  onStateChange?: (newState: Partial<AppState>) => void;
}

export interface ModelViewerRef {
  exportPLY: () => void;
  startRecording: () => void;
  stopRecording: () => void;
}

// Helper to apply color modes, brightness and tint
const applyColorMode = (
  r: number,
  g: number,
  b: number,
  mode: ColorMode,
  brightness: number,
  tintHex: string
): [number, number, number] => {
  let normR = r / 255;
  let normG = g / 255;
  let normB = b / 255;

  // Grayscale intensity
  const gray = normR * 0.299 + normG * 0.587 + normB * 0.114;

  // Apply Filter Mode
  let finalR = normR, finalG = normG, finalB = normB;

  switch (mode) {
    case ColorMode.COOL_BLACK:
      finalR = gray * 0.2; finalG = gray * 0.2; finalB = gray * 0.3 + 0.1; break;
    case ColorMode.CYBERPUNK:
      finalR = normR * 1.2; finalG = normG * 0.8; finalB = normB * 1.5; break;
    case ColorMode.MATRIX:
      finalR = 0; finalG = gray * 1.5; finalB = 0; break;
    case ColorMode.GOLDEN:
      finalR = gray * 1.2; finalG = gray * 0.9; finalB = gray * 0.2; break;
    case ColorMode.OCEAN:
      finalR = 0; finalG = gray * 0.8; finalB = gray * 1.2; break;
    case ColorMode.INFERNO:
      finalR = gray * 1.5; finalG = gray * 0.5; finalB = 0; break;
    case ColorMode.VAPORWAVE:
      finalR = Math.min(1, normR + 0.2); finalG = normG * 0.8; finalB = Math.min(1, normB + 0.3); break;
    case ColorMode.ARCTIC:
      finalR = gray * 0.8; finalG = gray * 0.9; finalB = 1.0; break;
    case ColorMode.MONO:
      finalR = gray; finalG = gray; finalB = gray; break;
    case ColorMode.SEPIA:
      finalR = Math.min(1, (normR * 0.393) + (normG * 0.769) + (normB * 0.189));
      finalG = Math.min(1, (normR * 0.349) + (normG * 0.686) + (normB * 0.168));
      finalB = Math.min(1, (normR * 0.272) + (normG * 0.534) + (normB * 0.131));
      break;
    case ColorMode.BLUEPRINT:
      finalR = 0; finalG = gray * 0.5; finalB = 1.0; break;
    default: // ORIGINAL
      finalR = normR; finalG = normG; finalB = normB; break;
  }

  // Apply Tint
  if (tintHex !== '#ffffff') {
    const tintColor = new THREE.Color(tintHex);
    // Simple mix: 80% original, 20% tint, or multiplicative
    // Let's do multiplicative for "tint" effect
    finalR *= tintColor.r;
    finalG *= tintColor.g;
    finalB *= tintColor.b;
  }

  // Apply Brightness
  finalR *= brightness;
  finalG *= brightness;
  finalB *= brightness;

  return [finalR, finalG, finalB];
};

const PixelCloud = forwardRef<{ exportPLY: () => void }, {
  imageUrl: string | null;
  appState: AppState;
  onStateChange?: (newState: Partial<AppState>) => void;
}>(({ imageUrl, appState, onStateChange }, ref) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [particlesData, setParticlesData] = useState<{ pos: number[], col: number[] } | null>(null);

  // Expose export function
  useImperativeHandle(ref, () => ({
    exportPLY: () => {
      if (!particlesData || particlesData.pos.length === 0) return;

      let plyContent =
        `ply
format ascii 1.0
element vertex ${particlesData.pos.length / 3}
property float x
property float y
property float z
property uchar red
property uchar green
property uchar blue
end_header
`;

      for (let i = 0; i < particlesData.pos.length; i += 3) {
        const x = particlesData.pos[i];
        const y = particlesData.pos[i + 1];
        const z = particlesData.pos[i + 2];
        // We need to re-apply color logic here or store the computed RGB in state.
        // For simplicity, we use the stored 'col' which is already processed.
        const r = Math.min(255, Math.max(0, Math.floor(particlesData.col[i] * 255)));
        const g = Math.min(255, Math.max(0, Math.floor(particlesData.col[i + 1] * 255)));
        const b = Math.min(255, Math.max(0, Math.floor(particlesData.col[i + 2] * 255)));
        plyContent += `${x.toFixed(3)} ${y.toFixed(3)} ${z.toFixed(3)} ${r} ${g} ${b}\n`;
      }

      const blob = new Blob([plyContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'nanopixel_model.ply';
      link.click();
      URL.revokeObjectURL(url);
    },
    startRecording: async () => {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 3840 },
            height: { ideal: 2160 },
            frameRate: { ideal: 60 },
            displaySurface: 'monitor', // Encourages capturing the whole screen/monitor
          },
          audio: false,
          preferCurrentTab: false
        } as any);

        // Determine the best supported mime type
        const mimeTypes = [
          'video/webm; codecs=av1',
          'video/webm; codecs=vp9',
          'video/webm; codecs=vp8',
          'video/webm'
        ];

        let selectedMimeType = 'video/webm';
        for (const type of mimeTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
            selectedMimeType = type;
            break;
          }
        }

        console.log(`Using mimeType: ${selectedMimeType}`);

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: selectedMimeType,
          videoBitsPerSecond: 50000000 // 50 Mbps for high quality
        });

        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: selectedMimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `nanopixel_recording_${Date.now()}.webm`;
          a.click();
          URL.revokeObjectURL(url);

          // Stop all tracks to release the stream
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        (window as any).mediaRecorder = mediaRecorder;
      } catch (err) {
        console.error("Error starting screen recording:", err);
      }
    },
    stopRecording: () => {
      const mediaRecorder = (window as any).mediaRecorder as MediaRecorder;
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    }
  }));

  // Process image
  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const MAX_WIDTH = 512; // Lower res for performance if density is high
      let w = img.width;
      let h = img.height;
      if (w > MAX_WIDTH) {
        const aspect = h / w;
        w = MAX_WIDTH;
        h = Math.round(w * aspect);
      }

      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      const step = Math.max(1, Math.floor(appState.samplingStep));
      const validPoints: number[] = [];
      const validColors: number[] = [];

      const offsetX = w / 2;
      const offsetY = h / 2;

      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const i = (y * w + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Transparency Filter
          if (a >= appState.transparencyThreshold) {
            const brightnessVal = (r + g + b) / (3 * 255);

            // Geometry (scaled down for appropriate initial size)
            const posX = (x - offsetX) * appState.particleSize * 0.02;
            const posY = -(y - offsetY) * appState.particleSize * 0.02;
            const posZ = brightnessVal * appState.zExtrusion * 0.02;

            validPoints.push(posX, posY, posZ);

            // Color
            const [cr, cg, cb] = applyColorMode(
              r, g, b,
              appState.colorMode,
              appState.brightness,
              appState.tintColor
            );
            validColors.push(cr, cg, cb);
          }
        }
      }

      setParticlesData({ pos: validPoints, col: validColors });
    };
  }, [
    imageUrl,
    appState.samplingStep,
    appState.zExtrusion,
    appState.transparencyThreshold,
    appState.colorMode,
    appState.particleSize,
    appState.brightness,
    appState.tintColor
  ]);

  // Update Mesh instances
  useEffect(() => {
    if (!meshRef.current || !particlesData) return;

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const count = particlesData.pos.length / 3;

    meshRef.current.count = count;

    for (let i = 0; i < count; i++) {
      const x = particlesData.pos[i * 3];
      const y = particlesData.pos[i * 3 + 1];
      const z = particlesData.pos[i * 3 + 2];

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(appState.particleSize * 0.015);

      // Rotate diamonds/octahedrons for better look
      if (appState.particleShape === 'diamond') {
        dummy.rotation.x = Math.PI / 4;
        dummy.rotation.z = Math.PI / 4;
      } else {
        dummy.rotation.set(0, 0, 0);
      }

      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);

      const r = particlesData.col[i * 3];
      const g = particlesData.col[i * 3 + 1];
      const b = particlesData.col[i * 3 + 2];
      color.setRGB(r, g, b);
      meshRef.current.setColorAt(i, color);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

  }, [particlesData, appState.particleSize, appState.particleShape]);

  useFrame((state, delta) => {
    if (groupRef.current && appState.autoRotate) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  if (!imageUrl) return null;

  return (
    <group
      ref={groupRef}
      position={[0, 0, 0]}
      rotation={[0, 0, 0]}
      onPointerDown={() => onStateChange && onStateChange({ autoRotate: false })}
    >
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, 500000]}
        castShadow
        receiveShadow
      >
        {appState.particleShape === 'circle' && <sphereGeometry args={[0.5, 16, 16]} />}
        {appState.particleShape === 'square' && <boxGeometry args={[1, 1, 1]} />}
        {appState.particleShape === 'diamond' && <octahedronGeometry args={[0.6, 0]} />}

        <meshStandardMaterial
          roughness={0.2}
          metalness={0.8}
          emissive="#4488ff"
          emissiveIntensity={0.5}
        />
      </instancedMesh>
    </group>
  );
});

const ModelViewer = forwardRef<ModelViewerRef, ModelViewerProps>(({ textureUrl, appState, onStateChange }, ref) => {

  const getBgColor = () => {
    switch (appState.viewportMode) {
      case 'bright': return '#f0f2f5';
      case 'transparent': return null;
      default: return '#0d1117'; // Dark
    }
  };

  const bgColor = getBgColor();

  return (
    <div className="w-full h-full relative" style={{ backgroundColor: bgColor || 'transparent' }}>
      {/* Grid Pattern Background for Transparent mode visibility */}
      {appState.viewportMode === 'transparent' && (
        <div className="absolute inset-0 z-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(#4a5568 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        />
      )}

      <Canvas
        shadows
        camera={{ position: [0, 20, 80], fov: 45 }}
        gl={{ alpha: appState.viewportMode === 'transparent', preserveDrawingBuffer: true }}
      >
        {bgColor && <color attach="background" args={[bgColor]} />}

        {/* Lights */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[50, 50, 50]} intensity={1} castShadow />
        <pointLight position={[-50, -50, 50]} intensity={0.5} color="#00f3ff" />

        <Center>
          {textureUrl ? (
            <PixelCloud
              ref={ref}
              imageUrl={textureUrl}
              appState={appState}
              onStateChange={onStateChange}
            />
          ) : (
            <mesh rotation={[0.5, 0.5, 0]}>
              <boxGeometry args={[10, 10, 10]} />
              <meshBasicMaterial wireframe color="#333" />
            </mesh>
          )}
        </Center>

        {(() => {
          const gb = Math.max(0.1, Math.min(1.0, appState.gridBrightness ?? 1.0));
          const v = Math.round(255 * gb);
          const hex = v.toString(16).padStart(2, '0');
          const gridColor = `#${hex}${hex}${hex}`;
          return (
            <Grid
              position={[0, -50, 0]}
              args={[400, 400]}
              cellSize={1}
              sectionSize={10}
              fadeDistance={800}
              sectionColor={gridColor}
              cellColor={gridColor}
            />
          );
        })()}

        <OrbitControls
          makeDefault
          autoRotate={appState.autoRotate}
          autoRotateSpeed={0.2}
          minDistance={0.0001}
          maxDistance={1000000}
          enableZoom={true}
          zoomSpeed={1.0}
        />
        <Environment preset={appState.viewportMode === 'bright' ? "studio" : "city"} blur={0.8} />

        {/* Bloom Post-Processing for Neon Glow */}
        <EffectComposer>
          <Bloom
            intensity={1.5}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
});

export default ModelViewer;
