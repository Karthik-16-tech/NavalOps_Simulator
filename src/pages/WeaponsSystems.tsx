import { Suspense, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { Crosshair, Radar, Shield, Rocket, TrendingUp, Zap, Target, AlertCircle } from "lucide-react";
import styled from "styled-components";
import { useSearchParams } from "react-router-dom";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type WeaponSpec = { label: string; value: string };

type TorpedoComponent = {
  id: string;
  name: string;
  importance: "critical" | "high" | "medium" | "low";
  description: string;
  function: string;
  material: string;
  color: string;
};

const torpedoComponents: TorpedoComponent[] = [
  {
    id: "nose",
    name: "Seeker Nose Cone",
    importance: "critical",
    description: "Acoustic/optical guidance seeker housing with hydrodynamic fairing",
    function: "Detects and locks onto target before terminal phase",
    material: "Titanium composite with sensor array",
    color: "#38bdf8",
  },
  {
    id: "warhead",
    name: "Warhead Section",
    importance: "critical",
    description: "High-explosive fragmentation charge compartment",
    function: "Delivers primary destructive effect on contact/proximity",
    material: "Steel casing with HE payload",
    color: "#f97316",
  },
  {
    id: "avionics",
    name: "Mid-Body Avionics",
    importance: "high",
    description: "Navigation & guidance computer with inertial measurement unit",
    function: "Processes target data and controls torpedo trajectory",
    material: "Composite with sealed electronics",
    color: "#a855f7",
  },
  {
    id: "fuel",
    name: "Fuel & Oxidizer Chamber",
    importance: "high",
    description: "High-energy propellant storage in segregated tanks",
    function: "Powers the turbine engine for sustained propulsion",
    material: "Aluminum alloy pressure vessels",
    color: "#22c55e",
  },
  {
    id: "engine",
    name: "Turbine Engine",
    importance: "critical",
    description: "Two-stroke thermal engine with tail nozzle",
    function: "Generates 45+ knots sustained speed",
    material: "Stainless steel with titanium turbine",
    color: "#ec4899",
  },
  {
    id: "fins",
    name: "Stabilization Fins",
    importance: "medium",
    description: "Rear mounting surfaces with control surfaces",
    function: "Provides hydrodynamic stability during run-out",
    material: "Aluminum with rubber edge bumpers",
    color: "#14b8a6",
  },
];

const importanceColors = {
  critical: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" },
  high: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30" },
  medium: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30" },
  low: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
};

// Performance Analysis Data
const performanceData = [
  { speed: 15, stability: 95, efficiency: 92 },
  { speed: 20, stability: 88, efficiency: 89 },
  { speed: 25, stability: 82, efficiency: 85 },
  { speed: 30, stability: 74, efficiency: 78 },
  { speed: 35, stability: 68, efficiency: 71 },
  { speed: 40, stability: 62, efficiency: 65 },
  { speed: 45, stability: 58, efficiency: 60 },
];

// Component Efficiency Data
const componentEfficiencyData = [
  { name: "Propulsion", efficiency: 87, target: 95 },
  { name: "Guidance", efficiency: 92, target: 95 },
  { name: "Warhead", efficiency: 95, target: 95 },
  { name: "Control Fins", efficiency: 78, target: 95 },
];

// BrahMos Missile Performance Data
const brahmosPerfomanceData = [
  { mach: 1.5, range: 50, accuracy: 88, fuel: 95 },
  { mach: 2.0, range: 120, accuracy: 92, fuel: 88 },
  { mach: 2.5, range: 220, accuracy: 94, fuel: 75 },
  { mach: 2.8, range: 290, accuracy: 96, fuel: 60 },
];

// BrahMos Component Efficiency Data
const brahmoComponentEfficiencyData = [
  { name: "Ramjet Engine", efficiency: 94, target: 95 },
  { name: "Avionics Suite", efficiency: 96, target: 95 },
  { name: "Warhead System", efficiency: 97, target: 95 },
  { name: "Fuel Management", efficiency: 91, target: 95 },
];

// CIWS Performance Data
const ciwsPerformanceData = [
  { rpm: 1000, accuracy: 85, fireRate: 60, ammoUsage: 90 },
  { rpm: 2000, accuracy: 88, fireRate: 75, ammoUsage: 85 },
  { rpm: 3000, accuracy: 91, fireRate: 90, ammoUsage: 78 },
  { rpm: 4000, accuracy: 93, fireRate: 98, ammoUsage: 72 },
  { rpm: 5000, accuracy: 96, fireRate: 99, ammoUsage: 65 },
];

// CIWS Component Efficiency Data
const ciwsComponentEfficiencyData = [
  { name: "Radar System", efficiency: 95, target: 95 },
  { name: "Gun Mechanism", efficiency: 92, target: 95 },
  { name: "Ammunition Feed", efficiency: 88, target: 95 },
  { name: "Fire Control", efficiency: 94, target: 95 },
];

// Professional Recommendations for Torpedo
const torpedoRecommendations = [
  {
    icon: TrendingUp,
    title: "Propulsion Optimization",
    description: "Analysis indicates propulsion efficiency drops at higher speeds. Optimizing propeller hydrodynamic profile may improve stability margin by 8-12%.",
    severity: "high",
  },
  {
    icon: Target,
    title: "Guidance System Enhancement",
    description: "Guidance system response time can be enhanced for improved target tracking accuracy and reduced lock-on time by 15-20%.",
    severity: "medium",
  },
  {
    icon: Zap,
    title: "Control Fin Adjustment",
    description: "Control fin geometry modifications could enhance maneuverability in deep-water conditions and improve lateral acceleration response.",
    severity: "high",
  },
  {
    icon: AlertCircle,
    title: "Thermal Management",
    description: "Engine exhaust thermal signature optimization recommended to reduce detection range by hostile sensors.",
    severity: "low",
  },
];

// Professional Recommendations for BrahMos Missile
const brahmoRecommendations = [
  {
    icon: TrendingUp,
    title: "Fuel Efficiency Optimization",
    description: "Analysis indicates fuel consumption increases non-linearly at Mach 2.8. Ramjet combustion chamber optimization could extend operational range by 12-15%.",
    severity: "high",
  },
  {
    icon: Target,
    title: "Terminal Guidance Enhancement",
    description: "Terminal phase guidance accuracy can be improved through advanced imaging seeker algorithms, reducing circular error probable by 8-10%.",
    severity: "medium",
  },
  {
    icon: Zap,
    title: "Aerodynamic Refinement",
    description: "Nose cone and fin geometry optimization recommended for supersonic efficiency improvement and reduced radar cross-section signature.",
    severity: "high",
  },
  {
    icon: AlertCircle,
    title: "Plasma Sheath Management",
    description: "Communications link management during plasma sheath phase could be enhanced for improved mid-course guidance correction capability.",
    severity: "low",
  },
];

// Professional Recommendations for CIWS (Phalanx)
const ciwsRecommendations = [
  {
    icon: TrendingUp,
    title: "Ammunition Feed Optimization",
    description: "Analysis indicates ammunition feed rate reaches saturation at 4000 RPM. Optimizing feed mechanism could improve sustained fire rate by 7-10%.",
    severity: "high",
  },
  {
    icon: Target,
    title: "Targeting Algorithm Enhancement",
    description: "Fire control algorithm can be refined for improved lock-on speed against fast-moving targets, reducing acquisition time by 12-15%.",
    severity: "high",
  },
  {
    icon: Zap,
    title: "Radar Integration Upgrade",
    description: "Advanced radar fusion capability with ship systems could enhance threat detection range and reduce false alarm rate by 20-25%.",
    severity: "medium",
  },
  {
    icon: AlertCircle,
    title: "Barrel Thermal Management",
    description: "Cooling system optimization recommended for extended continuous operation at maximum fire rate and improved barrel lifespan.",
    severity: "low",
  },
];

// Rafale Fighter Performance Data
const rafalePerformanceData = [
  { altitude: 5, speed: 400, fuelConsumption: 95, g_force: 6 },
  { altitude: 10, speed: 600, fuelConsumption: 88, g_force: 7 },
  { altitude: 15, speed: 800, fuelConsumption: 85, g_force: 8.5 },
  { altitude: 20, speed: 1000, fuelConsumption: 78, g_force: 9 },
  { altitude: 25, speed: 1200, fuelConsumption: 72, g_force: 8 },
  { altitude: 30, speed: 1350, fuelConsumption: 65, g_force: 6.5 },
];

// Rafale Component Efficiency Data
const rafaleComponentEfficiencyData = [
  { name: "Engine Performance", efficiency: 96, target: 95 },
  { name: "Avionics Suite", efficiency: 94, target: 95 },
  { name: "Weapon Systems", efficiency: 91, target: 95 },
  { name: "Flight Controls", efficiency: 97, target: 95 },
];

// Radar Performance Data
const radarPerformanceData = [
  { range: 50, tracking: 40, power: 85, detection: 92 },
  { range: 100, tracking: 85, power: 82, detection: 94 },
  { range: 150, tracking: 130, power: 78, detection: 95 },
  { range: 250, tracking: 185, power: 72, detection: 96 },
  { range: 350, tracking: 200, power: 65, detection: 97 },
  { range: 400, tracking: 200, power: 55, detection: 96 },
];

// Radar Component Efficiency Data
const radarComponentEfficiencyData = [
  { name: "Antenna Array", efficiency: 94, target: 95 },
  { name: "Signal Processor", efficiency: 96, target: 95 },
  { name: "Power Supply", efficiency: 91, target: 95 },
  { name: "Cooling System", efficiency: 89, target: 95 },
];

// Professional Recommendations for Radar
const radarRecommendations = [
  {
    icon: TrendingUp,
    title: "Antenna Element Optimization",
    description: "Analysis indicates antenna element phasing efficiency drops at 350km range. T/R module impedance matching optimization could improve detection probability by 5-8%.",
    severity: "high",
  },
  {
    icon: Target,
    title: "Signal Processing Enhancement",
    description: "Advanced clutter rejection algorithms can be implemented to improve target detection in high sea-state conditions, reducing false alarm rate by 15-20%.",
    severity: "high",
  },
  {
    icon: Zap,
    title: "Power Efficiency Refinement",
    description: "Transmitter RF amplifier efficiency optimization recommended to reduce power consumption by 12-15% while maintaining detection range.",
    severity: "medium",
  },
  {
    icon: AlertCircle,
    title: "Thermal Management Upgrade",
    description: "Enhanced cooling system for sustained multi-function operation could extend system duty cycle by 20% during intensive air defense scenarios.",
    severity: "medium",
  },
];

// Professional Recommendations for Rafale M Fighter
const rafaleRecommendations = [
  {
    icon: TrendingUp,
    title: "Engine Performance Optimization",
    description: "Analysis indicates fuel efficiency can be improved at high-altitude cruise. M88 engine inlet optimization could extend loiter time by 10-12%.",
    severity: "high",
  },
  {
    icon: Target,
    title: "Targeting Pod Enhancement",
    description: "TALIOS targeting pod integration can be refined for improved infrared tracking and faster target acquisition in complex environments.",
    severity: "medium",
  },
  {
    icon: Zap,
    title: "Weapon System Integration",
    description: "Distributed weapon control system upgrade could enhance rapid-fire capability and multi-target engagement sequences by 15-18%.",
    severity: "high",
  },
  {
    icon: AlertCircle,
    title: "Aerodynamic Tuning",
    description: "Pitch control surface optimization for carrier operations could improve deck landing precision and reduce approach instability.",
    severity: "medium",
  },
];

type WeaponConfig = {
  id: string;
  name: string;
  subtitle: string;
  icon: typeof Crosshair;
  color: string;
  specs: WeaponSpec[];
  description: string;
  components?: string[];
  ignitionRate?: string;
};

const weapons: WeaponConfig[] = [
  {
    id: "torpedo",
    name: "Starburst Torpedo",
    subtitle: "Sketchfab GLB Tactical Torpedo",
    icon: Crosshair,
    color: "#ea580c",
    specs: [
      { label: "Type", value: "SCFI Starburst Torpedo v2" },
      { label: "Range", value: "18 km" },
      { label: "Speed", value: "45 knots" },
      { label: "Warhead", value: "HE Penetration Class" },
      { label: "Guidance", value: "Inertial + Active Terminal" },
    ],
    description: "Imported GLB torpedo model with detailed body sections and propulsion housing for high-fidelity visualization in the weapons suite.",
    ignitionRate: "7.5 ms ignition-cycle response",
    components: [
      "Nose sensor seeker",
      "Warhead compartment",
      "Mid-body avionics bay",
      "Fuel and oxidizer chamber",
      "Propulsion nozzle cluster",
      "Rear stabilization fins",
    ],
  },
  {
    id: "missile",
    name: "BrahMos Missile",
    subtitle: "Supersonic Cruise Missile",
    icon: Rocket,
    color: "#dc2626",
    specs: [
      { label: "Type", value: "BrahMos Block III" },
      { label: "Range", value: "290 km" },
      { label: "Speed", value: "Mach 2.8" },
      { label: "Warhead", value: "300 kg" },
      { label: "Launch", value: "Vertical Launch System" },
    ],
    description: "World's fastest supersonic cruise missile. Fire-and-forget capability with advanced terminal guidance.",
  },
  {
    id: "radar",
    name: "Phased Array Radar",
    subtitle: "Multi-Function Surveillance",
    icon: Radar,
    color: "#3b82f6",
    specs: [
      { label: "Type", value: "AESA MF-STAR" },
      { label: "Range", value: "400 km" },
      { label: "Tracking", value: "200+ targets" },
      { label: "Band", value: "S-Band / X-Band" },
      { label: "Mode", value: "Air/Surface/Track" },
    ],
    description: "Active Electronically Scanned Array radar with simultaneous multi-function capability for 3D air surveillance.",
  },
  {
    id: "ciws",
    name: "AK-630 CIWS",
    subtitle: "Close-In Weapon System",
    icon: Shield,
    color: "#16a34a",
    specs: [
      { label: "Type", value: "AK-630M" },
      { label: "Caliber", value: "30mm" },
      { label: "Rate of Fire", value: "5,000 RPM" },
      { label: "Range", value: "4 km" },
      { label: "Tracking", value: "Automated Radar" },
    ],
    description: "Last line of defense against incoming anti-ship missiles. Fully automated engagement with radar-directed fire control.",
  },
];

function TorpedoGLBModel({ onHoverComponent }: { onHoverComponent: (component: TorpedoComponent | null) => void }) {
  const { scene } = useGLTF("/scfi_starburst_torpedo_v2.glb");
  const groupRef = useRef<THREE.Group>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  const meshes = useMemo(() => {
    const meshList: THREE.Mesh[] = [];
    scene.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        meshList.push(node as THREE.Mesh);
      }
    });
    return meshList;
  }, [scene]);

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

  const { camera, raycaster } = useThree();

  const handlePointerMove = (event: any) => {
    if (!groupRef.current || meshes.length === 0) return;

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
      const componentIndex = Math.floor((meshIndex / modelMeshes.length) * torpedoComponents.length);
      onHoverComponent(torpedoComponents[componentIndex] || null);
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
      rotation={[0, Math.PI / 2, 0]}
      scale={[1.1, 1.1, 1.1]}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <primitive object={model} />
    </group>
  );
}

