import { useState, useRef, useMemo, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { Cpu, Layers, Ruler, Wrench, Activity, ChevronDown, ChevronUp, Info, X, TrendingUp, Target, Zap, AlertCircle } from "lucide-react";
import styled from "styled-components";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type EngineComponent = {
  id: string;
  name: string;
  importance: "critical" | "high" | "medium" | "low";
  description: string;
  function: string;
  temperature?: string;
  color: string;
};

const engineComponents: EngineComponent[] = [
  {
    id: "compressor",
    name: "Compressor Stage",
    importance: "critical",
    description: "16-stage axial compressor for high-pressure air intake",
    function: "Compresses incoming air to 40:1 pressure ratio for combustion",
    temperature: "Normal inlet 15°C → 350°C discharge",
    color: "#3b82f6",
  },
  {
    id: "combustor",
    name: "Combustor Chamber",
    importance: "critical",
    description: "Annular combustion chamber with fuel injectors",
    function: "Mixes pressurized air with fuel and ignites for thrust generation",
    temperature: "Peak 1,260°C flame temperature",
    color: "#f97316",
  },
  {
    id: "turbine",
    name: "Turbine Rotor",
    importance: "critical",
    description: "2-stage high-pressure turbine with nickel-cobalt alloy blades",
    function: "Extracts energy from hot exhaust gases to rotate compressor",
    temperature: "Operating at 1,100°C inlet conditions",
    color: "#ec4899",
  },
  {
    id: "exhaust",
    name: "Exhaust Nozzle",
    importance: "high",
    description: "Convergent-divergent exhaust nozzle with afterburner capability",
    function: "Accelerates exhaust gases for thrust vectoring",
    temperature: "Exhaust jet 600°C at full throttle",
    color: "#ef4444",
  },
  {
    id: "bearings",
    name: "Main Bearing",
    importance: "high",
    description: "High-speed rolling element bearing for rotor support",
    function: "Supports turbine and compressor rotor at 180 RPM",
    temperature: "Maintained below 100°C with cooling system",
    color: "#64748b",
  },
  {
    id: "gearbox",
    name: "Power Gearbox",
    importance: "high",
    description: "Reduction gearbox with integrated power takeoff",
    function: "Reduces turbine speed for shaft output to ship propeller",
    temperature: "Operating around 80°C with active cooling",
    color: "#6b7280",
  },
];

const engineImportanceColors = {
  critical: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" },
  high: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30" },
  medium: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30" },
  low: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
};

// VLS Performance Data
const vlsPerformanceData = [
  { cells: 1, launchTime: 8.5, reload: 15, accuracy: 96 },
  { cells: 2, launchTime: 4.2, reload: 8, accuracy: 96 },
  { cells: 4, launchTime: 2.1, reload: 5, accuracy: 96 },
  { cells: 6, launchTime: 1.4, reload: 3.5, accuracy: 95 },
  { cells: 8, launchTime: 1.0, reload: 2.5, accuracy: 94 },
];

// VLS Component Efficiency Data
const vlsComponentEfficiencyData = [
  { name: "Launch Chamber", efficiency: 98, target: 98 },
  { name: "Fire Control", efficiency: 96, target: 95 },
  { name: "Hydraulics", efficiency: 94, target: 95 },
  { name: "Missile Ready", efficiency: 97, target: 95 },
];

// VLS AI Recommendations
const vlsRecommendations = [
  {
    icon: TrendingUp,
    title: "Thermal Management Enhancement",
    description: "Advanced cooling system integration could reduce inter-cell heat transfer by 22%, improving successive launch capabilities during rapid-fire scenarios.",
    severity: "high",
  },
  {
    icon: Target,
    title: "Targeting Precision Upgrade",
    description: "CMS integration optimization can enhance missile-to-target accuracy to 98.5%, utilizing real-time threat data fusion and predictive algorithms.",
    severity: "high",
  },
  {
    icon: Zap,
    title: "Launch Sequencing Automation",
    description: "AI-driven launch sequence optimization could reduce full salvo deployment time from 12 seconds to 8.5 seconds while maintaining safety margins.",
    severity: "high",
  },
  {
    icon: AlertCircle,
    title: "Redundancy Architecture",
    description: "Distributed control system with tri-redundant fire control computers improves system availability to 99.97% and resilience against EW threats.",
    severity: "medium",
  },
];

const components = [
  {
    id: "engine",
    name: "Propulsion Engine",
    category: "Power Systems",
    material: "Inconel 718 Superalloy",
    dimensions: "4.2m × 2.1m × 1.8m",
    weight: "12,500 kg",
    manufacturer: "Bharat Heavy Electricals Ltd",
    function: "Primary propulsion via COGAG configuration. Four LM2500 gas turbines providing 80,000 shp total output.",
    working: [
      "Air intake through filtered ducts",
      "Compression through 16-stage axial compressor",
      "Combustion in annular chamber at 1,260°C",
      "Hot gas expansion through 2-stage turbine",
      "Power transfer to reduction gearbox",
      "Drive shaft rotation at 180 RPM",
    ],
    color: "#d97706",
  },
  {
    id: "sonar",
    name: "Sonar Dome",
    category: "Detection Systems",
    material: "GRP Composite with Acoustic Window",
    dimensions: "3.8m diameter × 2.4m",
    weight: "4,200 kg",
    manufacturer: "BEL Naval Systems",
    function: "Hull-mounted active/passive sonar for submarine detection. HUMSA-NG advanced sonar suite.",
    working: [
      "Transducer array emits acoustic pulses",
      "Sound waves propagate through water",
      "Echo returns from submerged objects",
      "Hydrophone array captures reflections",
      "Digital signal processing filters noise",
      "Target classification via AI algorithms",
    ],
    color: "#3b82f6",
  },
  {
    id: "bridge",
    name: "Combat Bridge",
    category: "Command & Control",
    material: "Kevlar-Reinforced Steel Composite",
    dimensions: "8m × 6m × 3.2m",
    weight: "28,000 kg (with equipment)",
    manufacturer: "Garden Reach Shipbuilders",
    function: "Central command hub integrating all ship systems. Houses CMS, navigation, and tactical data links.",
    working: [
      "Sensor data aggregation from all systems",
      "Real-time tactical picture generation",
      "Threat assessment and prioritization",
      "Weapons assignment and fire control",
      "Communication with fleet command",
      "Navigation and helm control integration",
    ],
    color: "#16a34a",
  },
];

function TurbineEngineModel({ onHoverComponent }: { onHoverComponent: (component: EngineComponent | null) => void }) {
  const { scene } = useGLTF("/ins/turbine__turbofan_engine__jet_engine.glb");
  const groupRef = useRef<THREE.Group>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.updateMatrixWorld(true);
    clone.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  const { camera } = useThree();

  const handlePointerMove = (event: any) => {
    if (!groupRef.current) return;

    const rect = event.target.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, camera);
    const modelMeshes: THREE.Mesh[] = [];
    groupRef.current.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        modelMeshes.push(node as THREE.Mesh);
      }
    });

    const intersects = raycasterRef.current.intersectObjects(modelMeshes);
    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const meshIndex = modelMeshes.findIndex((m) => m === hitMesh);
      const componentIndex = Math.floor((meshIndex / modelMeshes.length) * engineComponents.length);
      onHoverComponent(engineComponents[componentIndex] || null);
    } else {
      onHoverComponent(null);
    }
  };

  const handlePointerLeave = () => {
    onHoverComponent(null);
  };

  return (
    <group
      ref={groupRef}
      scale={[0.8, 0.8, 0.8]}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <primitive object={model} />
    </group>
  );
}

