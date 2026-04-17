import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardList,
  Cuboid,
  Eye,
  ExternalLink,
  Grid3x3,
  Info,
  Layers3,
  Link as LinkIcon,
  PackageOpen,
  RotateCcw,
  Ruler,
  Ship,
  SlidersHorizontal,
} from "lucide-react";
import styled from "styled-components";

type Vector3Tuple = [number, number, number];

type ShipVariant =
  | "hull"
  | "deck"
  | "island"
  | "mast"
  | "elevator"
  | "aircraft"
  | "rafale"
  | "helicopter"
  | "raft"
  | "radar"
  | "module";

interface ShipPartConfig {
  id: string;
  name: string;
  category: string;
  description: string;
  dimensions: string;
  variant: ShipVariant;
  color: string;
  position: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: Vector3Tuple;
  hitbox: Vector3Tuple;
  explodeOffset: Vector3Tuple;
  calloutOffset?: Vector3Tuple;
  detail: string[];
}

interface ShipPartProps extends ShipPartConfig {
  progress: number;
  onSelect: (part: ShipPartConfig) => void;
}

interface BlenderComponentInfo {
  id: string;
  name: string;
  category: string;
  description: string;
  dimensions: string;
  detail: string[];
  hotspot: Vector3Tuple;
}

const referenceImages = [
  { file: "ins 1.jpg", label: "Starboard bow" },
  { file: "ins 3.jpg", label: "Flight deck overview" },
  { file: "ins 4.jpg", label: "Elevator and deck edge" },
  { file: "ins 5.jpg", label: "Port quarter" },
  { file: "ins 6.jpg", label: "Carrier profile" },
  { file: "ins 7.jpg", label: "Deck markings" },
  { file: "ins 8.jpg", label: "Helicopter and aircraft deck" },
  { file: "ins 9.jpg", label: "Aft deck systems" },
  { file: "ins 10.jpg", label: "Isometric bow angle" },
  { file: "ins 11.jpg", label: "Island and air wing" },
  { file: "ins 12.jpg", label: "Stern and island separation" },
  { file: "ins 13.jpg", label: "Flight deck linework" },
  { file: "ins 14.jpg", label: "Detailed stern section" },
  { file: "ins 16.jpg", label: "Hangar edge details" },
  { file: "ins2.jpg", label: "Wireframe reference" },
];