function BrahMosGLBModel() {
  const { scene } = useGLTF("/brahmos_missile.glb");
  const groupRef = useRef<THREE.Group>(null);

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

  return (
    <group
      ref={groupRef}
      rotation={[0, Math.PI / 2, 0]}
      scale={[1.2, 1.2, 1.2]}
    >
      <primitive object={model} />
    </group>
  );
}

function CIWSGLBModel() {
  const { scene } = useGLTF("/phalanx_ciws.glb");
  const groupRef = useRef<THREE.Group>(null);

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

  return (
    <group
      ref={groupRef}
      rotation={[0, Math.PI / 2, 0]}
      scale={[1.3, 1.3, 1.3]}
    >
      <primitive object={model} />
    </group>
  );
}

function RafaleGLBModel() {
  let gltfData;
  try {
    gltfData = useGLTF("/components/Untitled.glb");
  } catch (error) {
    console.error("Failed to load Rafale GLB:", error);
    gltfData = { scene: new THREE.Group() };
  }
  
  const { scene } = gltfData;
  const groupRef = useRef<THREE.Group>(null);
  const [loadError, setLoadError] = useState(false);

  const model = useMemo(() => {
    try {
      if (!scene || scene.children.length === 0) {
        console.error("RafaleGLBModel: Scene is null or empty");
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
          
          // Calculate bounding box
          bbox.expandByObject(mesh);
          
          // Ensure mesh has material
          if (!mesh.material) {
            mesh.material = new THREE.MeshStandardMaterial({ 
              color: 0x9ca3af,
              metalness: 0.6,
              roughness: 0.4,
            });
          } else if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat: any) => {
              if (mat) {
                mat.metalness = 0.6;
                mat.roughness = 0.4;
              }
            });
          } else {
            const material = mesh.material as any;
            if (material) {
              material.metalness = 0.6;
              material.roughness = 0.4;
            }
          }
        }
      });
      
      if (!hasValidMeshes) {
        console.warn("RafaleGLBModel: No meshes found in model");
        setLoadError(true);
        return null;
      }
      
      // Calculate scale to fit in reasonable bounds (2x2x2 unit cube)
      const size = bbox.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = maxDim > 0 ? 2 / maxDim : 1;
      
      console.log(`✓ RafaleGLBModel loaded successfully:`);
      console.log(`  Meshes: ${meshCount}, Size: ${size.x.toFixed(2)}x${size.y.toFixed(2)}x${size.z.toFixed(2)}, Scale: ${scale.toFixed(2)}`);
      
      // Center the model
      const center = bbox.getCenter(new THREE.Vector3());
      clone.position.sub(center);
      clone.scale.multiplyScalar(scale);
      
      setLoadError(false);
      return clone;
    } catch (error) {
      console.error("RafaleGLBModel error:", error);
      setLoadError(true);
      return null;
    }
  }, [scene]);

  // Fallback visual representation of a fighter jet if model fails to load
  if (loadError || !model) {
    return (
      <group
        ref={groupRef}
        rotation={[0, Math.PI / 2, 0]}
        position={[0, 0, 0]}
      >
        {/* Fuselage */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.15, 0.15]} />
          <meshStandardMaterial color="#555555" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Cockpit */}
        <mesh position={[0.35, 0.05, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Left Wing */}
        <mesh position={[-0.1, 0, 0.35]} castShadow receiveShadow>
          <boxGeometry args={[0.6, 0.05, 0.3]} />
          <meshStandardMaterial color="#555555" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Right Wing */}
        <mesh position={[-0.1, 0, -0.35]} castShadow receiveShadow>
          <boxGeometry args={[0.6, 0.05, 0.3]} />
          <meshStandardMaterial color="#555555" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Tail */}
        <mesh position={[-0.4, 0.15, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.3, 0.2, 0.1]} />
          <meshStandardMaterial color="#555555" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
    );
  }

  return (
    <group
      ref={groupRef}
      rotation={[0, Math.PI / 2, 0]}
      position={[0, 0, 0]}
    >
      <primitive object={model} />
    </group>
  );
}