function ComponentModel({ componentId, color, onHoverComponent }: { componentId: string; color: string; onHoverComponent?: (component: EngineComponent | null) => void }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current && componentId !== "engine") ref.current.rotation.y = state.clock.elapsedTime * 0.2;
  });

  if (componentId === "engine") {
    return (
      <group ref={ref}>
        <Suspense fallback={<></>}>
          <TurbineEngineModel onHoverComponent={onHoverComponent || (() => {})} />
        </Suspense>
      </group>
    );
  }

  const models: Record<string, JSX.Element> = {
    engine: (
      <group>
        <mesh><cylinderGeometry args={[1, 1, 2.5, 24]} /><meshStandardMaterial color={color} metalness={0.85} roughness={0.15} /></mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.1, 0.08, 8, 24]} /><meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} /></mesh>
        <mesh position={[0, 1.4, 0]}><cylinderGeometry args={[0.6, 1, 0.5, 24]} /><meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} /></mesh>
        <mesh position={[0, -1.4, 0]}><cylinderGeometry args={[0.4, 0.6, 0.5, 24]} /><meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} /></mesh>
      </group>
    ),
    sonar: (
      <group>
        <mesh><sphereGeometry args={[1.2, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={color} metalness={0.6} roughness={0.3} transparent opacity={0.7} /></mesh>
        <mesh position={[0, -0.2, 0]}><cylinderGeometry args={[1.2, 1.2, 0.4, 32]} /><meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} /></mesh>
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={i} position={[Math.cos(i * Math.PI / 6) * 0.8, 0.3, Math.sin(i * Math.PI / 6) * 0.8]}>
            <sphereGeometry args={[0.06, 8, 8]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
          </mesh>
        ))}
      </group>
    ),
    bridge: (
      <group>
        <mesh><boxGeometry args={[2.5, 1, 1.8]} /><meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} /></mesh>
        <mesh position={[0, 0.6, 0]}><boxGeometry args={[2.2, 0.3, 1.5]} /><meshStandardMaterial color={color} metalness={0.5} roughness={0.3} transparent opacity={0.5} /></mesh>
        <mesh position={[0, -0.6, 0]}><boxGeometry args={[2.8, 0.2, 2]} /><meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} /></mesh>
      </group>
    ),
  };

  return <group ref={ref}>{models[componentId]}</group>;
}