const shipParts: ShipPartConfig[] = [
  {
    id: "hull-core",
    name: "Hull Core",
    category: "Primary Structure",
    description: "Main hull block carrying the carrier's displacement, ballast volume, and underwater profile.",
    dimensions: "Approx. 262m x 58m x 9m",
    variant: "hull",
    color: "#d7dce3",
    position: [0, -0.15, 0],
    hitbox: [14.5, 1.8, 4.8],
    explodeOffset: [0, -2.6, 0],
    detail: ["Keel line", "Bilge turn", "Armor belt", "Stern run"],
  },
  {
    id: "hull-port",
    name: "Port Hull Shoulder",
    category: "Primary Structure",
    description: "Outer port hull volume and side plating visible below the flight deck overhang.",
    dimensions: "Continuous side shell",
    variant: "module",
    color: "#c8ced6",
    position: [-3.7, 0.35, 0],
    hitbox: [6.8, 0.7, 4.2],
    explodeOffset: [-4.3, -0.3, 0.3],
    detail: ["Shell plating", "Sponson cutouts", "Vent apertures"],
  },
  {
    id: "hull-starboard",
    name: "Starboard Hull Shoulder",
    category: "Primary Structure",
    description: "Starboard-side shell, hangar openings, and service apertures beneath the deck edge.",
    dimensions: "Continuous side shell",
    variant: "module",
    color: "#c8ced6",
    position: [3.5, 0.25, 0],
    hitbox: [6.8, 0.7, 4.2],
    explodeOffset: [4.1, -0.2, -0.2],
    detail: ["Deck edge bays", "Maintenance access", "Side openings"],
  },
  {
    id: "flight-deck",
    name: "Angled Flight Deck",
    category: "Flight Operations",
    description: "Main operating surface, landing area, and launch run for the MiG-29K air wing.",
    dimensions: "Full-length deck slab",
    variant: "deck",
    color: "#3f434a",
    position: [0, 1.55, 0.1],
    hitbox: [12.8, 0.24, 4.0],
    explodeOffset: [0.1, 1.2, 0],
    detail: ["Landing strip", "Takeoff run", "Deck markings", "Safe walk lines"],
  },
  {
    id: "bow-deck",
    name: "Bow Deck",
    category: "Flight Operations",
    description: "Raised forward deck section and ski-jump profile at the bow.",
    dimensions: "Forward launch segment",
    variant: "deck",
    color: "#4a4f57",
    position: [-5.7, 1.58, 0.1],
    rotation: [0, 0, -0.08],
    hitbox: [4.2, 0.2, 3.0],
    explodeOffset: [-2.4, 1.1, 0.1],
    detail: ["Ski-jump lip", "Catwalk edge", "Forward tie-down points"],
  },
  {
    id: "stern-deck",
    name: "Stern Deck",
    category: "Flight Operations",
    description: "After flight deck, arrester zone, and deck-edge safety structures.",
    dimensions: "Aft landing segment",
    variant: "deck",
    color: "#444850",
    position: [5.1, 1.56, 0.15],
    rotation: [0, 0, 0.02],
    hitbox: [4.8, 0.22, 3.1],
    explodeOffset: [2.2, 1.0, -0.1],
    detail: ["Arrestor area", "Deck edge rail", "Tie-down grid"],
  },
  {
    id: "island-base",
    name: "Island Base",
    category: "Command & Control",
    description: "Carrier island structure with bridge block, flight control, and electronics spaces.",
    dimensions: "Multi-level superstructure",
    variant: "island",
    color: "#cfd3da",
    position: [0.9, 2.0, -0.05],
    hitbox: [2.8, 3.8, 1.8],
    explodeOffset: [1.6, 2.4, -0.8],
    detail: ["Bridge windows", "Flight control", "Radar rooms", "Communications bay"],
  },
  {
    id: "mast",
    name: "Main Mast",
    category: "Sensors",
    description: "Integrated mast supporting navigation, communications, and air search sensors.",
    dimensions: "Raised sensor stack",
    variant: "mast",
    color: "#9ca3af",
    position: [1.0, 4.1, -0.05],
    hitbox: [1.2, 3.4, 1.2],
    explodeOffset: [2.2, 3.5, -1.0],
    detail: ["IFF arrays", "Nav radar", "Aerials", "SATCOM domes"],
  },
  {
    id: "island-radar",
    name: "Radar Array",
    category: "Sensors",
    description: "Surface and air surveillance sensor package mounted above the island roofline.",
    dimensions: "Phased-array style face",
    variant: "radar",
    color: "#7dd3fc",
    position: [1.75, 4.55, 0.1],
    hitbox: [1.4, 1.1, 0.9],
    explodeOffset: [3.0, 4.2, 0.4],
    detail: ["Search face", "Target tracking", "Sector sweep"],
  },
  {
    id: "fwd-elevator",
    name: "Forward Aircraft Elevator",
    category: "Deck Handling",
    description: "Forward lift connecting hangar deck and flight deck for aircraft movement.",
    dimensions: "Lift platform",
    variant: "elevator",
    color: "#5b616a",
    position: [-1.9, 1.54, -0.4],
    hitbox: [2.5, 0.15, 2.2],
    explodeOffset: [-1.1, 1.0, -1.0],
    detail: ["Lift platform", "Guide rails", "Safety locks"],
  },
  {
    id: "aft-elevator",
    name: "Aft Aircraft Elevator",
    category: "Deck Handling",
    description: "Aft lift used for aircraft transfer between hangar and deck staging areas.",
    dimensions: "Lift platform",
    variant: "elevator",
    color: "#666c75",
    position: [2.5, 1.54, 0.95],
    hitbox: [2.4, 0.15, 2.0],
    explodeOffset: [1.6, 1.1, 0.9],
    detail: ["Lift platform", "Deck hatch", "Lowering bay"],
  },
  {
    id: "port-sponson",
    name: "Port Sponson",
    category: "Flight Operations",
    description: "Widened flight deck edge and service sponson visible along the port side.",
    dimensions: "Outboard deck extension",
    variant: "module",
    color: "#cfd4db",
    position: [-4.7, 1.1, -1.1],
    hitbox: [3.0, 1.2, 1.7],
    explodeOffset: [-4.0, 0.6, -1.7],
    detail: ["Deck edge support", "Maintenance access", "Outboard rail"],
  },
  {
    id: "starboard-sponson",
    name: "Starboard Sponson",
    category: "Flight Operations",
    description: "Outboard support and service structure at the starboard deck edge.",
    dimensions: "Outboard deck extension",
    variant: "module",
    color: "#cfd4db",
    position: [4.7, 1.05, -0.85],
    hitbox: [3.1, 1.2, 1.7],
    explodeOffset: [4.2, 0.5, -1.5],
    detail: ["Deck edge support", "Cable tray", "Safety rail"],
  },
  {
    id: "port-raft-bank",
    name: "Port Life Raft Bank",
    category: "Safety",
    description: "Clustered life raft pods and emergency equipment stowed along the deck edge.",
    dimensions: "Emergency stowage",
    variant: "raft",
    color: "#d9dde4",
    position: [-5.0, 1.25, 1.35],
    hitbox: [1.8, 0.8, 1.0],
    explodeOffset: [-5.1, 0.8, 2.0],
    detail: ["Inflatable rafts", "Release cradle", "Rescue hardware"],
  },
  {
    id: "starboard-raft-bank",
    name: "Starboard Life Raft Bank",
    category: "Safety",
    description: "Emergency raft stowage and deck side rescue package on the starboard flank.",
    dimensions: "Emergency stowage",
    variant: "raft",
    color: "#d9dde4",
    position: [5.2, 1.2, 1.25],
    hitbox: [1.8, 0.8, 1.0],
    explodeOffset: [5.3, 0.8, 1.9],
    detail: ["Inflatable rafts", "Release cradle", "Rescue hardware"],
  },
  {
    id: "lead-aircraft",
    name: "MiG-29K Fighter",
    category: "Air Wing",
    description: "Carrier-borne strike fighter represented here as a detailed deck asset.",
    dimensions: "Single-seat fighter",
    variant: "aircraft",
    color: "#c7cdd5",
    position: [-1.2, 1.8, -1.0],
    rotation: [0, -0.2, 0],
    hitbox: [1.6, 0.6, 1.6],
    explodeOffset: [-1.8, 1.4, -2.0],
    detail: ["Fuselage", "Folding wings", "Twin tail fins", "Navy markings"],
  },
  {
    id: "port-aircraft-row",
    name: "Aircraft Parking Row",
    category: "Air Wing",
    description: "Forward parked aircraft line arranged for launch sequencing and deck handling.",
    dimensions: "Deck spot cluster",
    variant: "aircraft",
    color: "#bfc5ce",
    position: [-3.4, 1.77, -1.25],
    rotation: [0, 0.1, 0],
    hitbox: [4.8, 0.8, 1.6],
    explodeOffset: [-4.0, 1.2, -2.1],
    detail: ["Nose-wheel alignment", "Wing fold line", "Launch staging"],
  },
  {
    id: "starboard-aircraft-row",
    name: "Aircraft Recovery Row",
    category: "Air Wing",
    description: "Starboard-side deck parking line used for recovery and refueling sequencing.",
    dimensions: "Deck spot cluster",
    variant: "aircraft",
    color: "#bfc5ce",
    position: [3.8, 1.77, 1.25],
    rotation: [0, -0.1, 0],
    hitbox: [4.8, 0.8, 1.6],
    explodeOffset: [4.6, 1.2, 2.1],
    detail: ["Parking spots", "Taxi lane", "Refuel position"],
  },
  {
    id: "helicopter",
    name: "Carrier Helicopter",
    category: "Air Wing",
    description: "Deck helicopter used for search, rescue, and utility operations.",
    dimensions: "Twin-engine utility helicopter",
    variant: "helicopter",
    color: "#d0d6de",
    position: [-0.3, 1.8, 0.8],
    rotation: [0, 0.35, 0],
    hitbox: [1.8, 1.1, 1.8],
    explodeOffset: [-0.8, 1.6, 1.6],
    detail: ["Rotor head", "Tail boom", "Landing gear", "Mission pod"],
  },
  {
    id: "stern-module",
    name: "Aft Service Module",
    category: "Support Systems",
    description: "Aft service block covering stores, deck machinery, and access to maintenance zones.",
    dimensions: "Service block",
    variant: "module",
    color: "#c4cad3",
    position: [4.5, 1.0, -1.35],
    hitbox: [2.8, 1.0, 1.6],
    explodeOffset: [4.2, 0.8, -2.2],
    detail: ["Maintenance access", "Stowage deck", "Access ladder"],
  },
  {
    id: "ciws-port-fwd",
    name: "CIWS Gun System (Port Fwd)",
    category: "Weapons",
    description: "Port-side close-in weapon system - 20mm Gatling gun with active radar guidance for point defense.",
    dimensions: "Twin-barrel mount",
    variant: "radar",
    color: "#6b7280",
    position: [-3.2, 2.1, 1.8],
    rotation: [0.15, 0.2, 0],
    hitbox: [0.8, 0.9, 0.8],
    explodeOffset: [-4.2, 1.8, 2.8],
    detail: ["20mm Gatling", "Radar tracking", "360° traverse", "Rate: 3000 rpm"],
  },
  {
    id: "ciws-stbd-fwd",
    name: "CIWS Gun System (Stbd Fwd)",
    category: "Weapons",
    description: "Starboard-side CIWS - identical twin system for overlapping defensive coverage.",
    dimensions: "Twin-barrel mount",
    variant: "radar",
    color: "#6b7280",
    position: [3.0, 2.1, -1.8],
    rotation: [0.15, -0.2, 0],
    hitbox: [0.8, 0.9, 0.8],
    explodeOffset: [4.0, 1.8, -2.8],
    detail: ["20mm Gatling", "Integrated tracker", "Independent firing", "Continuous scan"],
  },
  {
    id: "dassault-rafale-m",
    name: "Dassault Rafale M",
    category: "Weapons",
    description: "Carrier-capable multirole fighter integrated from the Blender model as a separate tactical strike component.",
    dimensions: "Length 15.3m | Wingspan 10.9m",
    variant: "rafale",
    color: "#c7cdd5",
    position: [-0.6, 1.82, -0.15],
    rotation: [0, 0.22, 0],
    hitbox: [2.4, 0.9, 2.1],
    explodeOffset: [-1.8, 1.7, -3.4],
    detail: ["Blender GLB asset", "Separate fighter component", "Deck-ready strike role", "Included in assembly timeline"],
  },
  {
    id: "vhf-mast",
    name: "VHF Communication Array",
    category: "Sensors",
    description: "Very High Frequency communication and navigation antenna array mounted above flight ops.",
    dimensions: "Communication stack",
    variant: "mast",
    color: "#e5e7eb",
    position: [-1.8, 4.5, 0.3],
    rotation: [0.08, -0.15, 0],
    hitbox: [0.6, 1.4, 0.6],
    explodeOffset: [-3.2, 4.2, 0.6],
    detail: ["VHF antenna", "Fleet net", "Emergency freq", "Encrypted link"],
  },
  {
    id: "helicopter-secondary",
    name: "Backup Aircraft",
    category: "Air Wing",
    description: "Additional carrier helicopter for SAR and utility operations during flight ops surge.",
    dimensions: "Twin-engine utility helicopter",
    variant: "helicopter",
    color: "#d0d6de",
    position: [1.5, 1.82, 2.0],
    rotation: [0, -0.4, 0],
    hitbox: [1.8, 1.1, 1.8],
    explodeOffset: [2.2, 1.5, 2.8],
    detail: ["Rotors spinned", "Tie-down secured", "Engine cold", "Fuel serviced"],
  },
  {
    id: "tertiary-aircraft",
    name: "Alert Fighter",
    category: "Air Wing",
    description: "Combat-ready MiG-29K maintained on hot standby for emergency launch during flight ops.",
    dimensions: "Single-seat strike fighter",
    variant: "aircraft",
    color: "#bfc5ce",
    position: [0.2, 1.78, 1.8],
    rotation: [0, 0.25, 0],
    hitbox: [1.6, 0.6, 1.6],
    explodeOffset: [0.5, 1.3, 2.6],
    detail: ["Armed loadout", "Engines running", "Pilot ready", "Launch vector set"],
  },
  {
    id: "nav-radar-dome",
    name: "Navigation Radar Dome",
    category: "Sensors",
    description: "Surface navigation and collision avoidance radar mounted on mast apex.",
    dimensions: "Spherical radome",
    variant: "radar",
    color: "#7dd3fc",
    position: [1.2, 4.8, 0.2],
    rotation: [0.05, 0, 0],
    hitbox: [0.8, 0.8, 0.8],
    explodeOffset: [2.0, 4.6, 0.4],
    detail: ["Surface search", "Collision warn", "Charting feed", "Real-time scan"],
  },
  {
    id: "deck-crane",
    name: "Aircraft Deck Crane",
    category: "Support Equipment",
    description: "Mobile hydraulic crane for positioning and tie-down of aircraft during maintenance.",
    dimensions: "Cargo handling equipment",
    variant: "module",
    color: "#9ca3af",
    position: [-4.5, 1.1, -2.1],
    rotation: [0, 0.3, 0],
    hitbox: [1.2, 1.8, 1.0],
    explodeOffset: [-5.2, 0.7, -3.1],
    detail: ["Boom arm", "500-ton capacity", "Slew drive", "Load sensors"],
  },
  {
    id: "deck-tractor",
    name: "Hangar Tractor Unit",
    category: "Support Equipment",
    description: "Powered aircraft tractor for deck positioning and movement of fighters to/from hangar.",
    dimensions: "Deck traction vehicle",
    variant: "module",
    color: "#8b7355",
    position: [4.0, 1.0, 0.5],
    rotation: [0, -0.25, 0],
    hitbox: [1.0, 0.6, 0.8],
    explodeOffset: [4.8, 0.6, 0.8],
    detail: ["Nose towbar", "Hydraulic drive", "Remote ops", "Brake assist"],
  },
];