function RadarGLBModel() {
  const { scene } = useGLTF("/low_poly_radar.glb");
  const groupRef = useRef<THREE.Group>(null);

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

  return (
    <group
      ref={groupRef}
      rotation={[0, Math.PI / 2, 0]}
      scale={[1.2, 1.2, 1.2]}
    >
      <primitive object={model} />
    </group>
  );
}

function WeaponModel({
  weaponId,
  color,
  progress,
  onHoverComponent,
}: {
  weaponId: string;
  color: string;
  progress: number;
  onHoverComponent?: (component: TorpedoComponent | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current && weaponId !== "torpedo") groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
  });

  if (weaponId === "torpedo") {
    return (
      <group ref={groupRef}>
        <Suspense fallback={<div>Loading...</div>}>
          <TorpedoGLBModel onHoverComponent={onHoverComponent || (() => {})} />
        </Suspense>
      </group>
    );
  }

  if (weaponId === "missile") {
    return (
      <group ref={groupRef}>
        <Suspense fallback={<div>Loading...</div>}>
          <BrahMosGLBModel />
        </Suspense>
      </group>
    );
  }

  if (weaponId === "ciws") {
    return (
      <group ref={groupRef}>
        <Suspense fallback={<div>Loading...</div>}>
          <CIWSGLBModel />
        </Suspense>
      </group>
    );
  }

  if (weaponId === "radar") {
    return (
      <group ref={groupRef}>
        <Suspense fallback={<div>Loading...</div>}>
          <RadarGLBModel />
        </Suspense>
      </group>
    );
  }

  const models: Record<string, JSX.Element> = {
    torpedo: (
      <group>
        <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.15, 0.12, 3, 16]} /><meshStandardMaterial color={color} metalness={0.8} roughness={0.2} /></mesh>
        <mesh position={[1.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}><coneGeometry args={[0.15, 0.4, 16]} /><meshStandardMaterial color={color} metalness={0.8} roughness={0.2} /></mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[-1.5, 0, 0]} rotation={[i * Math.PI / 2, 0, Math.PI / 4]}><boxGeometry args={[0.02, 0.4, 0.2]} /><meshStandardMaterial color={color} metalness={0.7} roughness={0.3} /></mesh>
        ))}
      </group>
    ),
    missile: (
      <group>
        <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.2, 0.18, 3.5, 16]} /><meshStandardMaterial color={color} metalness={0.8} roughness={0.15} /></mesh>
        <mesh position={[2, 0, 0]} rotation={[0, 0, Math.PI / 2]}><coneGeometry args={[0.2, 0.6, 16]} /><meshStandardMaterial color={color} metalness={0.9} roughness={0.1} /></mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[-1.2, 0, 0]} rotation={[i * Math.PI / 2, 0, 0.3]}><boxGeometry args={[0.8, 0.02, 0.35]} /><meshStandardMaterial color={color} metalness={0.7} roughness={0.3} /></mesh>
        ))}
      </group>
    ),
    radar: (
      <group>
        <mesh position={[0, -0.5, 0]}><cylinderGeometry args={[0.15, 0.2, 1.5, 8]} /><meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} /></mesh>
        <mesh position={[0, 0.5, 0]} rotation={[0.2, 0, 0]}><boxGeometry args={[2, 1.2, 0.1]} /><meshStandardMaterial color={color} metalness={0.9} roughness={0.1} emissive={color} emissiveIntensity={0.1} /></mesh>
      </group>
    ),
    ciws: (
      <group>
        <mesh position={[0, -0.3, 0]}><cylinderGeometry args={[0.5, 0.6, 0.6, 8]} /><meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} /></mesh>
        <mesh position={[0, 0.2, 0]}><sphereGeometry args={[0.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={color} metalness={0.8} roughness={0.2} /></mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} position={[0.7 + i * 0.02, 0.2, (i - 2.5) * 0.05]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.02, 0.02, 1.2, 6]} /><meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} /></mesh>
        ))}
      </group>
    ),
  };

  return <group ref={groupRef}>{models[weaponId]}</group>;
}

