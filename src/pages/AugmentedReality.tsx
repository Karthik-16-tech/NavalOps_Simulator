import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, PerspectiveCamera, useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import styled from "styled-components";

declare global {
  interface Window {
    Hands: any;
    drawConnectors: any;
    drawLandmarks: any;
    HAND_CONNECTIONS: any;
  }
}

type Landmark = { x: number; y: number; z?: number };

type ModelPosition = {
  x: number;
  z: number;
};

const StyledContainer = styled.div`
  font-family: "Courier New", monospace;
  letter-spacing: 0.02em;
`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const distance2D = (a: Landmark, b: Landmark) => Math.hypot(a.x - b.x, a.y - b.y);

const distance3D = (a: Landmark, b: Landmark) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

// Check if a finger is raised/extended
const isFingerRaised = (hand: Landmark[], fingerTip: number, fingerMCP: number, threshold = 0.05): boolean => {
  if (fingerTip >= hand.length || fingerMCP >= hand.length) return false;
  const tipToMCP = distance3D(hand[fingerTip], hand[fingerMCP]);
  const wristToMCP = distance3D(hand[0], hand[fingerMCP]);
  return tipToMCP > threshold && tipToMCP > wristToMCP * 0.5;
};

const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.crossOrigin = "anonymous";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });

function VikrantGLBModel({ scale, position }: { scale: number; position: ModelPosition }) {
  const { scene } = useGLTF("/compo/kiev_class_aircraft_carrier.glb");

  const prepared = useMemo(() => {
    const clone = scene.clone(true);
    const bbox = new THREE.Box3();

    clone.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        bbox.expandByObject(mesh);
      }
    });

    const center = bbox.getCenter(new THREE.Vector3());
    const size = bbox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const normalize = 6 / maxDim;

    clone.position.sub(center);
    clone.scale.setScalar(normalize);

    return clone;
  }, [scene]);

  return (
    <group position={[position.x, 0, position.z]} scale={[scale, scale, scale]}>
      <primitive object={prepared} />
    </group>
  );
}

useGLTF.preload("/compo/kiev_class_aircraft_carrier.glb");