const blenderComponents: BlenderComponentInfo[] = [
  {
    id: "flight-deck-main",
    name: "Main Flight Deck",
    category: "Flight Operations",
    description: "Primary runway and aircraft handling surface used for launch, landing, and taxi operations.",
    dimensions: "Full deck span",
    hotspot: [0, 1.9, 0.2],
    detail: ["Landing lane", "Launch lane", "Deck markings", "Tie-down points"],
  },
  {
    id: "island-command",
    name: "Island Superstructure",
    category: "Command & Control",
    description: "Bridge, combat control, and communications section for navigation and mission coordination.",
    dimensions: "Multi-deck command block",
    hotspot: [1.7, 2.8, -0.4],
    detail: ["Bridge station", "Combat control", "Communication rooms", "Navigation consoles"],
  },
  {
    id: "sensor-mast",
    name: "Radar and Sensor Mast",
    category: "Sensors",
    description: "Sensor stack for surveillance, navigation, and long-range situational awareness.",
    dimensions: "Raised mast structure",
    hotspot: [2.1, 4.2, -0.6],
    detail: ["Search radar", "IFF systems", "Antenna arrays", "Tracking sensors"],
  },
  {
    id: "port-vls-zone",
    name: "Port Weapons Zone",
    category: "Weapons",
    description: "Forward weapons area containing defensive and strike launch systems.",
    dimensions: "Deck weapons segment",
    hotspot: [-3.2, 1.6, 1.5],
    detail: ["Missile launch area", "Defensive battery", "Fire-control feed", "Safety interlocks"],
  },
  {
    id: "hangar-bay",
    name: "Hangar Bay Access",
    category: "Aviation Support",
    description: "Internal aircraft maintenance and storage access section beneath the deck.",
    dimensions: "Hangar portal section",
    hotspot: [0.2, 1.1, -1.8],
    detail: ["Aircraft servicing", "Stores access", "Fuel line feed", "Lift interface"],
  },
  {
    id: "aft-deck",
    name: "Aft Recovery Deck",
    category: "Flight Operations",
    description: "Aft section used for aircraft recovery and staging for deck movement.",
    dimensions: "Aft deck segment",
    hotspot: [4.8, 1.7, 0.5],
    detail: ["Recovery zone", "Arrestor region", "Staging lane", "Deck crew access"],
  },
];