const StyledContainer = styled.div`
  font-family: 'Courier New', monospace;
  letter-spacing: 0.02em;
`;

function VLSGLBModel() {
  let gltfData;
  try {
    gltfData = useGLTF("/components/vertical_launch_system_missile_canisters.glb");
  } catch (error) {
    console.error("Failed to load VLS GLB:", error);
    gltfData = { scene: new THREE.Group() };
  }

  const { scene } = gltfData;
  const groupRef = useRef<THREE.Group>(null);
  const [loadError, setLoadError] = useState(false);

  const model = useMemo(() => {
    try {
      if (!scene || scene.children.length === 0) {
        console.error("VLSGLBModel: Scene is null or empty");
        setLoadError(true);
        return null;
      }

      const clone = scene.clone(true);
      clone.updateMatrixWorld(true);

      let meshCount = 0;
      const bbox = new THREE.Box3();
      let hasValidMeshes = false;

      clone.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) {
          const mesh = node as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          meshCount++;
          hasValidMeshes = true;

          bbox.expandByObject(mesh);

          if (!mesh.material) {
            mesh.material = new THREE.MeshStandardMaterial({
              color: 0x475569,
              metalness: 0.8,
              roughness: 0.2,
            });
          } else if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat: any) => {
              if (mat) {
                mat.metalness = 0.8;
                mat.roughness = 0.2;
              }
            });
          } else {
            const material = mesh.material as any;
            if (material) {
              material.metalness = 0.8;
              material.roughness = 0.2;
            }
          }
        }
      });

      if (!hasValidMeshes) {
        console.warn("VLSGLBModel: No meshes found in model");
        setLoadError(true);
        return null;
      }

      const size = bbox.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = maxDim > 0 ? 2 / maxDim : 1;

      console.log(`✓ VLSGLBModel loaded: ${meshCount} meshes, scale: ${scale.toFixed(2)}`);

      const center = bbox.getCenter(new THREE.Vector3());
      clone.position.sub(center);
      clone.scale.multiplyScalar(scale);

      setLoadError(false);
      return clone;
    } catch (error) {
      console.error("VLSGLBModel error:", error);
      setLoadError(true);
      return null;
    }
  }, [scene]);

  if (loadError || !model) {
    return (
      <group ref={groupRef} rotation={[0, Math.PI / 2, 0]} position={[0, 0, 0]}>
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[2, 2.5, 2]} />
          <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
        </mesh>
        {[[-0.5, 0.5], [0.5, 0.5], [-0.5, -0.5], [0.5, -0.5]].map(([x, z], i) => (
          <group key={i}>
            <mesh position={[x, 0, z]} castShadow receiveShadow>
              <cylinderGeometry args={[0.25, 0.25, 2.4, 12]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[x, 0.8, z]} castShadow receiveShadow>
              <coneGeometry args={[0.2, 0.4, 12]} />
              <meshStandardMaterial color="#dc2626" metalness={0.8} roughness={0.15} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  return (
    <group ref={groupRef} rotation={[0, Math.PI / 2, 0]} position={[0, 0, 0]}>
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload("/ins/turbine__turbofan_engine__jet_engine.glb");

export default function ComponentAnalysis() {
  const [selected, setSelected] = useState(components[0]);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [hoveredComponent, setHoveredComponent] = useState<EngineComponent | null>(null);
  const [showEngineComponents, setShowEngineComponents] = useState(false);

  return (
    <StyledContainer className="h-screen flex flex-col lg:flex-row pt-16">
      {/* Left: 3D View */}
      <div className="flex-1 relative min-h-[50vh] lg:min-h-0">
        <Canvas
          shadows
          camera={{ position: [4, 3, 4], fov: 40 }}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        >
          <color attach="background" args={["#060b16"]} />
          <ambientLight intensity={0.2} />
          <directionalLight position={[5, 5, 5]} intensity={0.6} color="#94a3b8" />
          <pointLight position={[-3, 2, -3]} intensity={0.3} color={selected.color} />
          <ComponentModel componentId={selected.id} color={selected.color} onHoverComponent={selected.id === "engine" ? setHoveredComponent : undefined} />
          <OrbitControls enablePan enableZoom enableRotate autoRotate autoRotateSpeed={0.6} />
          <Environment preset="night" />
        </Canvas>

        {/* Component Selector */}
        <div className="absolute bottom-4 left-4 right-4 flex gap-2">
          {components.map((c) => (
            <button
              key={c.id}
              onClick={() => { setSelected(c); setExpandedStep(null); }}
              className={`flex-1 glass-panel p-2.5 text-center transition-all ${
                selected.id === c.id ? "glass-panel-highlight" : "hover:bg-secondary/40"
              }`}
            >
              <p className="text-[10px] font-body font-medium text-foreground truncate">{c.name}</p>
            </button>
          ))}
        </div>

        <div className="absolute top-4 left-4">
          <h1 className="font-display text-base font-bold text-foreground tracking-wide">Component Analysis</h1>
          <p className="text-[11px] font-mono text-muted-foreground">Engineering Breakdown</p>
        </div>

        {/* Engine Hover Tooltip */}
        <AnimatePresence>
          {selected.id === "engine" && hoveredComponent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`absolute top-20 left-4 z-30 w-80 glass-panel-highlight p-4 border ${engineImportanceColors[hoveredComponent.importance].border}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${hoveredComponent.color}20`, borderColor: hoveredComponent.color, borderWidth: "2px" }}
                >
                  <div className="text-2xl font-bold" style={{ color: hoveredComponent.color }}>
                    {hoveredComponent.id.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-sm font-bold text-foreground">{hoveredComponent.name}</h3>
                  <div className={`inline-block px-2 py-1 rounded text-[10px] font-mono font-semibold mt-1 ${engineImportanceColors[hoveredComponent.importance].bg} ${engineImportanceColors[hoveredComponent.importance].text}`}>
                    {hoveredComponent.importance.toUpperCase()} IMPORTANCE
                  </div>
                  <p className="text-xs text-secondary-foreground mt-2 leading-relaxed">{hoveredComponent.description}</p>
                  <div className="mt-2 pt-2 border-t border-border/30">
                    <p className="text-[10px] font-mono text-muted-foreground mb-1">FUNCTION:</p>
                    <p className="text-xs text-accent">{hoveredComponent.function}</p>
                    {hoveredComponent.temperature && (
                      <div className="mt-2">
                        <p className="text-[10px] font-mono text-muted-foreground mb-1">TEMPERATURE:</p>
                        <p className="text-xs text-orange-400">{hoveredComponent.temperature}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Engine Info Toggle Button */}
        {selected.id === "engine" && (
          <button
            onClick={() => setShowEngineComponents(!showEngineComponents)}
            className="absolute top-4 right-4 z-40 p-2 glass-panel-highlight rounded-lg hover:bg-secondary/40 transition-all border border-primary/30"
            title="Toggle engine components"
          >
            {showEngineComponents ? (
              <X className="w-5 h-5 text-primary" />
            ) : (
              <Info className="w-5 h-5 text-primary" />
            )}
          </button>
        )}

        {/* Engine Component List Modal */}
        <AnimatePresence>
          {selected.id === "engine" && showEngineComponents && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute inset-4 top-20 z-30 bg-background/95 backdrop-blur-lg rounded-lg border border-border/30 p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-display text-lg text-primary tracking-widest font-semibold flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                  ENGINE COMPONENT ANALYSIS
                </h4>
                <button
                  onClick={() => setShowEngineComponents(false)}
                  className="p-1 hover:bg-secondary/30 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="w-full h-px bg-gradient-to-r from-primary/30 to-transparent mb-4" />
              
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                {engineComponents.map((comp) => (
                  <motion.div
                    key={comp.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-4 rounded-lg border transition-all cursor-pointer hover:scale-105 ${
                      hoveredComponent?.id === comp.id
                        ? `border-current ${engineImportanceColors[comp.importance].border} ${engineImportanceColors[comp.importance].bg}`
                        : "border-border/20 bg-secondary/20 hover:bg-secondary/40"
                    }`}
                    onMouseEnter={() => setHoveredComponent(comp)}
                    onMouseLeave={() => setHoveredComponent(null)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-lg font-bold"
                        style={{ backgroundColor: `${comp.color}30`, color: comp.color }}
                      >
                        {comp.id.charAt(0).toUpperCase()}
                      </div>
                      <div className={`text-[10px] font-mono font-bold px-2 py-1 rounded ${engineImportanceColors[comp.importance].bg} ${engineImportanceColors[comp.importance].text}`}>
                        {comp.importance.toUpperCase()}
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-foreground mb-1">{comp.name}</p>
                    <p className="text-xs text-secondary-foreground leading-relaxed mb-2">{comp.function}</p>
                    {comp.temperature && (
                      <div className="text-[10px] text-orange-400 font-mono">
                        {comp.temperature}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Details Panel */}
      <AnimatePresence mode="wait">
        {selected.id === "missile-vls" ? (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full lg:w-[700px] border-l border-border/30 bg-background/50 backdrop-blur-sm overflow-y-auto"
          >
            <div className="p-5">
              <div className="mb-4">
                <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: selected.color }}>{selected.category}</p>
                <h2 className="font-display text-lg font-bold text-foreground tracking-wide mt-1">{selected.name}</h2>
              </div>
              <div className="w-full h-px bg-gradient-to-r from-primary/30 to-transparent mb-4" />

              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { icon: Layers, label: "Material", value: selected.material },
                  { icon: Ruler, label: "Dimensions", value: selected.dimensions },
                  { icon: Activity, label: "Weight", value: selected.weight },
                  { icon: Wrench, label: "Manufacturer", value: selected.manufacturer },
                ].map((spec) => (
                  <div key={spec.label} className="glass-panel p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <spec.icon className="w-3 h-3 text-primary" />
                      <span className="text-[9px] font-mono text-muted-foreground uppercase">{spec.label}</span>
                    </div>
                    <p className="text-xs font-body text-foreground leading-tight">{spec.value}</p>
                  </div>
                ))}
              </div>

              <div className="glass-panel p-4 mb-5">
                <h3 className="font-display text-[10px] text-primary tracking-widest mb-2 flex items-center gap-2 font-semibold">
                  <Cpu className="w-3 h-3" /> FUNCTION
                </h3>
                <p className="text-sm font-body text-secondary-foreground leading-relaxed">{selected.function}</p>
              </div>

              {/* VLS Performance Charts */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="glass-panel p-4">
                  <h4 className="font-display text-[9px] text-primary tracking-widest mb-3 font-semibold">LAUNCH PERFORMANCE</h4>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={vlsPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.2)" />
                      <XAxis dataKey="cells" stroke="#94a3b8" style={{ fontSize: "10px" }} />
                      <YAxis stroke="#94a3b8" style={{ fontSize: "10px" }} />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", color: "#e2e8f0" }} />
                      <Line type="monotone" dataKey="launchTime" stroke="#3b82f6" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="glass-panel p-4">
                  <h4 className="font-display text-[9px] text-primary tracking-widest mb-3 font-semibold">EFFICIENCY ANALYSIS</h4>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={vlsComponentEfficiencyData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.2)" />
                      <XAxis type="number" stroke="#94a3b8" style={{ fontSize: "10px" }} />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", color: "#e2e8f0" }} />
                      <Bar dataKey="efficiency" fill="#10b981" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* VLS Recommendations */}
              <div className="glass-panel p-4 mb-5">
                <h3 className="font-display text-[10px] text-primary tracking-widest mb-3 font-semibold flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" /> AI RECOMMENDATIONS
                </h3>
                <div className="space-y-3">
                  {vlsRecommendations.map((rec, i) => {
                    const Icon = rec.icon;
                    const severityColor = rec.severity === "high" ? "text-red-400 bg-red-500/10" : "text-yellow-400 bg-yellow-500/10";
                    return (
                      <div key={i} className="p-3 bg-secondary/40 rounded-lg border border-border/30">
                        <div className="flex items-start gap-2 mb-1">
                          <Icon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-foreground">{rec.title}</p>
                            <p className={`text-[9px] font-mono mt-1 ${severityColor}`}>{rec.severity.toUpperCase()} PRIORITY</p>
                          </div>
                        </div>
                        <p className="text-xs text-secondary-foreground leading-relaxed mt-2">{rec.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="glass-panel p-4">
                <h3 className="font-display text-[10px] text-primary tracking-widest mb-3 font-semibold">WORKING PRINCIPLE</h3>
                <div className="space-y-2">
                  {selected.working.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <button
                        onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                        className="w-full flex items-center gap-3 p-2 rounded hover:bg-secondary/30 transition-colors"
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-display shrink-0"
                          style={{ backgroundColor: `${selected.color}18`, color: selected.color }}
                        >
                          {i + 1}
                        </div>
                        <span className="text-xs font-body text-foreground text-left flex-1">{step}</span>
                        {expandedStep === i ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                      </button>
                      <AnimatePresence>
                        {expandedStep === i && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden ml-9 pl-3 border-l border-border/30"
                          >
                            <p className="text-[11px] font-mono text-muted-foreground py-2">
                              Phase {i + 1} of {selected.working.length} • Sequential operation
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full lg:w-[400px] border-l border-border/30 bg-background/50 backdrop-blur-sm overflow-y-auto"
          >
            <div className="p-5">
              <div className="mb-4">
                <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: selected.color }}>{selected.category}</p>
                <h2 className="font-display text-lg font-bold text-foreground tracking-wide mt-1">{selected.name}</h2>
              </div>
              <div className="w-full h-px bg-gradient-to-r from-primary/30 to-transparent mb-4" />

              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { icon: Layers, label: "Material", value: selected.material },
                  { icon: Ruler, label: "Dimensions", value: selected.dimensions },
                  { icon: Activity, label: "Weight", value: selected.weight },
                  { icon: Wrench, label: "Manufacturer", value: selected.manufacturer },
                ].map((spec) => (
                  <div key={spec.label} className="glass-panel p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <spec.icon className="w-3 h-3 text-primary" />
                      <span className="text-[9px] font-mono text-muted-foreground uppercase">{spec.label}</span>
                    </div>
                    <p className="text-xs font-body text-foreground leading-tight">{spec.value}</p>
                  </div>
                ))}
              </div>

              <div className="glass-panel p-4 mb-5">
                <h3 className="font-display text-[10px] text-primary tracking-widest mb-2 flex items-center gap-2 font-semibold">
                  <Cpu className="w-3 h-3" /> FUNCTION
                </h3>
                <p className="text-sm font-body text-secondary-foreground leading-relaxed">{selected.function}</p>
              </div>

              <div className="glass-panel p-4">
                <h3 className="font-display text-[10px] text-primary tracking-widest mb-3 font-semibold">WORKING PRINCIPLE</h3>
                <div className="space-y-2">
                  {selected.working.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <button
                        onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                        className="w-full flex items-center gap-3 p-2 rounded hover:bg-secondary/30 transition-colors"
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-display shrink-0"
                          style={{ backgroundColor: `${selected.color}18`, color: selected.color }}
                        >
                          {i + 1}
                        </div>
                        <span className="text-xs font-body text-foreground text-left flex-1">{step}</span>
                        {expandedStep === i ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                      </button>
                      <AnimatePresence>
                        {expandedStep === i && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden ml-9 pl-3 border-l border-border/30"
                          >
                            <p className="text-[11px] font-mono text-muted-foreground py-2">
                              Phase {i + 1} of {selected.working.length} • Sequential operation
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </StyledContainer>
  );
}