export default function AugmentedReality() {
  const [modelScale, setModelScale] = useState(1);
  const [modelPosition, setModelPosition] = useState<ModelPosition>({ x: 0, z: 0 });
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([0, 3, 10]);
  const [gestureHint, setGestureHint] = useState("Enable camera to start hand gesture controls");
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scriptsReady, setScriptsReady] = useState(false);
  const [gestureReady, setGestureReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const handsRef = useRef<any>(null);
  const processFrameRef = useRef<number | null>(null);

  const zoomBaselineDistanceRef = useRef<number | null>(null);
  const zoomBaselineScaleRef = useRef<number>(1);
  const viewChangeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastViewRef = useRef<string>("front");

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      try {
        await Promise.all([
          loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"),
          loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"),
        ]);
        if (mounted) setScriptsReady(true);
      } catch (error) {
        console.error(error);
        if (mounted) {
          setCameraError("Failed to load hand-tracking libraries. Check internet and refresh.");
        }
      }
    };

    boot();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (processFrameRef.current !== null) {
        cancelAnimationFrame(processFrameRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (handsRef.current?.close) {
        handsRef.current.close();
      }
    };
  }, []);

  const startHandTracking = async () => {
    if (!scriptsReady || !videoRef.current || !overlayCanvasRef.current || !window.Hands) return;

    const hands = new window.Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    hands.onResults((results: any) => {
      if (!videoRef.current) return;

      if (canvas.width !== videoRef.current.videoWidth || canvas.height !== videoRef.current.videoHeight) {
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const landmarks: Landmark[][] = results.multiHandLandmarks ?? [];
      if (landmarks.length === 0) {
        zoomBaselineDistanceRef.current = null;
        setGestureHint("No hand detected. Show your hand in camera view.");
        return;
      }

      landmarks.forEach((lm) => {
        window.drawConnectors?.(ctx, lm, window.HAND_CONNECTIONS, {
          color: "#22d3ee",
          lineWidth: 3,
        });
        window.drawLandmarks?.(ctx, lm, {
          color: "#ffffff",
          lineWidth: 1,
          radius: 2,
        });
      });

      // Two-hand zoom: thumb + fingers distance (together = zoom in, apart = zoom out)
      if (landmarks.length >= 2) {
        const left = landmarks[0];
        const right = landmarks[1];
        
        // Both hands: check thumb distance between hands for zoom
        const leftThumb = left[4];
        const rightThumb = right[4];
        const thumbDistance = distance2D(leftThumb, rightThumb);

        // Thumb + index finger distance for zoom on each hand
        const leftPinch = distance2D(left[4], left[8]);
        const rightPinch = distance2D(right[4], right[8]);

        // If both hands have thumb+index pinched close (zoom in/out gesture)
        if (leftPinch < 0.065 && rightPinch < 0.065) {
          if (zoomBaselineDistanceRef.current === null) {
            zoomBaselineDistanceRef.current = thumbDistance;
            zoomBaselineScaleRef.current = modelScale;
          }

          const ratio = thumbDistance / (zoomBaselineDistanceRef.current || 0.1);
          
          // Zoom in when hands come together, zoom out when moving apart
          if (ratio < 1) {
            // Hands moving closer = zoom in
            const nextScale = clamp(zoomBaselineScaleRef.current / (1 - (1 - ratio) * 0.5), 0.45, 2.5);
            setModelScale(nextScale);
            setGestureHint("🔍 ZOOM IN: Thumb + fingers coming together");
          } else {
            // Hands moving apart = zoom out
            const nextScale = clamp(zoomBaselineScaleRef.current * (1 + (ratio - 1) * 0.5), 0.45, 2.5);
            setModelScale(nextScale);
            setGestureHint("🔍 ZOOM OUT: Thumb + fingers moving apart");
          }
          return;
        }

        // View selection with multiple finger combinations
        const leftFingers = {
          thumb: isFingerRaised(left, 4, 3),
          index: isFingerRaised(left, 8, 7),
          middle: isFingerRaised(left, 12, 11),
          ring: isFingerRaised(left, 16, 15),
          pinky: isFingerRaised(left, 20, 19),
        };

        const rightFingers = {
          thumb: isFingerRaised(right, 4, 3),
          index: isFingerRaised(right, 8, 7),
          middle: isFingerRaised(right, 12, 11),
          ring: isFingerRaised(right, 16, 15),
          pinky: isFingerRaised(right, 20, 19),
        };

        const leftRaisedCount = Object.values(leftFingers).filter(Boolean).length;
        const rightRaisedCount = Object.values(rightFingers).filter(Boolean).length;
        const totalRaised = leftRaisedCount + rightRaisedCount;

        // View gestures (with debouncing)
        if (totalRaised >= 2) {
          if (viewChangeTimerRef.current) clearTimeout(viewChangeTimerRef.current);

          // Front view: 1 finger raised on one hand
          if (totalRaised === 1 && lastViewRef.current !== "front") {
            setCameraPosition([0, 3, 10]);
            lastViewRef.current = "front";
            setGestureHint("👁️ FRONT VIEW: 1 Finger raised");
          }
          // Back view: 2 fingers raised
          else if (totalRaised === 2 && leftRaisedCount === 1 && rightRaisedCount === 1 && lastViewRef.current !== "back") {
            setCameraPosition([0, 3, -10]);
            lastViewRef.current = "back";
            setGestureHint("👁️ BACK VIEW: 2 Fingers raised");
          }
          // Top view: 3 fingers raised
          else if (totalRaised === 3 && lastViewRef.current !== "top") {
            setCameraPosition([0, 15, 0]);
            lastViewRef.current = "top";
            setGestureHint("👁️ TOP VIEW: 3 Fingers raised");
          }
          // Side view (left): Left hand index + pinky raised
          else if (leftFingers.index && leftFingers.pinky && !rightFingers.index && !rightFingers.pinky && lastViewRef.current !== "side-left") {
            setCameraPosition([-15, 3, 0]);
            lastViewRef.current = "side-left";
            setGestureHint("👁️ SIDE VIEW (LEFT): Index + Pinky raised");
          }
          // Right view: Right hand index + pinky raised
          else if (rightFingers.index && rightFingers.pinky && !leftFingers.index && !leftFingers.pinky && lastViewRef.current !== "side-right") {
            setCameraPosition([15, 3, 0]);
            lastViewRef.current = "side-right";
            setGestureHint("👁️ RIGHT VIEW: Index + Pinky raised on right hand");
          }
        }

        zoomBaselineDistanceRef.current = null;
        return;
      }

      zoomBaselineDistanceRef.current = null;

      // Single hand: pinch to move
      const hand = landmarks[0];
      const pinch = distance2D(hand[4], hand[8]);
      if (pinch < 0.055) {
        const wrist = hand[0];
        const targetX = (wrist.x - 0.5) * 10;
        const targetZ = (0.5 - wrist.y) * 10;

        setModelPosition((prev) => ({
          x: prev.x * 0.8 + targetX * 0.2,
          z: prev.z * 0.8 + targetZ * 0.2,
        }));
        setGestureHint("✋ MOVE MODE: Pinch thumb + index finger and drag");
      } else {
        setGestureHint("Ready: Pinch or use two hands for zoom/views");
      }
    });

    handsRef.current = hands;

    const process = async () => {
      if (!videoRef.current || !handsRef.current) return;
      if (videoRef.current.readyState >= 2) {
        await handsRef.current.send({ image: videoRef.current });
      }
      processFrameRef.current = requestAnimationFrame(process);
    };

    processFrameRef.current = requestAnimationFrame(process);
    setGestureReady(true);
  };

  const handleEnableCamera = async () => {
    try {
      setCameraError("");
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera API not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraEnabled(true);
      setGestureHint("📹 Camera enabled. Starting hand tracking...");
      await startHandTracking();
    } catch (error: any) {
      console.error(error);
      setCameraError(
        "Camera access denied or blocked. Allow camera permission and use HTTPS or localhost."
      );
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (processFrameRef.current !== null) {
      cancelAnimationFrame(processFrameRef.current);
      processFrameRef.current = null;
    }
    setCameraEnabled(false);
    setGestureReady(false);
    setCameraError("");
    setGestureHint("Camera stopped. Click Enable Camera to restart.");
    lastViewRef.current = "front";
    setCameraPosition([0, 3, 10]);
  };

  const resetPreview = () => {
    setModelScale(1);
    setModelPosition({ x: 0, z: 0 });
    setCameraPosition([0, 3, 10]);
    lastViewRef.current = "front";
    zoomBaselineDistanceRef.current = null;
    setGestureHint("Reset to default view and position");
  };

  return (
    <StyledContainer className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white pt-20">
      <section className="relative min-h-screen py-14 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-[clamp(2rem,5vw,4rem)] font-bold tracking-tight"
        >
          AR Gesture Control
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400"> INS Vikrant</span>
        </motion.h1>

        <p className="mt-4 text-slate-300 max-w-3xl text-sm md:text-base">
          Camera-assisted hand gesture control precision mode. Use thumb + finger gestures for zoom, single/multiple finger raises for views, and pinch-drag to move. Press Stop Camera to disable anytime.
        </p>

        <div className="mt-8 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          <div className="relative h-[560px] rounded-xl overflow-hidden border border-slate-700/60 bg-slate-900/60">
            <Canvas shadows camera={{ position: cameraPosition, fov: 48 }}>
              <PerspectiveCamera makeDefault position={cameraPosition} fov={48} />
              <ambientLight intensity={0.45} />
              <directionalLight position={[10, 12, 8]} intensity={1.1} castShadow />
              <pointLight position={[-8, 4, -8]} intensity={0.35} color="#67e8f9" />

              <mesh position={[0, -1.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[28, 28]} />
                <meshStandardMaterial color="#13283a" roughness={0.9} metalness={0.15} />
              </mesh>

              <VikrantGLBModel scale={modelScale} position={modelPosition} />
              <OrbitControls enablePan enableZoom enableRotate minDistance={4} maxDistance={18} />
              <Environment preset="city" />
            </Canvas>

            <div className="absolute left-4 right-4 bottom-4 flex gap-2 items-center">
              <button
                onClick={() => setModelScale((s) => clamp(s - 0.1, 0.45, 2.5))}
                className="px-3 py-2 rounded bg-slate-700/80 hover:bg-slate-600/80 text-xs"
              >
                Zoom Out
              </button>
              <div className="px-3 py-2 rounded bg-slate-700/80 text-xs min-w-[90px] text-center">
                {(modelScale * 100).toFixed(0)}%
              </div>
              <button
                onClick={() => setModelScale((s) => clamp(s + 0.1, 0.45, 2.5))}
                className="px-3 py-2 rounded bg-slate-700/80 hover:bg-slate-600/80 text-xs"
              >
                Zoom In
              </button>
              <button
                onClick={resetPreview}
                className="ml-auto px-3 py-2 rounded border border-slate-500/70 hover:border-slate-300 text-xs"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-4">
              <h3 className="text-sm font-semibold text-cyan-300">✋ Hand Gesture Control Guide</h3>
              <ul className="mt-3 text-xs text-slate-300 space-y-2 font-mono">
                <li className="text-cyan-200">🔍 ZOOM:</li>
                <li className="ml-3">• Thumb + 1 finger TOGETHER → Zoom IN</li>
                <li className="ml-3">• Thumb + 1 finger APART → Zoom OUT</li>
                
                <li className="text-cyan-200 mt-3">👁️ VIEW MODES:</li>
                <li className="ml-3">• 1 Finger up → Front View</li>
                <li className="ml-3">• 2 Fingers up → Back View</li>
                <li className="ml-3">• 3 Fingers up → Top View</li>
                <li className="ml-3">• Index + Pinky → Side View</li>
                <li className="ml-3">• Right hand Index + Pinky → Right View</li>
                
                <li className="text-cyan-200 mt-3">✋ MOVE:</li>
                <li className="ml-3">• Pinch (Thumb + Index) &amp; Drag</li>
              </ul>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleEnableCamera}
                  disabled={cameraEnabled}
                  className="flex-1 py-2 rounded bg-gradient-to-r from-blue-600 to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold hover:from-blue-500 hover:to-cyan-500 transition"
                >
                  {cameraEnabled ? "🎥 Active" : "Enable Camera"}
                </button>
                <button
                  onClick={stopCamera}
                  disabled={!cameraEnabled}
                  className="flex-1 py-2 rounded border border-red-500/60 hover:border-red-400 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold text-red-300 hover:text-red-200 transition"
                >
                  Stop Camera
                </button>
              </div>

              <p className="mt-3 text-xs text-slate-400 leading-relaxed">{gestureHint}</p>
              {cameraError && <p className="mt-2 text-xs text-red-400 font-semibold">{cameraError}</p>}
              {!scriptsReady && <p className="mt-2 text-xs text-amber-300">📦 Loading hand-tracking libraries...</p>}
            </div>

            <div className="relative rounded-xl border border-slate-700/60 bg-black overflow-hidden h-[250px]">
              <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1] opacity-85" playsInline muted />
              <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full" />
            </div>
          </div>
        </div>
      </section>
    </StyledContainer>
  );
}