// Helper function to create deck marking textures
const createDeckCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // Base dark gray deck
  ctx.fillStyle = "#3f434a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Weathering and wear pattern (noisy texture)
  for (let x = 0; x < canvas.width; x += 8) {
    for (let y = 0; y < canvas.height; y += 8) {
      const shade = Math.random() > 0.85 ? 20 : 0;
      ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.3)`;
      ctx.fillRect(x, y, 8, 8);
    }
  }

  // Yellow parking spot lines
  ctx.fillStyle = "#fcd34d";
  for (let i = 0; i < 20; i++) {
    ctx.fillRect(50 + i * 100, 40, 60, 50);
    ctx.fillRect(50 + i * 100, 420, 60, 50);
  }

  // Red and yellow landing zone (rear section)
  ctx.fillStyle = "#dc2626";
  ctx.fillRect(300, 150, 250, 200);
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(320, 170, 210, 160);
  ctx.fillStyle = "#dc2626";
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(310 + i * 60, 160, 25, 180);
  }

  // Center white line (port/starboard boundary)
  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(0, 255, canvas.width, 2);

  // Port side (red) edge safety marking
  ctx.fillStyle = "#dc2626";
  ctx.fillRect(0, 240, canvas.width, 10);
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(0, 250, canvas.width, 4);

  // Catapult track markings (dashed lines along edges)
  ctx.strokeStyle = "#e11d48";
  ctx.lineWidth = 3;
  ctx.setLineDash([30, 30]);
  ctx.beginPath();
  ctx.moveTo(100, 100);
  ctx.lineTo(1900, 100);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(100, 410);
  ctx.lineTo(1900, 410);
  ctx.stroke();

  // White edge safety stripes
  ctx.strokeStyle = "#f5f5f5";
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(50, 80);
  ctx.lineTo(1950, 80);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(50, 430);
  ctx.lineTo(1950, 430);
  ctx.stroke();

  // Cross-deck aircraft tie-down points
  ctx.fillStyle = "#fef3c7";
  for (let i = 0; i < 25; i++) {
    const x = 50 + i * 80;
    ctx.fillRect(x, 200, 15, 15);
    ctx.fillRect(x, 290, 15, 15);
  }

  return canvas;
};

// Create canvas texture for hull
const createHullTexture = (): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#d7dce3";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add panel lines
  for (let i = 0; i < 10; i++) {
    ctx.strokeStyle = "#c8ced6";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, i * 25);
    ctx.lineTo(canvas.width, i * 25);
    ctx.stroke();
  }

  return canvas;
};

function RafaleModel({ progress }: { progress: number }) {
  const { scene } = useGLTF("/Untitled.glb");
  const model = useMemo(() => {
    const clone = scene.clone(true);
    let meshIndex = 0;
    clone.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const basePosition = mesh.position.clone();
        const explodeDirection = basePosition.clone();
        if (explodeDirection.lengthSq() < 0.001) {
          explodeDirection.set((meshIndex % 3) - 1, ((meshIndex + 1) % 4) - 1.5, ((meshIndex + 2) % 5) - 2);
        }
        explodeDirection.normalize();
        mesh.userData.rafaleBasePosition = basePosition;
        mesh.userData.rafaleExplodeDirection = explodeDirection;
        meshIndex += 1;
      }
    });
    return clone;
  }, [scene]);

  useFrame(() => {
    model.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        const basePosition = mesh.userData.rafaleBasePosition as THREE.Vector3 | undefined;
        const explodeDirection = mesh.userData.rafaleExplodeDirection as THREE.Vector3 | undefined;
        if (!basePosition || !explodeDirection) return;
        mesh.position.copy(basePosition).addScaledVector(explodeDirection, progress * 0.35);
      }
    });
  });

  return (
    <group position={[0, -0.05, 0]} rotation={[0, Math.PI / 2, 0]} scale={[0.42, 0.42, 0.42]}>
      <primitive object={model} />
    </group>
  );
}

function ShipPart(props: ShipPartProps) {
  const { progress, onSelect, ...shipPart } = props;
  const {
    id,
    name,
    category,
    description,
    dimensions,
    variant,
    color,
    position,
    rotation,
    scale,
    hitbox,
    explodeOffset,
    calloutOffset,
    detail,
  } = shipPart;
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const basePosition = useMemo(() => new THREE.Vector3(...position), [position]);
  const offsetPosition = useMemo(
    () => new THREE.Vector3(...explodeOffset).multiplyScalar(progress),
    [explodeOffset, progress],
  );
  const targetPosition = useMemo(() => basePosition.clone().add(offsetPosition), [basePosition, offsetPosition]);
  const targetRotation = useMemo(() => rotation ?? [0, 0, 0], [rotation]);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.lerp(targetPosition, 0.08);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotation[0], 0.08);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation[1], 0.08);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotation[2], 0.08);
    const targetScale = hovered ? 1.02 : 1;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
  });

  const deckTexture = useMemo(() => new THREE.CanvasTexture(createDeckCanvas()), []);
  const hullTexture = useMemo(() => new THREE.CanvasTexture(createHullTexture()), []);

  const renderVariant = () => {
    switch (variant) {
      case "hull": {
        // More realistic hull with curved underwater section and detailed superstructure connection
        return (
          <group>
            {/* Main hull body with realistic curvature */}
            <mesh castShadow receiveShadow position={[0, 0, 0]}>
              <boxGeometry args={[14.8, 1.4, 4.8]} />
              <meshStandardMaterial
                map={hullTexture}
                color={color}
                metalness={0.4}
                roughness={0.75}
              />
            </mesh>

            {/* Underwater hull (boot stripe) with realistic dark brown */}
            <mesh castShadow receiveShadow position={[0, -0.85, 0.1]}>
              <boxGeometry args={[14.2, 0.8, 4.2]} />
              <meshStandardMaterial color="#5a3a2a" metalness={0.2} roughness={0.9} />
            </mesh>

            {/* Port bow curve for naval architecture */}
            <mesh castShadow receiveShadow position={[-7, 0.05, -2.2]} rotation={[0, -0.3, 0.15]}>
              <coneGeometry args={[0.8, 2.8, 8]} />
              <meshStandardMaterial color={color} metalness={0.4} roughness={0.75} />
            </mesh>

            {/* Starboard bow curve */}
            <mesh castShadow receiveShadow position={[-7, 0.05, 2.2]} rotation={[0, 0.3, -0.15]}>
              <coneGeometry args={[0.8, 2.8, 8]} />
              <meshStandardMaterial color={color} metalness={0.4} roughness={0.75} />
            </mesh>

            {/* Stern bulbous section */}
            <mesh castShadow receiveShadow position={[6.8, 0.15, 0]} rotation={[0, 0, 0]}>
              <boxGeometry args={[1.2, 1.8, 4.4]} />
              <meshStandardMaterial color={color} metalness={0.42} roughness={0.72} />
            </mesh>

            {/* Port hull sponson extension */}
            <mesh castShadow receiveShadow position={[-0.5, 0.4, -2.6]} rotation={[0, 0, 0.08]}>
              <boxGeometry args={[10, 0.6, 1.2]} />
              <meshStandardMaterial color="#c8ced6" metalness={0.38} roughness={0.78} />
            </mesh>

            {/* Starboard hull sponson extension */}
            <mesh castShadow receiveShadow position={[-0.5, 0.35, 2.6]} rotation={[0, 0, -0.08]}>
              <boxGeometry args={[10, 0.6, 1.2]} />
              <meshStandardMaterial color="#c8ced6" metalness={0.38} roughness={0.78} />
            </mesh>
          </group>
        );
      }

      case "deck":
        return (
          <group>
            {/* Main flight deck slab with realistic thickness */}
            <mesh castShadow receiveShadow position={[0, 0.04, 0]}>
              <boxGeometry args={[12.8, 0.25, 4.0]} />
              <meshStandardMaterial
                map={deckTexture}
                color={color}
                metalness={0.25}
                roughness={0.92}
              />
            </mesh>

            {/* Deck weathering layer */}
            <mesh castShadow receiveShadow position={[0, 0.16, 0]}>
              <boxGeometry args={[12.5, 0.04, 3.7]} />
              <meshStandardMaterial color="#252a31" metalness={0.1} roughness={0.98} />
            </mesh>

            {/* Port white centerline marking */}
            <mesh position={[0, 0.175, 0.95]}>
              <boxGeometry args={[12.5, 0.02, 0.08]} />
              <meshStandardMaterial color="#f5f5f5" emissive="#f5f5f5" emissiveIntensity={0.1} />
            </mesh>

            {/* Starboard red centerline marking */}
            <mesh position={[0, 0.175, -0.95]}>
              <boxGeometry args={[12.5, 0.02, 0.08]} />
              <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.08} />
            </mesh>

            {/* Yellow parking line dots - port side */}
            {[...Array(8)].map((_, i) => (
              <mesh key={`port-dot-${i}`} position={[-4 + i * 1.2, 0.176, 1.2]}>
                <boxGeometry args={[0.35, 0.01, 0.35]} />
                <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.1} />
              </mesh>
            ))}

            {/* Yellow parking line dots - starboard side */}
            {[...Array(8)].map((_, i) => (
              <mesh key={`starb-dot-${i}`} position={[-4 + i * 1.2, 0.176, -1.2]}>
                <boxGeometry args={[0.35, 0.01, 0.35]} />
                <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.1} />
              </mesh>
            ))}

            {/* Red landing zone marker */}
            <mesh position={[3.5, 0.177, 0]}>
              <boxGeometry args={[2.5, 0.01, 1.2]} />
              <meshStandardMaterial color="#dc2626" emissive="#991b1b" emissiveIntensity={0.08} />
            </mesh>

            {/* Yellow marking in landing zone */}
            <mesh position={[3.5, 0.178, 0]}>
              <boxGeometry args={[2.0, 0.01, 0.8]} />
              <meshStandardMaterial color="#fcd34d" emissive="#ca8a04" emissiveIntensity={0.08} />
            </mesh>
          </group>
        );

      case "island": {
        // Much more detailed command tower with multiple levels and features
        return (
          <group>
            {/* Base block - main structure */}
            <mesh castShadow receiveShadow position={[0, 0.6, 0]} scale={[1.02, 1.0, 1.0]}>
              <boxGeometry args={[2.2, 1.3, 1.45]} />
              <meshStandardMaterial color={color} metalness={0.35} roughness={0.75} />
            </mesh>

            {/* Mid-section with windows */}
            <mesh castShadow receiveShadow position={[0.05, 1.6, -0.02]}>
              <boxGeometry args={[1.8, 1.15, 1.25]} />
              <meshStandardMaterial color="#babfc7" metalness={0.33} roughness={0.73} />
            </mesh>

            {/* Upper bridge/command section */}
            <mesh castShadow receiveShadow position={[0, 2.35, 0]}>
              <boxGeometry args={[1.3, 0.95, 1.05]} />
              <meshStandardMaterial color="#aeb5be" metalness={0.36} roughness={0.71} />
            </mesh>

            {/* Top observation deck */}
            <mesh castShadow receiveShadow position={[0.1, 3.05, 0.05]}>
              <boxGeometry args={[1.1, 0.25, 0.95]} />
              <meshStandardMaterial color="#9aa3ad" metalness={0.4} roughness={0.68} />
            </mesh>

            {/* Port side windows detail */}
            <mesh position={[-0.8, 1.0, 0.6]}>
              <boxGeometry args={[0.12, 1.0, 0.08]} />
              <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.3} />
            </mesh>

            {/* Starboard side windows detail */}
            <mesh position={[0.9, 1.0, 0.6]}>
              <boxGeometry args={[0.12, 1.0, 0.08]} />
              <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.3} />
            </mesh>

            {/* Bridge window strip */}
            <mesh position={[0, 1.2, 0.75]}>
              <boxGeometry args={[1.2, 0.4, 0.06]} />
              <meshStandardMaterial color="#38bdf8" metalness={0.6} roughness={0.25} emissive="#38bdf8" emissiveIntensity={0.05} />
            </mesh>

            {/* Emergency lighting stripe */}
            <mesh position={[0, 0.25, 0.8]}>
              <boxGeometry args={[1.3, 0.08, 0.05]} />
              <meshStandardMaterial color="#fef3c7" metalness={0.3} roughness={0.4} />
            </mesh>

            {/* Radio antenna base */}
            <mesh position={[0.6, 3.3, -0.3]} rotation={[0.1, 0, 0]}>
              <boxGeometry args={[0.08, 0.6, 0.08]} />
              <meshStandardMaterial color="#6b7280" metalness={0.55} roughness={0.4} />
            </mesh>
          </group>
        );
      }

      case "mast": {
        // Integrated mast with multiple sensor arrays
        return (
          <group>
            {/* Main mast pole */}
            <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
              <cylinderGeometry args={[0.12, 0.16, 3.2, 16]} />
              <meshStandardMaterial color={color} metalness={0.7} roughness={0.32} />
            </mesh>

            {/* Upper radar array mounting */}
            <mesh castShadow receiveShadow position={[0, 1.8, 0]}>
              <boxGeometry args={[1.0, 0.3, 0.9]} />
              <meshStandardMaterial color="#e5e7eb" metalness={0.35} roughness={0.5} />
            </mesh>

            {/* Sensor platform cross-arms */}
            <mesh position={[0.5, 1.4, 0]} rotation={[0, 0, 0.1]}>
              <boxGeometry args={[1.0, 0.08, 0.08]} />
              <meshStandardMaterial color="#9ca3af" metalness={0.55} roughness={0.4} />
            </mesh>

            <mesh position={[-0.5, 1.4, 0]} rotation={[0, 0, -0.1]}>
              <boxGeometry args={[1.0, 0.08, 0.08]} />
              <meshStandardMaterial color="#9ca3af" metalness={0.55} roughness={0.4} />
            </mesh>

            {/* VHF antenna */}
            <mesh position={[0, 2.8, 0]}>
              <boxGeometry args={[0.2, 1.2, 0.2]} />
              <meshStandardMaterial color="#111827" metalness={0.6} roughness={0.3} />
            </mesh>

            {/* NavRadar dome mounting */}
            <mesh position={[0, 1.95, 0.35]}>
              <sphereGeometry args={[0.15, 12, 12]} />
              <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.4} />
            </mesh>

            {/* Communication array */}
            <mesh position={[0.65, 1.6, 0.05]}>
              <boxGeometry args={[0.08, 0.5, 0.08]} />
              <meshStandardMaterial color="#38bdf8" metalness={0.6} roughness={0.25} />
            </mesh>

            <mesh position={[-0.65, 1.6, 0.05]}>
              <boxGeometry args={[0.08, 0.5, 0.08]} />
              <meshStandardMaterial color="#38bdf8" metalness={0.6} roughness={0.25} />
            </mesh>
          </group>
        );
      }

      case "elevator": {
        // More detailed aircraft elevator
        return (
          <group>
            {/* Elevator platform with grid detail */}
            <mesh castShadow receiveShadow position={[0, 0.04, 0]}>
              <boxGeometry args={[2.2, 0.15, 1.95]} />
              <meshStandardMaterial color={color} metalness={0.25} roughness={0.88} />
            </mesh>

            {/* Elevator surface markings */}
            <mesh position={[0, 0.1, 0]}>
              <boxGeometry args={[1.9, 0.02, 1.6]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>

            {/* Yellow safety stripes */}
            <mesh position={[0.8, 0.11, 0]}>
              <boxGeometry args={[0.15, 0.01, 1.6]} />
              <meshStandardMaterial color="#eab308" emissive="#ca8a04" emissiveIntensity={0.1} />
            </mesh>

            <mesh position={[-0.8, 0.11, 0]}>
              <boxGeometry args={[0.15, 0.01, 1.6]} />
              <meshStandardMaterial color="#eab308" emissive="#ca8a04" emissiveIntensity={0.1} />
            </mesh>

            {/* Red danger border */}
            <mesh position={[0, 0.11, 0.75]}>
              <boxGeometry args={[2.0, 0.01, 0.12]} />
              <meshStandardMaterial color="#e11d48" emissive="#be123c" emissiveIntensity={0.08} />
            </mesh>

            {/* Elevator frame */}
            <mesh position={[0, 0.02, 0.9]} rotation={[0, 0, 0]}>
              <boxGeometry args={[2.1, 0.04, 0.08]} />
              <meshStandardMaterial color="#6b7280" metalness={0.45} roughness={0.55} />
            </mesh>
          </group>
        );
      }

      case "aircraft": {
        // Much more realistic MiG-29K fighter
        return (
          <group>
            {/* Fuselage - more tapered */}
            <mesh castShadow receiveShadow rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]}>
              <boxGeometry args={[1.95, 0.18, 0.14]} />
              <meshStandardMaterial color="#c7cdd5" metalness={0.56} roughness={0.52} />
            </mesh>

            {/* Nose cone */}
            <mesh castShadow receiveShadow position={[0.85, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
              <coneGeometry args={[0.14, 0.4, 12]} />
              <meshStandardMaterial color="#0f172a" metalness={0.4} roughness={0.5} />
            </mesh>

            {/* Port wing */}
            <mesh castShadow receiveShadow position={[-0.25, 0, 0.6]} rotation={[0.05, 0.15, 0.08]}>
              <boxGeometry args={[0.95, 0.025, 0.2]} />
              <meshStandardMaterial color="#bfc5ce" metalness={0.54} roughness={0.54} />
            </mesh>

            {/* Starboard wing */}
            <mesh castShadow receiveShadow position={[-0.25, 0, -0.6]} rotation={[-0.05, -0.15, -0.08]}>
              <boxGeometry args={[0.95, 0.025, 0.2]} />
              <meshStandardMaterial color="#bfc5ce" metalness={0.54} roughness={0.54} />
            </mesh>

            {/* Cockpit canopy */}
            <mesh position={[0.1, 0.08, 0]}>
              <boxGeometry args={[0.3, 0.12, 0.1]} />
              <meshStandardMaterial color="#38bdf8" metalness={0.65} roughness={0.2} emissive="#0f172a" emissiveIntensity={0.15} />
            </mesh>

            {/* Twin vertical stabilizers */}
            <mesh castShadow receiveShadow position={[-0.7, 0.12, 0.3]} rotation={[0.1, 0, 0.2]}>
              <boxGeometry args={[0.4, 0.28, 0.06]} />
              <meshStandardMaterial color="#bfc5ce" metalness={0.52} roughness={0.56} />
            </mesh>

            <mesh castShadow receiveShadow position={[-0.7, 0.12, -0.3]} rotation={[0.1, 0, -0.2]}>
              <boxGeometry args={[0.4, 0.28, 0.06]} />
              <meshStandardMaterial color="#bfc5ce" metalness={0.52} roughness={0.56} />
            </mesh>

            {/* Landing gear - nose wheel */}
            <mesh position={[0.35, -0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, 0.08, 12]} />
              <meshStandardMaterial color="#1f2937" metalness={0.5} roughness={0.6} />
            </mesh>

            {/* NAVY marking */}
            <mesh position={[0, 0.07, 0.025]}>
              <boxGeometry args={[0.2, 0.032, 0.002]} />
              <meshStandardMaterial color="#f5f5f5" />
            </mesh>
          </group>
        );
      }

      case "rafale": {
        return <RafaleModel progress={progress} />;
      }

      case "helicopter": {
        // Improved helicopter with rotor head and more details
        return (
          <group>
            {/* Main fuselage */}
            <mesh castShadow receiveShadow position={[0, 0.12, 0]}>
              <boxGeometry args={[1.05, 0.6, 0.6]} />
              <meshStandardMaterial color={color} metalness={0.45} roughness={0.58} />
            </mesh>

            {/* Cockpit windscreen */}
            <mesh position={[0.3, 0.3, 0]}>
              <boxGeometry args={[0.35, 0.25, 0.25]} />
              <meshStandardMaterial color="#38bdf8" metalness={0.65} roughness={0.18} emissive="#0f172a" emissiveIntensity={0.2} />
            </mesh>

            {/* Engine/rotor mast */}
            <mesh castShadow receiveShadow position={[0.05, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.06, 0.08, 0.5, 12]} />
              <meshStandardMaterial color="#6b7280" metalness={0.6} roughness={0.35} />
            </mesh>

            {/* Main rotor head */}
            <mesh position={[0.05, 0.76, 0]}>
              <cylinderGeometry args={[0.12, 0.14, 0.04, 16]} />
              <meshStandardMaterial color="#374151" metalness={0.7} roughness={0.3} />
            </mesh>

            {/* Rotor blade 1 */}
            <mesh position={[0.05, 0.78, 0]} rotation={[0, 0, 0]}>
              <boxGeometry args={[1.8, 0.03, 0.12]} />
              <meshStandardMaterial color="#4b5563" metalness={0.5} roughness={0.4} />
            </mesh>

            {/* Rotor blade 2 */}
            <mesh position={[0.05, 0.78, 0]} rotation={[0, 0, Math.PI / 2]}>
              <boxGeometry args={[1.8, 0.03, 0.12]} />
              <meshStandardMaterial color="#4b5563" metalness={0.5} roughness={0.4} />
            </mesh>

            {/* Tail boom */}
            <mesh position={[-0.35, 0.08, 0]} rotation={[0, 0, 0.15]}>
              <cylinderGeometry args={[0.04, 0.06, 0.75, 8]} />
              <meshStandardMaterial color={color} metalness={0.43} roughness={0.6} />
            </mesh>

            {/* Tail rotor */}
            <mesh position={[-0.7, 0.18, 0]} rotation={[0.3, 0, 0]}>
              <boxGeometry args={[0.35, 0.02, 0.1]} />
              <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.45} />
            </mesh>

            {/* Landing gear skids */}
            <mesh position={[-0.1, -0.1, 0.25]} rotation={[0, 0, 0.2]}>
              <boxGeometry args={[1.2, 0.04, 0.04]} />
              <meshStandardMaterial color="#1f2937" metalness={0.45} roughness={0.65} />
            </mesh>

            <mesh position={[-0.1, -0.1, -0.25]} rotation={[0, 0, 0.2]}>
              <boxGeometry args={[1.2, 0.04, 0.04]} />
              <meshStandardMaterial color="#1f2937" metalness={0.45} roughness={0.65} />
            </mesh>
          </group>
        );
      }

      case "raft": {
        // Life raft pods
        return (
          <group>
            {/* Port raft cylinder */}
            <mesh castShadow receiveShadow position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.25, 0.27, 0.62, 16]} />
              <meshStandardMaterial color={color} metalness={0.2} roughness={0.88} />
            </mesh>

            {/* Starboard raft cylinder */}
            <mesh castShadow receiveShadow position={[0.4, 0.12, 0.08]}>
              <cylinderGeometry args={[0.25, 0.27, 0.62, 16]} />
              <meshStandardMaterial color={color} metalness={0.2} roughness={0.88} />
            </mesh>

            {/* Connecting frame */}
            <mesh position={[0.2, 0.32, 0.04]}>
              <boxGeometry args={[1.0, 0.06, 0.25]} />
              <meshStandardMaterial color="#9ca3af" metalness={0.35} roughness={0.65} />
            </mesh>

            {/* Launch handle */}
            <mesh position={[0.2, 0.55, 0.04]}>
              <boxGeometry args={[0.6, 0.08, 0.05]} />
              <meshStandardMaterial color="#ca8a04" metalness={0.3} roughness={0.7} />
            </mesh>
          </group>
        );
      }

      case "radar": {
        // Advanced phased-array radar
        return (
          <group>
            {/* Mounting pedestal */}
            <mesh castShadow receiveShadow position={[0, -0.12, 0]}>
              <boxGeometry args={[0.95, 0.3, 0.65]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.45} roughness={0.55} />
            </mesh>

            {/* Phased array face */}
            <mesh castShadow receiveShadow position={[0, 0.5, 0]} rotation={[0.12, 0, 0]}>
              <boxGeometry args={[1.5, 0.9, 0.15]} />
              <meshStandardMaterial
                color={color}
                metalness={0.58}
                roughness={0.42}
                emissive={color}
                emissiveIntensity={0.12}
              />
            </mesh>

            {/* Radar surface pattern - grid */}
            <mesh position={[0, 0.5, 0.085]}>
              <boxGeometry args={[1.2, 0.06, 0.06]} />
              <meshStandardMaterial color="#eff6ff" emissive="#0ea5e9" emissiveIntensity={0.15} />
            </mesh>

            {/* Scan indicator */}
            <mesh position={[0, 0.52, 0.09]}>
              <boxGeometry args={[0.4, 0.02, 0.04]} />
              <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.2} />
            </mesh>

            {/* Secondary radar antenna */}
            <mesh position={[0.8, 0.45, 0.12]}>
              <boxGeometry args={[0.3, 0.4, 0.1]} />
              <meshStandardMaterial color="#e5e7eb" metalness={0.5} roughness={0.45} />
            </mesh>
          </group>
        );
      }

      case "module": {
        // Hull shoulders, sponsons, and support modules
        return (
          <group>
            {/* Main structural block */}
            <mesh castShadow receiveShadow position={[0, 0.15, 0]}>
              <boxGeometry args={[6.8, 0.8, 1.8]} />
              <meshStandardMaterial
                map={hullTexture}
                color={color}
                metalness={0.38}
                roughness={0.76}
              />
            </mesh>

            {/* Lower detail section */}
            <mesh castShadow receiveShadow position={[0, -0.15, 0]}>
              <boxGeometry args={[6.2, 0.5, 1.5]} />
              <meshStandardMaterial color="#c0c5ce" metalness={0.32} roughness={0.8} />
            </mesh>

            {/* Upper platform */}
            <mesh castShadow receiveShadow position={[0, 0.5, -0.3]}>
              <boxGeometry args={[5.8, 0.2, 1.0]} />
              <meshStandardMaterial color="#c8ced6" metalness={0.35} roughness={0.78} />
            </mesh>

            {/* Maintenance access panels */}
            <mesh position={[-1.5, 0.2, 0.8]}>
              <boxGeometry args={[0.8, 0.4, 0.08]} />
              <meshStandardMaterial color="#9ca3af" metalness={0.3} roughness={0.7} />
            </mesh>

            <mesh position={[1.5, 0.2, 0.8]}>
              <boxGeometry args={[0.8, 0.4, 0.08]} />
              <meshStandardMaterial color="#9ca3af" metalness={0.3} roughness={0.7} />
            </mesh>

            {/* Cable trays and equipment */}
            <mesh position={[0, 0.45, -0.7]}>
              <boxGeometry args={[6.0, 0.08, 0.4]} />
              <meshStandardMaterial color="#6b7280" metalness={0.4} roughness={0.6} />
            </mesh>

            {/* Safety rail structure */}
            <mesh position={[0, 0.65, 0.85]}>
              <boxGeometry args={[6.5, 0.04, 0.08]} />
              <meshStandardMaterial color="#9ca3af" metalness={0.35} roughness={0.65} />
            </mesh>
          </group>
        );
      }

      default:
        return (
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={color} metalness={0.4} roughness={0.7} />
          </mesh>
        );
    }
  };

  return (
    <group ref={groupRef} scale={scale ?? [1, 1, 1]}>
      <mesh
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
        onClick={(event) => {
          event.stopPropagation();
          onSelect({
            id,
            name,
            category,
            description,
            dimensions,
            variant,
            color,
            position,
            rotation,
            scale,
            hitbox,
            explodeOffset,
            calloutOffset,
            detail,
          });
        }}
      >
        <boxGeometry args={hitbox} />
        <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
      </mesh>
      {renderVariant()}
      {hovered && (
        <Html distanceFactor={10} position={calloutOffset ?? [0, hitbox[1] / 2 + 0.5, 0]}>
          <div className="glass-panel px-3 py-1.5 text-center whitespace-nowrap pointer-events-none">
            <p className="text-xs font-display text-primary">{name}</p>
          </div>
        </Html>
      )}
    </group>
  );
}

function NavalShip({ progress, onSelectPart }: { progress: number; onSelectPart: (part: ShipPartConfig) => void }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.08;
  });

  return (
    <group ref={groupRef} rotation={[0, -Math.PI / 6, 0]}>
      {shipParts.map((part) => (
        <ShipPart key={part.id} {...part} progress={progress} onSelect={onSelectPart} />
      ))}
    </group>
  );
}

function BlenderCarrierModel({
  onSelectComponent,
}: {
  onSelectComponent: (component: BlenderComponentInfo) => void;
}) {
  const { scene } = useGLTF("/compo/kiev_class_aircraft_carrier.glb");

  const model = useMemo(() => {
    const clone = scene.clone(true);
    const bbox = new THREE.Box3();

    clone.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        bbox.expandByObject(mesh);

        const material = mesh.material;
        if (Array.isArray(material)) {
          material.forEach((mat: any) => {
            if (!mat) return;
            mat.metalness = Math.min(0.85, (mat.metalness ?? 0.4) + 0.15);
            mat.roughness = Math.max(0.2, (mat.roughness ?? 0.6) - 0.1);
          });
        } else if (material) {
          const mat = material as any;
          mat.metalness = Math.min(0.85, (mat.metalness ?? 0.4) + 0.15);
          mat.roughness = Math.max(0.2, (mat.roughness ?? 0.6) - 0.1);
        }
      }
    });

    const size = bbox.getSize(new THREE.Vector3());
    const center = bbox.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? 12 / maxDim : 1;

    clone.position.sub(center);
    clone.scale.setScalar(scale);
    return clone;
  }, [scene]);

  return (
    <group rotation={[0, -Math.PI / 6, 0]}>
      <primitive object={model} />
      {blenderComponents.map((component) => {
        return (
          <group key={component.id} position={component.hotspot}>
            <mesh
              onPointerOver={(event) => {
                event.stopPropagation();
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "default";
              }}
              onClick={(event) => {
                event.stopPropagation();
                onSelectComponent(component);
              }}
            >
              <sphereGeometry args={[0.14, 12, 12]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function WaterPlane() {
  return (
    <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[80, 80, 64, 64]} />
      <meshStandardMaterial color="#07131f" metalness={0.9} roughness={0.12} transparent opacity={0.55} />
    </mesh>
  );
}

useGLTF.preload("/Untitled.glb");
useGLTF.preload("/compo/kiev_class_aircraft_carrier.glb");

const StyledContainer = styled.div`
  font-family: var(--font-body);
  letter-spacing: 0.02em;
`;

const controlButtons = [
  { label: "Assemble", icon: Layers3, value: 0 },
  { label: "Detail Pass", icon: Grid3x3, value: 0.42 },
  { label: "Disassemble", icon: PackageOpen, value: 1 },
];

type PanelKey = "overview" | "controls" | "summary" | "references" | "selection";

export default function ShipExplorer() {
  const [selectedPart, setSelectedPart] = useState<ShipPartConfig | null>(null);
  const [selectedBlenderComponent, setSelectedBlenderComponent] = useState<BlenderComponentInfo | null>(null);
  const [progress, setProgress] = useState(0);
  const [referenceIndex, setReferenceIndex] = useState(0);
  const [activePanel, setActivePanel] = useState<PanelKey | null>(null);
  const [viewMode, setViewMode] = useState<"ins" | "blender">("ins");
  const [vrPromptState, setVrPromptState] = useState<"hidden" | "ask" | "ready">("hidden");
  const [generatedVrLink, setGeneratedVrLink] = useState("");
  const [lanHost, setLanHost] = useState("");

  const totals = useMemo(() => {
    return shipParts.reduce(
      (accumulator, part) => {
        accumulator[part.category] = (accumulator[part.category] ?? 0) + 1;
        return accumulator;
      },
      {} as Record<string, number>,
    );
  }, []);

  const selectedReference = referenceImages[referenceIndex % referenceImages.length];
  const selectedInfo = viewMode === "blender" ? selectedBlenderComponent : selectedPart;

  useEffect(() => {
    setSelectedPart(null);
    setSelectedBlenderComponent(null);
    setActivePanel(null);
    if (viewMode === "blender") {
      setVrPromptState("ask");
      setGeneratedVrLink("");
    } else {
      setVrPromptState("hidden");
      setGeneratedVrLink("");
    }
  }, [viewMode]);

  useEffect(() => {
    const detectLanHost = async () => {
      if (typeof window === "undefined") return;
      if (!("RTCPeerConnection" in window)) return;

      try {
        const pc = new RTCPeerConnection({ iceServers: [] });
        pc.createDataChannel("probe");
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const foundIp = await new Promise<string>((resolve) => {
          const timeout = window.setTimeout(() => resolve(""), 1200);
          pc.onicecandidate = (event) => {
            const candidate = event.candidate?.candidate;
            if (!candidate) return;
            const match = candidate.match(/(\d{1,3}(?:\.\d{1,3}){3})/);
            if (!match) return;
            const ip = match[1];
            const isPrivate =
              ip.startsWith("192.168.") ||
              ip.startsWith("10.") ||
              /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip);
            if (isPrivate) {
              window.clearTimeout(timeout);
              resolve(ip);
            }
          };
        });

        pc.close();
        if (foundIp) setLanHost(foundIp);
      } catch {
        // Ignore LAN detection failure; localhost link still works on desktop.
      }
    };

    detectLanHost();
  }, []);

  const generateVrLink = () => {
    if (typeof window === "undefined") return "/vr-viewer.html?model=ins-vikrant&stereo=1";

    const protocol = window.location.protocol;
    const host = window.location.hostname;
    const port = window.location.port;
    const resolvedHost = host === "localhost" || host === "127.0.0.1" ? (lanHost || host) : host;
    const hostWithPort = port ? `${resolvedHost}:${port}` : resolvedHost;
    return `${protocol}//${hostWithPort}/vr-viewer.html?model=ins-vikrant&stereo=1&t=${Date.now()}`;
  };

  const togglePanel = (panel: PanelKey) => {
    setActivePanel((current) => (current === panel ? null : panel));
  };

  const iconButtons: Array<{ panel: PanelKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { panel: "overview", label: "Overview", icon: Info },
    { panel: "controls", label: "Assembly", icon: SlidersHorizontal },
    { panel: "summary", label: "Summary", icon: ClipboardList },
    { panel: "references", label: "References", icon: Grid3x3 },
    { panel: "selection", label: "Part info", icon: Eye },
  ];

  return (
    <StyledContainer className="h-screen flex flex-col relative overflow-hidden pt-16">
      <div className="absolute inset-0">
        <Canvas
          shadows
          camera={{ position: [11, 7, 11], fov: 42 }}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        >
          <color attach="background" args={["#050913"]} />
          <fog attach="fog" args={["#050913", 14, 38]} />
          <ambientLight intensity={0.14} />
          <directionalLight position={[6, 10, 7]} intensity={0.9} castShadow shadow-mapSize={2048} color="#cbd5e1" />
          <pointLight position={[-7, 3, -5]} intensity={0.25} color="#38bdf8" />
          <pointLight position={[7, 2, 6]} intensity={0.2} color="#94a3b8" />
          {viewMode === "ins" ? (
            <NavalShip
              key="ins-model"
              progress={progress}
              onSelectPart={(part) => {
                setSelectedPart(part);
                setSelectedBlenderComponent(null);
                setActivePanel("selection");
              }}
            />
          ) : (
            <BlenderCarrierModel
              key="blender-model"
              onSelectComponent={(component) => {
                setSelectedBlenderComponent(component);
                setSelectedPart(null);
                setActivePanel("selection");
              }}
            />
          )}
          <WaterPlane />
          <OrbitControls
            enablePan
            enableZoom
            enableRotate
            minDistance={4}
            maxDistance={28}
            maxPolarAngle={Math.PI / 2 + 0.1}
            autoRotate={!selectedInfo}
            autoRotateSpeed={0.28}
          />
          <Environment preset="night" />
        </Canvas>
      </div>

      <div className="absolute top-20 left-4 z-20 flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={() => {
            setViewMode((current) => (current === "ins" ? "blender" : "ins"));
          }}
          className={`glass-panel w-10 h-10 flex items-center justify-center transition-colors ${
            viewMode === "blender" ? "text-primary border-primary/60" : "text-foreground hover:text-primary"
          }`}
          title="Toggle Blender 3D view"
          aria-label="Toggle Blender 3D view"
        >
          <Cuboid className="w-4 h-4" />
        </button>
        {iconButtons.map((item) => (
          <button
            key={item.panel}
            onClick={() => togglePanel(item.panel)}
            className={`glass-panel w-10 h-10 flex items-center justify-center transition-colors ${
              activePanel === item.panel ? "text-primary border-primary/60" : "text-foreground hover:text-primary"
            } ${item.panel === "selection" && !selectedInfo ? "opacity-50" : ""}`}
            disabled={item.panel === "selection" && !selectedInfo}
            title={item.label}
            aria-label={item.label}
          >
            <item.icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {activePanel === "overview" && (
          <motion.div
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -24, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute left-16 top-20 z-20 w-[24rem] max-w-[calc(100vw-5rem)] glass-panel-highlight p-4 hud-corner pointer-events-auto"
          >
            <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground uppercase tracking-[0.24em] mb-2">
              <Ship className="w-3.5 h-3.5" />
              INS Vikrant detailing workspace
            </div>
            <h1 className="font-display text-lg sm:text-xl font-bold text-foreground tracking-wide">
              Assembly and disassembly study
            </h1>
            <p className="text-xs sm:text-sm text-secondary-foreground mt-2 leading-relaxed">
              {viewMode === "ins"
                ? "Part-based carrier model with staged separation, selectable modules, and image references from public/ins."
                : "Blender GLB carrier mode. Click highlighted hotspots to inspect each major subsystem with detailed panel info."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activePanel === "controls" && (
          <motion.div
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -24, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute left-16 bottom-[4.5rem] z-20 w-[22rem] max-w-[calc(100vw-5rem)] glass-panel-highlight p-4 pointer-events-auto"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.22em]">Assembly controls</p>
              <button
                onClick={() => {
                  setProgress(0);
                  setSelectedPart(null);
                  setSelectedBlenderComponent(null);
                  setActivePanel(null);
                }}
                className="glass-panel px-2 py-1 flex items-center gap-1 text-xs text-foreground hover:text-primary"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {controlButtons.map((button) => (
                <button
                  key={button.label}
                  onClick={() => setProgress(button.value)}
                  className={`glass-panel px-3 py-2 flex items-center gap-2 text-xs font-body font-medium transition-colors ${
                    Math.abs(progress - button.value) < 0.02 ? "text-primary" : "text-foreground hover:text-primary"
                  }`}
                >
                  <button.icon className="w-3.5 h-3.5" />
                  {button.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setProgress((value) => Math.min(1, value + 0.1))}
                className="glass-panel px-3 py-2 flex items-center gap-2 text-xs font-body font-medium text-foreground hover:text-primary transition-colors"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                More open
              </button>
              <button
                onClick={() => setProgress((value) => Math.max(0, value - 0.1))}
                className="glass-panel px-3 py-2 flex items-center gap-2 text-xs font-body font-medium text-foreground hover:text-primary transition-colors"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                More closed
              </button>
            </div>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={progress}
              onChange={(event) => setProgress(Number(event.target.value))}
              className="w-full accent-primary"
            />
            <div className="mt-2 text-[10px] font-mono text-muted-foreground flex items-center justify-between">
              <span>ASSEMBLED</span>
              <span>{Math.round(progress * 100)}% OPEN</span>
              <span>DISASSEMBLED</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedInfo && activePanel === "selection" && (
          <motion.div
            initial={{ x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute right-4 top-28 z-20 w-[22rem] max-w-[calc(100vw-2rem)] glass-panel-highlight p-5"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="font-display text-sm font-bold text-foreground tracking-wide">
                  {selectedInfo.name}
                </h3>
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mt-1">
                  {selectedInfo.category}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedPart(null);
                  setSelectedBlenderComponent(null);
                  setActivePanel(null);
                }}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-primary/40 via-primary/10 to-transparent mb-3" />

            <p className="text-sm font-body text-secondary-foreground leading-relaxed">
              {selectedInfo.description}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="glass-panel p-2 text-center">
                <p className="text-[10px] font-mono text-muted-foreground">DIMENSIONS</p>
                <p className="text-xs font-display text-accent">{selectedInfo.dimensions}</p>
              </div>
              <div className="glass-panel p-2 text-center">
                <p className="text-[10px] font-mono text-muted-foreground">VIEW MODE</p>
                <p className="text-xs font-display text-accent">{viewMode === "ins" ? `${Math.round(progress * 100)}% OPEN` : "BLENDER 3D"}</p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2 text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em]">
                <Ruler className="w-3.5 h-3.5" />
                Detail notes
              </div>
              <div className="space-y-2">
                {selectedInfo.detail.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-secondary-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/80" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activePanel === "summary" && (
          <motion.div
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -24, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute left-16 top-24 z-20 w-[16rem] glass-panel-highlight p-4 pointer-events-auto"
          >
            <div className="flex items-center gap-2 mb-3 text-[10px] font-mono text-muted-foreground uppercase tracking-[0.22em]">
              <Eye className="w-3.5 h-3.5" />
              Model summary
            </div>
            <div className="space-y-2 text-xs text-secondary-foreground">
              <div className="flex justify-between gap-2">
                <span>Parts mapped</span>
                <span className="text-foreground">{shipParts.length}</span>
              </div>
              {Object.entries(totals).map(([category, count]) => (
                <div key={category} className="flex justify-between gap-2">
                  <span>{category}</span>
                  <span className="text-foreground">{count}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activePanel === "references" && (
          <motion.div
            initial={{ x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 24, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute right-4 bottom-[4.5rem] z-20 w-[24rem] max-w-[calc(100vw-2rem)] glass-panel-highlight p-4 pointer-events-auto"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground uppercase tracking-[0.22em]">
                <Grid3x3 className="w-3.5 h-3.5" />
                Reference images
              </div>
              <button
                onClick={() => setReferenceIndex((value) => (value + 1) % referenceImages.length)}
                className="text-[10px] font-mono text-primary hover:text-foreground transition-colors"
              >
                Next reference
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {referenceImages.map((image, index) => (
                <button
                  key={image.file}
                  onClick={() => setReferenceIndex(index)}
                  className={`shrink-0 w-24 rounded-md overflow-hidden border transition-all ${
                    index === referenceIndex ? "border-primary shadow-[0_0_0_1px_rgba(59,130,246,0.35)]" : "border-border/40 opacity-75 hover:opacity-100"
                  }`}
                >
                  <img
                    src={`/ins/${encodeURIComponent(image.file)}`}
                    alt={image.label}
                    loading="lazy"
                    className="h-16 w-full object-cover bg-black/20"
                  />
                  <div className="px-2 py-1 text-[9px] leading-tight text-secondary-foreground bg-background/70 text-left">
                    {image.label}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-3 glass-panel p-3">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em]">Current reference</p>
              <p className="text-xs text-foreground mt-1">{selectedReference.label}</p>
              <p className="text-[11px] text-secondary-foreground mt-1">
                Match the exact hull, island, deck marking, and module positions from this image against the blueprint you will share.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewMode === "blender" && vrPromptState !== "hidden" && (
          <motion.div
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 18, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute left-1/2 -translate-x-1/2 bottom-[4.6rem] z-20 w-[34rem] max-w-[calc(100vw-2rem)] glass-panel-highlight p-4 pointer-events-auto"
          >
            {vrPromptState === "ask" ? (
              <div>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.22em] mb-2">Blender model loaded</p>
                <h3 className="font-display text-sm sm:text-base font-semibold text-foreground">View INS Vikrant in VR mode?</h3>
                <p className="text-xs text-secondary-foreground mt-1">
                  Open a Sketchfab-style VR viewer link with stereoscopic preview and Enter VR support.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const link = generateVrLink();
                      setGeneratedVrLink(link);
                      setVrPromptState("ready");
                    }}
                    className="glass-panel px-3 py-2 text-xs font-medium text-primary hover:text-foreground transition-colors"
                  >
                    Yes, generate VR link
                  </button>
                  <button
                    onClick={() => setVrPromptState("hidden")}
                    className="glass-panel px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Not now
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.22em] mb-2">VR link generated</p>
                <h3 className="font-display text-sm sm:text-base font-semibold text-foreground">INS Vikrant VR viewer is ready</h3>
                <div className="mt-2 glass-panel p-2 flex items-center gap-2 text-xs text-secondary-foreground break-all">
                  <LinkIcon className="w-3.5 h-3.5 shrink-0 text-primary" />
                  <span>{generatedVrLink}</span>
                </div>
                {!lanHost && (generatedVrLink.includes("localhost") || generatedVrLink.includes("127.0.0.1")) && (
                  <p className="mt-2 text-[11px] text-amber-300">
                    For phone access, open this from same Wi-Fi using your PC IP instead of localhost.
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={generatedVrLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-panel px-3 py-2 text-xs font-medium text-primary hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                  >
                    Open VR view
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => setVrPromptState("hidden")}
                    className="glass-panel px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 flex items-center justify-between bg-background/60 backdrop-blur-sm border-t border-border/20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="status-dot-active" />
            <span className="text-[10px] font-mono text-muted-foreground">
              {viewMode === "ins" ? "INS VIKRANT MODE" : "BLENDER MODEL MODE"}
            </span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">
            STATE: {viewMode === "ins" ? `${Math.round(progress * 100)}% OPEN` : "HOTSPOT INSPECTION"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
          <span>DRAG ROTATE</span>
          <span>•</span>
          <span>SCROLL ZOOM</span>
          <span>•</span>
          <span>CLICK PARTS</span>
        </div>
      </div>
    </StyledContainer>
  );
}