useGLTF.preload("/scfi_starburst_torpedo_v2.glb");
useGLTF.preload("/brahmos_missile.glb");
useGLTF.preload("/phalanx_ciws.glb");
useGLTF.preload("/low_poly_radar.glb");

const StyledContainer = styled.div`
  font-family: 'Inter', 'Poppins', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  letter-spacing: 0.02em;
  
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap');
`;

const GlassPanel = styled.div`
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  
  &:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.15);
  }
`;

const DashboardSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const StyledButtonWrapper = styled.div`
  .styled-button {
    position: relative;
    padding: 0.75rem 1.5rem;
    font-size: 0.95rem;
    font-weight: 600;
    color: #ffffff;
    background: linear-gradient(to bottom, #171717, #242424);
    border-radius: 9999px;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 1), 0 10px 20px rgba(0, 0, 0, 0.4);
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #292929;
    font-family: 'Inter', 'Poppins', 'Roboto', sans-serif;
  }

  .styled-button::before {
    content: "";
    position: absolute;
    top: -2px;
    right: -1px;
    bottom: -1px;
    left: -1px;
    background: linear-gradient(to bottom, #292929, #000000);
    z-index: -1;
    border-radius: 9999px;
    transition: all 0.2s ease;
    opacity: 1;
  }

  .styled-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 1), 0 15px 30px rgba(0, 0, 0, 0.5);
  }

  .styled-button:active {
    transform: translateY(2px);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 1), 0 5px 10px rgba(0, 0, 0, 0.4);
  }

  .styled-button .inner-button {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(to bottom, #171717, #242424);
    width: 36px;
    height: 36px;
    margin-left: 8px;
    border-radius: 50%;
    box-shadow: 0 0 1px rgba(0, 0, 0, 1);
    border: 1px solid #252525;
    transition: all 0.2s ease;
  }

  .styled-button .inner-button::before {
    content: "";
    position: absolute;
    top: -2px;
    right: -1px;
    bottom: -1px;
    left: -1px;
    background: linear-gradient(to bottom, #292929, #000000);
    z-index: -1;
    border-radius: 9999px;
    transition: all 0.2s ease;
    opacity: 1;
  }
  
  .styled-button .inner-button .icon {
    filter: drop-shadow(0 10px 20px rgba(26, 25, 25, 0.9))
      drop-shadow(0 0 4px rgba(0, 0, 0, 1));
    transition: all 0.4s ease-in-out;
  }
  
  .styled-button .inner-button .icon:hover {
    filter: drop-shadow(0 10px 20px rgba(50, 50, 50, 1))
      drop-shadow(0 0 20px rgba(2, 2, 2, 1));
    transform: rotate(-35deg);
  }
`;

