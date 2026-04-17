import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Sphere, Sky } from "@react-three/drei";
import * as THREE from "three";
import styled from "styled-components";

// Enhanced Ship Model with more detail
const ShipModel = ({ scale = 1 }) => {
  return (
    <group scale={[scale, scale, scale]}>
      {/* Main hull */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 2, 8]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Superstructure */}
      <mesh position={[0, 1.5, -1]} castShadow receiveShadow>
        <boxGeometry args={[2, 1.5, 2]} />
        <meshStandardMaterial color="#34495e" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Bridge */}
      <mesh position={[0, 2.8, -1.5]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 1, 1.5]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Radar */}
      <mesh position={[0, 3.2, -1]}>
        <cylinderGeometry args={[0.35, 0.35, 0.25, 32]} />
        <meshStandardMaterial color="#e74c3c" metalness={0.9} roughness={0.1} emissive="#c0392b" />
      </mesh>

      {/* Main Mast */}
      <mesh position={[0, 2.5, -1]}>
        <cylinderGeometry args={[0.08, 0.08, 3, 12]} />
        <meshStandardMaterial color="#95a5a6" metalness={0.8} roughness={0.15} />
      </mesh>

      {/* Antenna Array */}
      {[0.3, -0.3].map((offset, i) => (
        <mesh key={i} position={[offset, 3.8, -1]}>
          <cylinderGeometry args={[0.03, 0.03, 1.5, 8]} />
          <meshStandardMaterial color="#3498db" metalness={0.9} roughness={0.1} emissive="#2980b9" />
        </mesh>
      ))}

      {/* Gun Turrets */}
      {[[-1, 0.5, 1], [1, 0.5, 1]].map((pos, i) => (
        <mesh key={`turret${i}`} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.4, 16]} />
          <meshStandardMaterial color="#7f8c8d" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}

      {/* Wake effect */}
      <mesh position={[0, -0.1, 3]} scale={[1, 0.1, 2]}>
        <boxGeometry args={[2, 0.5, 1]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.2} />
      </mesh>
    </group>
  );
};

// Ocean Component
const Ocean = () => {
  const oceanRef = useRef(null);

  useFrame((state) => {
    if (oceanRef.current) {
      oceanRef.current.position.z = (state.clock.elapsedTime * 0.5) % 50;
    }
  });

  return (
    <>
      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200, 32, 32]} />
        <meshStandardMaterial
          color="#0a3d62"
          metalness={0.3}
          roughness={0.6}
          wireframe={false}
        />
      </mesh>
      <mesh ref={oceanRef} position={[0, -1.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[200, 200, 64, 64]} />
        <meshPhongMaterial color="#1a5276" wireframe={false} />
      </mesh>
    </>
  );
};

// 360° Environment Scene
const ImmersiveVRScene = ({ isVRMode, dayNight }) => {
  const lightRef = useRef(null);
  const ambientRef = useRef(null);

  useFrame(() => {
    // Update lighting based on time of day
    if (lightRef.current && ambientRef.current) {
      const time = Date.now() * 0.0001 * dayNight;
      const sunPos = Math.sin(time) * 30;
      lightRef.current.position.set(sunPos, 20, 15);
      const intensity = Math.max(0.3, 0.8 + Math.cos(time) * 0.5);
      lightRef.current.intensity = intensity;
      ambientRef.current.intensity = 0.3 + Math.cos(time) * 0.2;
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.5} color="#87ceeb" />
      <directionalLight
        ref={lightRef}
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize={2048}
        color={dayNight > 0.5 ? "#ffffff" : "#ffa500"}
      />
      <pointLight position={[-15, 10, -20]} intensity={0.3} color="#0099ff" />

      {/* Sky */}
      <Sky sunPosition={[100, 20, 100]} turbidity={dayNight > 0.5 ? 2 : 8} />

      {/* Ocean */}
      <Ocean />

      {/* Ship - center of attention */}
      <ShipModel scale={1.5} />

      {/* Distant horizon elements */}
      <mesh position={[50, 0, 50]}>
        <boxGeometry args={[20, 15, 2]} />
        <meshStandardMaterial color="#4a6fa5" transparent opacity={0.1} />
      </mesh>
    </>
  );
};

// VR Camera Controller
const VRCameraController = ({ isVRMode, enableGyro }) => {
  const { camera } = useThree();
  const deviceOrientationRef = useRef({ alpha: 0, beta: 0, gamma: 0 });

  useEffect(() => {
    if (!enableGyro) return;

    const handleDeviceOrientation = (event) => {
      deviceOrientationRef.current = {
        alpha: event.alpha || 0,
        beta: event.beta || 0,
        gamma: event.gamma || 0,
      };
    };

    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent !== "undefined") {
      window.addEventListener("deviceorientation", handleDeviceOrientation);
      return () => window.removeEventListener("deviceorientation", handleDeviceOrientation);
    }
  }, [enableGyro]);

  useFrame(() => {
    if (enableGyro && deviceOrientationRef.current) {
      const { beta, gamma } = deviceOrientationRef.current;
      const yaw = (gamma * Math.PI) / 180;
      const pitch = (beta * Math.PI) / 180;

      camera.rotation.order = "YXZ";
      camera.rotation.y = yaw;
      camera.rotation.x = pitch;
    }
  });

  return null;
};