export default function WeaponsSystems() {
  const [searchParams] = useSearchParams();
  const initialWeaponId = searchParams.get("weapon");
  const initialWeapon = weapons.find((weapon) => weapon.id === initialWeaponId) ?? weapons[0];

  const [selected, setSelected] = useState<WeaponConfig>(initialWeapon);
  const [fighterAssembly, setFighterAssembly] = useState(0);
  const [hoveredComponent, setHoveredComponent] = useState<TorpedoComponent | null>(null);
  const [showTorpedoInfo, setShowTorpedoInfo] = useState(false);
  const [showBrahMosInfo, setShowBrahMosInfo] = useState(false);
  const [showCIWSInfo, setShowCIWSInfo] = useState(false);
  const [showRadarInfo, setShowRadarInfo] = useState(false);
  const [showRafaleInfo, setShowRafaleInfo] = useState(false);
  const [showFiringSimulationPrompt, setShowFiringSimulationPrompt] = useState(false);
  const [showVideoOverlay, setShowVideoOverlay] = useState(false);
  const [videoElapsed, setVideoElapsed] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mobileMode = searchParams.get("mobile") === "1";

  return (
    <StyledContainer className={`min-h-screen flex flex-col relative overflow-x-hidden overflow-y-auto pt-16 pb-10 ${mobileMode ? "bg-[#02050b]" : ""}`}>
      {/* Top weapon selector */}
      <div className="px-6 py-3 flex items-center gap-2 border-b border-border/30 bg-background/80 backdrop-blur-sm">
        {weapons.map((w) => (
          <button
            key={w.id}
            onClick={() => {
              setSelected(w);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-body font-medium transition-all ${
              selected.id === w.id
                ? "glass-panel-highlight text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            }`}
          >
            <w.icon className="w-3.5 h-3.5" style={{ color: selected.id === w.id ? w.color : undefined }} />
            <span className="hidden sm:inline">{w.name}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={selected.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex min-h-0"
          >
            {/* 3D Viewer */}
            <div className="flex-1 relative min-h-[68vh] lg:min-h-[calc(100vh-10rem)]">
              <Canvas
                shadows
                camera={{ position: [4, 3, 4], fov: 40 }}
                gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
              >
                <color attach="background" args={["#060b16"]} />
                <ambientLight intensity={0.2} />
                <directionalLight position={[5, 5, 5]} intensity={0.6} color="#94a3b8" />
                <pointLight position={[-3, 2, -3]} intensity={0.3} color={selected.color} />
                <WeaponModel
                  weaponId={selected.id}
                  color={selected.color}
                  progress={selected.id === "torpedo" ? 0 : fighterAssembly}
                  onHoverComponent={selected.id === "torpedo" ? setHoveredComponent : undefined}
                />
                <OrbitControls enablePan enableZoom enableRotate autoRotate={selected.id !== "torpedo"} autoRotateSpeed={0.8} />
                <Environment preset="night" />
              </Canvas>

              {/* Hover Component Tooltip */}
              <AnimatePresence>
                {selected.id === "torpedo" && hoveredComponent && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`absolute top-20 left-4 z-30 w-80 glass-panel-highlight p-4 border ${importanceColors[hoveredComponent.importance].border}`}
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
                        <div className={`inline-block px-2 py-1 rounded text-[10px] font-mono font-semibold mt-1 ${importanceColors[hoveredComponent.importance].bg} ${importanceColors[hoveredComponent.importance].text}`}>
                          {hoveredComponent.importance.toUpperCase()} IMPORTANCE
                        </div>
                        <p className="text-xs text-secondary-foreground mt-2 leading-relaxed">{hoveredComponent.description}</p>
                        <div className="mt-2 pt-2 border-t border-border/30">
                          <p className="text-[10px] font-mono text-muted-foreground mb-1">FUNCTION:</p>
                          <p className="text-xs text-accent">{hoveredComponent.function}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Torpedo Info Button - Below 3D Model */}
              {selected.id === "torpedo" && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setShowTorpedoInfo(!showTorpedoInfo)}
                  className="absolute bottom-4 right-4 w-12 h-12 rounded-lg bg-blue-600/40 hover:bg-blue-600/60 border border-blue-500/60 hover:border-blue-500 flex items-center justify-center transition-all shadow-lg hover:shadow-blue-500/20"
                  title="Torpedo Info"
                >
                  <span className="text-lg">ℹ️</span>
                </motion.button>
              )}

              {/* BrahMos Info Button - Below 3D Model */}
              {selected.id === "missile" && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setShowBrahMosInfo(!showBrahMosInfo)}
                  className="absolute bottom-4 right-4 w-12 h-12 rounded-lg bg-red-600/40 hover:bg-red-600/60 border border-red-500/60 hover:border-red-500 flex items-center justify-center transition-all shadow-lg hover:shadow-red-500/20"
                  title="Missile Info"
                >
                  <span className="text-lg">ℹ️</span>
                </motion.button>
              )}

              {/* Torpedo Info Panel - Collapsible Below 3D Model */}
              {selected.id === "torpedo" && showTorpedoInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="absolute bottom-20 right-4 left-4 glass-panel border border-blue-500/30 rounded-lg p-4 z-20"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-display text-sm font-bold text-foreground">TORPEDO INFORMATION</h4>
                    <button
                      onClick={() => setShowTorpedoInfo(false)}
                      className="text-muted-foreground hover:text-foreground text-lg"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-2 mb-4">
                    {selected.specs.map((spec) => (
                      <div key={spec.label} className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-mono">{spec.label}:</span>
                        <span className="text-foreground font-semibold">{spec.value}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-secondary-foreground mb-4">{selected.description}</p>

                  {/* Video Simulation Icon */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setShowFiringSimulationPrompt(true)}
                    className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-red-600/40 to-orange-600/40 border border-red-500/60 hover:border-red-500 text-red-300 hover:text-red-200 text-sm font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <span>🎬</span>
                    <span>CREATE FIRING SIMULATION</span>
                  </motion.button>
                </motion.div>
              )}

              {/* BrahMos Info Panel - Collapsible Below 3D Model */}
              {selected.id === "missile" && showBrahMosInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="absolute bottom-20 right-4 left-4 glass-panel border border-red-500/30 rounded-lg p-4 z-20"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-display text-sm font-bold text-foreground">BRAHMŌS MISSILE INFORMATION</h4>
                    <button
                      onClick={() => setShowBrahMosInfo(false)}
                      className="text-muted-foreground hover:text-foreground text-lg"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-2 mb-4">
                    {selected.specs.map((spec) => (
                      <div key={spec.label} className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-mono">{spec.label}:</span>
                        <span className="text-foreground font-semibold">{spec.value}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-secondary-foreground">{selected.description}</p>
                </motion.div>
              )}

              {/* CIWS Info Button - Below 3D Model */}
              {selected.id === "ciws" && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setShowCIWSInfo(!showCIWSInfo)}
                  className="absolute bottom-4 right-4 w-12 h-12 rounded-lg bg-green-600/40 hover:bg-green-600/60 border border-green-500/60 hover:border-green-500 flex items-center justify-center transition-all shadow-lg hover:shadow-green-500/20"
                  title="CIWS Info"
                >
                  <span className="text-lg">ℹ️</span>
                </motion.button>
              )}

              {/* CIWS Info Panel - Collapsible Below 3D Model */}
              {selected.id === "ciws" && showCIWSInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="absolute bottom-20 right-4 left-4 glass-panel border border-green-500/30 rounded-lg p-4 z-20"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-display text-sm font-bold text-foreground">PHALANX CIWS INFORMATION</h4>
                    <button
                      onClick={() => setShowCIWSInfo(false)}
                      className="text-muted-foreground hover:text-foreground text-lg"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-2 mb-4">
                    {selected.specs.map((spec) => (
                      <div key={spec.label} className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-mono">{spec.label}:</span>
                        <span className="text-foreground font-semibold">{spec.value}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-secondary-foreground">{selected.description}</p>
                </motion.div>
              )}

              {/* Radar Info Button - Below 3D Model */}
              {selected.id === "radar" && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setShowRadarInfo(!showRadarInfo)}
                  className="absolute bottom-4 right-4 w-12 h-12 rounded-lg bg-blue-600/40 hover:bg-blue-600/60 border border-blue-500/60 hover:border-blue-500 flex items-center justify-center transition-all shadow-lg hover:shadow-blue-500/20"
                  title="Radar Info"
                >
                  <span className="text-lg">ℹ️</span>
                </motion.button>
              )}

              {/* Radar Info Panel - Collapsible Below 3D Model */}
              {selected.id === "radar" && showRadarInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="absolute bottom-20 right-4 left-4 glass-panel border border-blue-500/30 rounded-lg p-4 z-20"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-display text-sm font-bold text-foreground">PHASED ARRAY RADAR INFORMATION</h4>
                    <button
                      onClick={() => setShowRadarInfo(false)}
                      className="text-muted-foreground hover:text-foreground text-lg"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-2 mb-4">
                    {selected.specs.map((spec) => (
                      <div key={spec.label} className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-mono">{spec.label}:</span>
                        <span className="text-foreground font-semibold">{spec.value}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-secondary-foreground">{selected.description}</p>
                </motion.div>
              )}

              {/* Rafale Info Button - Below 3D Model */}
              {selected.id === "rafale" && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setShowRafaleInfo(!showRafaleInfo)}
                  className="absolute bottom-4 right-4 w-12 h-12 rounded-lg bg-sky-600/40 hover:bg-sky-600/60 border border-sky-500/60 hover:border-sky-500 flex items-center justify-center transition-all shadow-lg hover:shadow-sky-500/20"
                  title="Rafale Info"
                >
                  <span className="text-lg">ℹ️</span>
                </motion.button>
              )}

              {/* Rafale Info Panel - Collapsible Below 3D Model */}
              {selected.id === "rafale" && showRafaleInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="absolute bottom-20 right-4 left-4 glass-panel border border-sky-500/30 rounded-lg p-4 z-20"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-display text-sm font-bold text-foreground">RAFALE M INFORMATION</h4>
                    <button
                      onClick={() => setShowRafaleInfo(false)}
                      className="text-muted-foreground hover:text-foreground text-lg"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-2 mb-4">
                    {selected.specs.map((spec) => (
                      <div key={spec.label} className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-mono">{spec.label}:</span>
                        <span className="text-foreground font-semibold">{spec.value}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-secondary-foreground">{selected.description}</p>
                </motion.div>
              )}

              {selected.id === "rafale" && (
                <div className="absolute bottom-4 left-4 right-4 glass-panel p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => setFighterAssembly(0)}
                      className="px-3 py-1.5 text-xs rounded-md bg-secondary/70 hover:bg-secondary text-foreground"
                    >
                      Assemble
                    </button>
                    <button
                      onClick={() => setFighterAssembly(1)}
                      className="px-3 py-1.5 text-xs rounded-md bg-secondary/70 hover:bg-secondary text-foreground"
                    >
                      Disassemble
                    </button>
                    <span className="ml-auto text-[10px] font-mono text-muted-foreground">
                      {Math.round(fighterAssembly * 100)}% OPEN
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={fighterAssembly}
                    onChange={(event) => setFighterAssembly(Number(event.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
              )}
            </div>

            {/* Specs Panel */}
            <div className="w-80 border-l border-border/30 bg-background/50 backdrop-blur-sm p-5 flex flex-col">
              <h3 className="font-display text-xs text-primary tracking-widest mb-4 font-semibold">SPECIFICATIONS</h3>
              <div className="space-y-3 mb-6">
                {selected.specs.map((spec) => (
                  <div key={spec.label} className="flex justify-between items-center py-2 border-b border-border/20">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{spec.label}</span>
                    <span className="text-xs font-body text-foreground">{spec.value}</span>
                  </div>
                ))}
              </div>
              <div className="glass-panel p-4 flex-1">
                <h4 className="font-display text-[10px] text-primary tracking-widest mb-2 font-semibold">OVERVIEW</h4>
                <p className="text-sm font-body text-secondary-foreground leading-relaxed">{selected.description}</p>
                {selected.ignitionRate && (
                  <p className="text-xs font-mono text-accent mt-3">Ignition Rate: {selected.ignitionRate}</p>
                )}
                {selected.components && (
                  <div className="mt-3">
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.16em] mb-2">Components</p>
                    <div className="space-y-1">
                      {selected.components.map((component) => (
                        <p key={component} className="text-xs text-secondary-foreground">• {component}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 glass-panel p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="status-dot-active" />
                  <span className="text-[10px] font-mono text-accent">COMBAT READY</span>
                </div>
                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "95%" }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: selected.color }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Firing Simulation Prompt Modal */}
      <AnimatePresence>
        {showFiringSimulationPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFiringSimulationPrompt(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel border border-red-500/40 rounded-lg p-6 w-full max-w-sm shadow-2xl"
            >
              <h2 className="font-display text-lg font-bold text-foreground mb-3">FIRING SIMULATION</h2>
              <p className="text-sm text-secondary-foreground mb-6">Create an AI-generated sample torpedo firing simulation video?</p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowFiringSimulationPrompt(false)}
                  className="flex-1 py-2 px-4 rounded-lg bg-secondary/60 hover:bg-secondary text-foreground text-sm font-semibold transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => {
                    setShowFiringSimulationPrompt(false);
                    setShowVideoOverlay(true);
                  }}
                  className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white text-sm font-semibold transition-all"
                >
                  GENERATE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Overlay - Plays Over 3D Model */}
      <AnimatePresence>
        {showVideoOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl rounded-lg overflow-hidden border border-blue-500/40 shadow-2xl"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowVideoOverlay(false);
                  if (videoRef.current) {
                    videoRef.current.pause();
                  }
                }}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-lg bg-black/60 hover:bg-black/80 border border-white/30 hover:border-white/60 flex items-center justify-center text-white transition-all"
              >
                ✕
              </button>

              {/* Video Player */}
              <video
                ref={videoRef}
                src="/Futuristic_Holographic_Torpedo_Simulation.mp4"
                controls
                autoPlay
                onTimeUpdate={(e) => setVideoElapsed(e.currentTarget.currentTime)}
                className="w-full h-auto bg-black"
                style={{ filter: "brightness(1.1) contrast(1.1)" }}
              />

              {/* Video Info */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-4 left-4 px-3 py-2 bg-black/70 border border-blue-500/50 rounded text-blue-300 text-xs font-mono"
              >
                TORPEDO FIRING SIMULATION - {Math.floor(videoElapsed)}s
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Professional Analytics Dashboard - For Torpedo Only */}
      {selected.id === "torpedo" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="px-6 py-8 max-w-7xl mx-auto w-full"
        >
          {/* Dashboard Header */}
          <div className="mb-8">
            <h2 className="font-display text-2xl font-semibold text-foreground tracking-tight mb-2" style={{ fontFamily: 'Poppins' }}>
              System Performance Analytics
            </h2>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: 'Inter' }}>
              Real-time performance metrics and optimization recommendations
            </p>
          </div>

          {/* Performance Charts Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <DashboardSection>
            {/* Performance Analysis Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <GlassPanel className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6" style={{ fontFamily: 'Poppins' }}>
                Speed vs Stability Analysis
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="speed" stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="stability"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1500}
                  />
                  <Line
                    type="monotone"
                    dataKey="efficiency"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
              </GlassPanel>
            </motion.div>

            {/* Component Efficiency Chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <GlassPanel className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6" style={{ fontFamily: 'Poppins' }}>
                Component Efficiency Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={componentEfficiencyData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="efficiency" fill="#06b6d4" isAnimationActive={true} animationDuration={1500} />
                  <Bar dataKey="target" fill="rgba(6, 182, 212, 0.2)" isAnimationActive={true} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
              </GlassPanel>
            </motion.div>
            </DashboardSection>
          </motion.div>

          {/* Recommendations Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <GlassPanel className="p-8">
            <h2 className="text-xl font-semibold text-foreground mb-2" style={{ fontFamily: 'Poppins' }}>
              System Analysis & Recommendations
            </h2>
            <p className="text-sm text-muted-foreground mb-8" style={{ fontFamily: 'Inter' }}>
              Performance optimization opportunities based on current operational parameters
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {torpedoRecommendations.map((rec, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + idx * 0.1 }}
                  className="p-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-all"
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <rec.icon className="w-5 h-5" style={{ color: rec.severity === 'high' ? '#ef4444' : rec.severity === 'medium' ? '#f97316' : '#10b981' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground text-sm mb-1" style={{ fontFamily: 'Poppins' }}>
                        {rec.title}
                      </h4>
                      <p className="text-xs text-secondary-foreground leading-relaxed" style={{ fontFamily: 'Inter' }}>
                        {rec.description}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <div
                          className="h-1.5 rounded-full flex-shrink-0"
                          style={{
                            width: '24px',
                            backgroundColor: rec.severity === 'high' ? '#ef4444' : rec.severity === 'medium' ? '#f97316' : '#10b981',
                            opacity: 0.6,
                          }}
                        />
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">
                          {rec.severity} Priority
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            </GlassPanel>
          </motion.div>

          {/* Footer Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-8 text-center text-xs text-muted-foreground" style={{ fontFamily: 'Inter' }}
          >
            <p>Performance data based on operational testing and simulation modeling. Recommendations subject to validation testing.</p>
          </motion.div>
        </motion.div>
      )}

      {/* Professional Analytics Dashboard - For BrahMos Missile */}
      {selected.id === "missile" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="px-6 py-8 max-w-7xl mx-auto w-full"
        >
          {/* Dashboard Header */}
          <div className="mb-8">
            <h2 className="font-display text-2xl font-semibold text-foreground tracking-tight mb-2" style={{ fontFamily: 'Poppins' }}>
              System Performance Analytics
            </h2>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: 'Inter' }}>
              Real-time performance metrics and optimization recommendations
            </p>
          </div>

          {/* Performance Charts Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <DashboardSection>
            {/* Performance Analysis Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <GlassPanel className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6" style={{ fontFamily: 'Poppins' }}>
                Mach Number vs Range Analysis
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={brahmosPerfomanceData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="mach" stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="range"
                    stroke="#dc2626"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1500}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
              </GlassPanel>
            </motion.div>

            {/* Component Efficiency Chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <GlassPanel className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6" style={{ fontFamily: 'Poppins' }}>
                System Efficiency Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={brahmoComponentEfficiencyData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="efficiency" fill="#dc2626" isAnimationActive={true} animationDuration={1500} />
                  <Bar dataKey="target" fill="rgba(220, 38, 38, 0.2)" isAnimationActive={true} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
              </GlassPanel>
            </motion.div>
            </DashboardSection>
          </motion.div>

          {/* Recommendations Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <GlassPanel className="p-8">
            <h2 className="text-xl font-semibold text-foreground mb-2" style={{ fontFamily: 'Poppins' }}>
              System Analysis & Recommendations
            </h2>
            <p className="text-sm text-muted-foreground mb-8" style={{ fontFamily: 'Inter' }}>
              Performance optimization opportunities based on current operational parameters
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {brahmoRecommendations.map((rec, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + idx * 0.1 }}
                  className="p-4 rounded-lg border border-red-500/20 bg-red-500/5 hover:border-red-500/40 hover:bg-red-500/10 transition-all"
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <rec.icon className="w-5 h-5" style={{ color: rec.severity === 'high' ? '#ef4444' : rec.severity === 'medium' ? '#f97316' : '#10b981' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground text-sm mb-1" style={{ fontFamily: 'Poppins' }}>
                        {rec.title}
                      </h4>
                      <p className="text-xs text-secondary-foreground leading-relaxed" style={{ fontFamily: 'Inter' }}>
                        {rec.description}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <div
                          className="h-1.5 rounded-full flex-shrink-0"
                          style={{
                            width: '24px',
                            backgroundColor: rec.severity === 'high' ? '#ef4444' : rec.severity === 'medium' ? '#f97316' : '#10b981',
                            opacity: 0.6,
                          }}
                        />
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">
                          {rec.severity} Priority
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            </GlassPanel>
          </motion.div>

          {/* Footer Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-8 text-center text-xs text-muted-foreground" style={{ fontFamily: 'Inter' }}
          >
            <p>Performance data based on operational testing and simulation modeling. Recommendations subject to validation testing.</p>
          </motion.div>
        </motion.div>
      )}

      {/* Professional Analytics Dashboard - For CIWS (Phalanx) */}
      {selected.id === "ciws" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="px-6 py-8 max-w-7xl mx-auto w-full"
        >
          {/* Dashboard Header */}
          <div className="mb-8">
            <h2 className="font-display text-2xl font-semibold text-foreground tracking-tight mb-2" style={{ fontFamily: 'Poppins' }}>
              System Performance Analytics
            </h2>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: 'Inter' }}>
              Real-time performance metrics and optimization recommendations
            </p>
          </div>

          {/* Performance Charts Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <DashboardSection>
            {/* Performance Analysis Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <GlassPanel className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6" style={{ fontFamily: 'Poppins' }}>
                RPM vs Accuracy Analysis
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={ciwsPerformanceData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="rpm" stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1500}
                  />
                  <Line
                    type="monotone"
                    dataKey="fireRate"
                    stroke="#fbbf24"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
              </GlassPanel>
            </motion.div>

            {/* Component Efficiency Chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <GlassPanel className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6" style={{ fontFamily: 'Poppins' }}>
                System Efficiency Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ciwsComponentEfficiencyData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="efficiency" fill="#16a34a" isAnimationActive={true} animationDuration={1500} />
                  <Bar dataKey="target" fill="rgba(22, 163, 74, 0.2)" isAnimationActive={true} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
              </GlassPanel>
            </motion.div>
            </DashboardSection>
          </motion.div>

          {/* Recommendations Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <GlassPanel className="p-8">
            <h2 className="text-xl font-semibold text-foreground mb-2" style={{ fontFamily: 'Poppins' }}>
              System Analysis & Recommendations
            </h2>
            <p className="text-sm text-muted-foreground mb-8" style={{ fontFamily: 'Inter' }}>
              Performance optimization opportunities based on current operational parameters
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ciwsRecommendations.map((rec, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + idx * 0.1 }}
                  className="p-4 rounded-lg border border-green-500/20 bg-green-500/5 hover:border-green-500/40 hover:bg-green-500/10 transition-all"
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <rec.icon className="w-5 h-5" style={{ color: rec.severity === 'high' ? '#ef4444' : rec.severity === 'medium' ? '#f97316' : '#10b981' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground text-sm mb-1" style={{ fontFamily: 'Poppins' }}>
                        {rec.title}
                      </h4>
                      <p className="text-xs text-secondary-foreground leading-relaxed" style={{ fontFamily: 'Inter' }}>
                        {rec.description}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <div
                          className="h-1.5 rounded-full flex-shrink-0"
                          style={{
                            width: '24px',
                            backgroundColor: rec.severity === 'high' ? '#ef4444' : rec.severity === 'medium' ? '#f97316' : '#10b981',
                            opacity: 0.6,
                          }}
                        />
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">
                          {rec.severity} Priority
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            </GlassPanel>
          </motion.div>

          {/* Footer Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-8 text-center text-xs text-muted-foreground" style={{ fontFamily: 'Inter' }}
          >
            <p>Performance data based on operational testing and simulation modeling. Recommendations subject to validation testing.</p>
          </motion.div>
        </motion.div>
      )}

      {selected.id === "rafale" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="px-6 py-8 max-w-7xl mx-auto w-full"
        >
          {/* Dashboard Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'Poppins' }}>
              System Performance Analytics
            </h2>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: 'Inter' }}>
              Real-time performance metrics and optimization recommendations
            </p>
          </div>

          {/* Performance Charts Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <DashboardSection>
            {/* Performance Analysis Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <GlassPanel className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6" style={{ fontFamily: 'Poppins' }}>
                Altitude vs Speed Analysis
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={rafalePerformanceData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="altitude" stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="speed"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1500}
                  />
                  <Line
                    type="monotone"
                    dataKey="fuelConsumption"
                    stroke="#fbbf24"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
              </GlassPanel>
            </motion.div>

            {/* Component Efficiency Chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <GlassPanel className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6" style={{ fontFamily: 'Poppins' }}>
                System Efficiency Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={rafaleComponentEfficiencyData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="efficiency" fill="#2563eb" isAnimationActive={true} animationDuration={1500} />
                  <Bar dataKey="target" fill="rgba(37, 99, 235, 0.2)" isAnimationActive={true} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
              </GlassPanel>
            </motion.div>
            </DashboardSection>
          </motion.div>

          {/* Recommendations Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <GlassPanel className="p-8">
            <h2 className="text-xl font-semibold text-foreground mb-2" style={{ fontFamily: 'Poppins' }}>
              System Analysis & Recommendations
            </h2>
            <p className="text-sm text-muted-foreground mb-8" style={{ fontFamily: 'Inter' }}>
              Performance optimization opportunities based on current operational parameters
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rafaleRecommendations.map((rec, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + idx * 0.1 }}
                  className="p-4 rounded-lg border border-sky-500/20 bg-sky-500/5 hover:border-sky-500/40 hover:bg-sky-500/10 transition-all"
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <rec.icon className="w-5 h-5" style={{ color: rec.severity === 'high' ? '#ef4444' : rec.severity === 'medium' ? '#f97316' : '#0ea5e9' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground text-sm mb-1" style={{ fontFamily: 'Poppins' }}>
                        {rec.title}
                      </h4>
                      <p className="text-xs text-secondary-foreground leading-relaxed" style={{ fontFamily: 'Inter' }}>
                        {rec.description}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <div
                          className="h-1.5 rounded-full flex-shrink-0"
                          style={{
                            width: '24px',
                            backgroundColor: rec.severity === 'high' ? '#ef4444' : rec.severity === 'medium' ? '#f97316' : '#0ea5e9',
                            opacity: 0.6,
                          }}
                        />
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">
                          {rec.severity} Priority
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            </GlassPanel>
          </motion.div>

          {/* Footer Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-8 text-center text-xs text-muted-foreground" style={{ fontFamily: 'Inter' }}
          >
            <p>Performance data based on operational testing and simulation modeling. Recommendations subject to validation testing.</p>
          </motion.div>
        </motion.div>
      )}

      {selected.id === "radar" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="px-6 py-8 max-w-7xl mx-auto w-full"
        >
          {/* Dashboard Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'Poppins' }}>
              System Performance Analytics
            </h2>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: 'Inter' }}>
              Real-time performance metrics and optimization recommendations
            </p>
          </div>

          {/* Performance Charts Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <DashboardSection>
            {/* Performance Analysis Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <GlassPanel className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6" style={{ fontFamily: 'Poppins' }}>
                Detection Range vs Performance
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={radarPerformanceData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="range" stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="detection"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1500}
                  />
                  <Line
                    type="monotone"
                    dataKey="tracking"
                    stroke="#fbbf24"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
              </GlassPanel>
            </motion.div>

            {/* Component Efficiency Chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <GlassPanel className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6" style={{ fontFamily: 'Poppins' }}>
                System Efficiency Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={radarComponentEfficiencyData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="efficiency" fill="#3b82f6" isAnimationActive={true} animationDuration={1500} />
                  <Bar dataKey="target" fill="rgba(59, 130, 246, 0.2)" isAnimationActive={true} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
              </GlassPanel>
            </motion.div>
            </DashboardSection>
          </motion.div>

          {/* Recommendations Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <GlassPanel className="p-8">
            <h2 className="text-xl font-semibold text-foreground mb-2" style={{ fontFamily: 'Poppins' }}>
              System Analysis & Recommendations
            </h2>
            <p className="text-sm text-muted-foreground mb-8" style={{ fontFamily: 'Inter' }}>
              Performance optimization opportunities based on current operational parameters
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {radarRecommendations.map((rec, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + idx * 0.1 }}
                  className="p-4 rounded-lg border border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40 hover:bg-blue-500/10 transition-all"
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <rec.icon className="w-5 h-5" style={{ color: rec.severity === 'high' ? '#ef4444' : rec.severity === 'medium' ? '#f97316' : '#0ea5e9' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground text-sm mb-1" style={{ fontFamily: 'Poppins' }}>
                        {rec.title}
                      </h4>
                      <p className="text-xs text-secondary-foreground leading-relaxed" style={{ fontFamily: 'Inter' }}>
                        {rec.description}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <div
                          className="h-1.5 rounded-full flex-shrink-0"
                          style={{
                            width: '24px',
                            backgroundColor: rec.severity === 'high' ? '#ef4444' : rec.severity === 'medium' ? '#f97316' : '#0ea5e9',
                            opacity: 0.6,
                          }}
                        />
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">
                          {rec.severity} Priority
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            </GlassPanel>
          </motion.div>

          {/* Footer Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-8 text-center text-xs text-muted-foreground" style={{ fontFamily: 'Inter' }}
          >
            <p>Performance data based on operational testing and simulation modeling. Recommendations subject to validation testing.</p>
          </motion.div>
        </motion.div>
      )}
    </StyledContainer>
  );
}