const StyledContainer = styled.div`
  font-family: 'Courier New', monospace;
  letter-spacing: 0.02em;
`;

const VRControlsContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 50;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  max-width: 300px;

  @media (max-width: 768px) {
    top: 10px;
    right: 10px;
    gap: 8px;
  }
`;

const VRButton = styled.button`
  px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all
  text-sm backdrop-blur-sm border border-blue-500/50;
  padding: 8px 16px;
  background: linear-gradient(135deg, #0ea5e9, #3b82f6);
  border: 1px solid rgba(59, 130, 246, 0.5);
  border-radius: 8px;
  color: white;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(135deg, #0284c7, #2563eb);
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  &.secondary {
    background: rgba(100, 116, 139, 0.5);
    border-color: rgba(148, 163, 184, 0.5);

    &:hover {
      background: rgba(71, 85, 105, 0.7);
    }
  }
`;

export default function ARVRReality() {
  const [isVRMode, setIsVRMode] = useState(false);
  const [enableGyro, setEnableGyro] = useState(false);
  const [dayNight, setDayNight] = useState(0.7);
  const [showInfo, setShowInfo] = useState(true);
  const canvasRef = useRef(null);

  const handleEnterVR = async () => {
    if (!canvasRef.current) return;

    try {
      const canvas = canvasRef.current.querySelector("canvas");
      if (!canvas) return;

      const gl = canvas.getContext("webgl2");
      if (!gl || !navigator.xr) {
        alert("WebXR not supported on this device");
        return;
      }

      const session = await navigator.xr.requestSession("immersive-vr", {
        requiredFeatures: ["local-floor"],
        optionalFeatures: ["dom-overlay", "dom-overlay-for-handheld-ar"],
      });

      setIsVRMode(true);

      session.addEventListener("end", () => {
        setIsVRMode(false);
      });
    } catch (error) {
      console.log("VR mode not available:", error);
      alert("VR mode requires a compatible VR device or WebXR support");
    }
  };

  const handleGyroPermission = async () => {
    if (typeof window !== "undefined" && typeof (DeviceOrientationEvent as any)?.requestPermission === "function") {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === "granted") {
          setEnableGyro(true);
        }
      } catch (error) {
        console.log("Gyro permission denied:", error);
      }
    } else {
      setEnableGyro(true);
    }
  };

  const handleResetView = () => {
    setIsVRMode(false);
    setEnableGyro(false);
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.8 },
    viewport: { once: false, amount: 0.3 },
  };

  return (
    <StyledContainer className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* SECTION 1: INTRO */}
      <section id="intro" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-transparent to-slate-900/50" />
        </div>

        <motion.div
          className="relative z-10 text-center max-w-3xl px-8"
          {...fadeInUp}
        >
        </motion.div>
      </section>

      {/* SECTION 2: 360° VR MODE - IMMERSIVE */}
      <section className="relative min-h-screen flex items-center py-20">
        <div className="w-full px-8 md:px-16 lg:px-24 max-w-7xl mx-auto">
          <motion.div {...fadeInUp} className="mb-16">
            <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] font-bold mb-6">
              360° VR Exploration
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl">
              Immerse yourself in a fully 360° naval environment. Drag to look around, scroll to zoom, and use gyroscope for true immersion on mobile devices.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <motion.div
              {...fadeInUp}
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-lg p-6"
            >
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 border border-blue-500 flex items-center justify-center mb-4">
                <span className="text-blue-400 font-bold">📱</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Mobile VR</h3>
              <p className="text-slate-400 text-sm">Works with Google Cardboard and other mobile VR headsets. Enter VR mode for split-screen stereo view.</p>
            </motion.div>

            <motion.div
              {...fadeInUp}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-lg p-6"
            >
              <div className="w-12 h-12 rounded-lg bg-cyan-500/20 border border-cyan-500 flex items-center justify-center mb-4">
                <span className="text-cyan-400 font-bold">🎮</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Gyroscope Controls</h3>
              <p className="text-slate-400 text-sm">Enable device orientation for natural head-tracking. Works on both iOS and Android devices.</p>
            </motion.div>

            <motion.div
              {...fadeInUp}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-lg p-6"
            >
              <div className="w-12 h-12 rounded-lg bg-emerald-500/20 border border-emerald-500 flex items-center justify-center mb-4">
                <span className="text-emerald-400 font-bold">🌍</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">360° Environment</h3>
              <p className="text-slate-400 text-sm">Full ocean environment with realistic sky, lighting, and dynamic day/night cycles.</p>
            </motion.div>
          </div>

          {/* Main VR Canvas */}
          <motion.div
            {...fadeInUp}
            ref={canvasRef}
            className="relative w-full aspect-video bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden shadow-2xl"
          >
            <Canvas className="w-full h-full" shadows camera={{ position: [0, 2, 0], fov: 75 }}>
              <ImmersiveVRScene isVRMode={isVRMode} dayNight={dayNight} />
              <VRCameraController isVRMode={isVRMode} enableGyro={enableGyro} />
              <OrbitControls
                enabled={!enableGyro}
                enablePan
                enableZoom
                enableRotate
                autoRotate
                autoRotateSpeed={1}
                minDistance={5}
                maxDistance={100}
              />
            </Canvas>

            {/* Floating VR Controls */}
            <VRControlsContainer>
              <VRButton onClick={handleEnterVR} title="Enter immersive VR mode">
                🥽 VR Mode
              </VRButton>
              <VRButton
                className="secondary"
                onClick={handleGyroPermission}
                style={{
                  background: enableGyro ? "rgba(34, 197, 94, 0.5)" : "rgba(100, 116, 139, 0.5)",
                  borderColor: enableGyro ? "rgba(34, 197, 94, 0.5)" : "rgba(148, 163, 184, 0.5)",
                }}
                title="Enable gyroscope controls"
              >
                📍 {enableGyro ? "Gyro ON" : "Gyro OFF"}
              </VRButton>
              <VRButton
                className="secondary"
                onClick={() => setDayNight(dayNight > 0.5 ? 0.2 : 0.7)}
                title="Toggle day/night"
              >
                {dayNight > 0.5 ? "🌙 Night" : "☀️ Day"}
              </VRButton>
              <VRButton className="secondary" onClick={handleResetView} title="Reset view">
                ↻ Reset
              </VRButton>
            </VRControlsContainer>
          </motion.div>

          {/* Controls Info */}
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 bg-slate-800/50 border border-slate-700 rounded-lg p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg">Controls Guide</h3>
                <button
                  onClick={() => setShowInfo(false)}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-400">
                <div>
                  <p className="text-blue-400 font-semibold mb-2">🖱️ Desktop:</p>
                  <ul className="space-y-1">
                    <li>• Drag to rotate view</li>
                    <li>• Scroll to zoom in/out</li>
                    <li>• Auto-rotate enabled</li>
                  </ul>
                </div>
                <div>
                  <p className="text-blue-400 font-semibold mb-2">📱 Mobile:</p>
                  <ul className="space-y-1">
                    <li>• Drag to rotate view</li>
                    <li>• Pinch to zoom</li>
                    <li>• Enable gyroscope for head-tracking</li>
                    <li>• Enter VR mode for headset use</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="mt-16 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-slate-700 rounded-lg p-8"
          >
            <h3 className="font-display text-2xl font-bold mb-6">Advanced Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-300">
              <div>
                <h4 className="text-blue-400 font-semibold mb-2">🎬 Dynamic Environments</h4>
                <p className="text-sm">Real-time ocean simulation with wave dynamics, realistic sky rendering, and atmospheric effects.</p>
              </div>
              <div>
                <h4 className="text-cyan-400 font-semibold mb-2">🚢 Detailed Ship Model</h4>
                <p className="text-sm">High-fidelity naval vessel with accurate components, lighting, and realistic material properties.</p>
              </div>
              <div>
                <h4 className="text-emerald-400 font-semibold mb-2">🌅 Day/Night Cycle</h4>
                <p className="text-sm">Dynamic lighting system with realistic sun positioning and atmospheric color transitions.</p>
              </div>
              <div>
                <h4 className="text-violet-400 font-semibold mb-2">🎮 Multi-Platform Support</h4>
                <p className="text-sm">WebXR compatible, works on desktop, tablet, smartphone, and with VR headsets.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </StyledContainer>
  );
}
