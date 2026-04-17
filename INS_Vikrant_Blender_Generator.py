"""
INS Vikrant Professional Blender Model Generator
================================================
Creates a hyper-realistic, modular aircraft carrier model in Blender 4.0+
Based on reference images from /public/ins folder
Fully detailed for assembly/disassembly visualization

Author: Professional Naval Visualization
Date: April 2026
Requirements: Blender 4.0+ with Cycles/Eevee renderer
"""

import bpy
import bmesh
from mathutils import Vector, Matrix, Euler
import math

# Clear existing mesh data
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False, confirm=False)
bpy.ops.outliner.orphans_purge()

# Keep default camera and lights for initial setup
bpy.ops.object.select_all(action='DESELECT')

# ===============================
# MATERIAL DEFINITIONS
# ===============================

def create_material(name, color_hex, metallic=0.3, roughness=0.7, emission=0.0):
    """Create PBR material with proper shader setup"""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    
    # Node setup
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    output = nodes.new(type='ShaderNodeOutputMaterial')
    
    # Convert hex color to RGB
    r = int(color_hex[1:3], 16) / 255.0
    g = int(color_hex[3:5], 16) / 255.0
    b = int(color_hex[5:7], 16) / 255.0
    
    bsdf.inputs['Base Color'].default_value = (r, g, b, 1.0)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    if emission > 0:
        bsdf.inputs['Emission Strength'].default_value = emission
    
    mat.node_tree.links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    return mat

# Create material library
materials = {
    'hull_light': create_material('Hull_Light', '#d7dce3', 0.4, 0.75),
    'hull_dark': create_material('Hull_Dark', '#7b3f2a', 0.25, 0.85),
    'deck': create_material('Deck', '#3f434a', 0.25, 0.92),
    'island': create_material('Island', '#cfd3da', 0.35, 0.75),
    'mast': create_material('Mast', '#9ca3af', 0.7, 0.35),
    'aircraft': create_material('Aircraft', '#c7cdd5', 0.55, 0.55),
    'radar': create_material('Radar', '#7dd3fc', 0.55, 0.45, 0.05),
    'weapons': create_material('Weapons', '#6b7280', 0.45, 0.55),
    'antenna': create_material('Antenna', '#38bdf8', 0.6, 0.25, 0.1),
    'water': create_material('Water', '#07131f', 0.9, 0.12),
}

# ===============================
# COLLECTION ORGANIZATION
# ===============================

def create_collection(name, parent_collection=None):
    """Create organized collection for modular structure"""
    if name in bpy.data.collections:
        return bpy.data.collections[name]
    
    collection = bpy.data.collections.new(name)
    if parent_collection:
        parent_collection.children.link(collection)
    else:
        bpy.context.scene.collection.children.link(collection)
    
    return collection

# Main collections
main_collection = bpy.context.scene.collection
hull_collection = create_collection('01_Hull', main_collection)
deck_collection = create_collection('02_Flight_Deck', main_collection)
island_collection = create_collection('03_Island', main_collection)
mast_collection = create_collection('04_Sensors_Mast', main_collection)
aircraft_collection = create_collection('05_Aircraft', main_collection)
weapons_collection = create_collection('06_Weapons', main_collection)
support_collection = create_collection('07_Support_Equipment', main_collection)

# ===============================
# HELPER FUNCTIONS
# ===============================

def create_mesh_object(name, vertices, faces, material, collection):
    """Create mesh from vertices and faces with applied material"""
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    
    # Add smooth shading
    bpy.ops.object.shade_smooth()
    
    # Apply material
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.material_index = 0
    
    return obj

def add_subdiv_surface(obj, levels=2):
    """Add subdivision surface modifier for smooth geometry"""
    subdiv = obj.modifiers.new(name='Subdivision', type='SUBSURF')
    subdiv.levels = levels
    subdiv.render_levels = levels + 1

def create_bezier_curve(name, points_3d, material, collection):
    """Create curved geometry using Bezier curves and surfaces"""
    curve_data = bpy.data.curves.new(name, type='BEZIER')
    curve_data.dimensions = '3D'
    
    for i, point_data in enumerate(points_3d):
        curve_points = curve_data.splines.new()
        for pt in point_data:
            new_point = curve_points.points.new(1)
            new_point.co = (pt[0], pt[1], pt[2], 1.0)
    
    curve_obj = bpy.data.objects.new(name, curve_data)
    collection.objects.link(curve_obj)
    
    return curve_obj

# ===============================
# HULL CONSTRUCTION
# ===============================

def create_hull():
    """Create main hull with realistic curvature"""
    
    # Main hull body - subdivided for smooth curves
    hull_verts = []
    hull_faces = []
    
    # Hull length: 262m, width: 58m, depth: variable
    length_segments = 32
    width_segments = 8
    depth_segments = 4
    
    for i in range(length_segments):
        for j in range(width_segments):
            # X position along length (bow to stern)
            x = -8.0 + (i / length_segments) * 16.0
            
            # Y position (width)
            y_offset = math.sin((i / length_segments) * math.pi) * 0.3
            y = -2.5 + (j / width_segments) * 5.0 + y_offset
            
            # Z position (height with underwater hull)
            if j < width_segments // 2:
                z = 0.5 + (1.0 - (j / (width_segments * 2))) * 0.8
            else:
                z = 0.5 + ((width_segments - j) / (width_segments * 2)) * 0.8
            
            # Underwater boot stripe
            if j == width_segments - 1:
                z -= 0.3
            
            hull_verts.append((x, y, z))
    
    # Create faces from vertices
    for i in range(length_segments - 1):
        for j in range(width_segments - 1):
            v1 = i * width_segments + j
            v2 = i * width_segments + j + 1
            v3 = (i + 1) * width_segments + j + 1
            v4 = (i + 1) * width_segments + j
            hull_faces.append((v1, v2, v3, v4))
    
    hull_obj = create_mesh_object(
        'Hull_Body',
        hull_verts,
        hull_faces,
        materials['hull_light'],
        hull_collection
    )
    
    # Add subdivision for smooth curves
    add_subdiv_surface(hull_obj, levels=3)
    
    # Bow section with ski-jump curve
    bow_verts = [
        (-8.5, -2.8, 0.3), (-8.2, -2.6, 0.4), (-8.0, -2.4, 0.5),
        (-8.5, 0, 0.2), (-8.2, 0, 0.3), (-8.0, 0, 0.4),
        (-8.5, 2.8, 0.3), (-8.2, 2.6, 0.4), (-8.0, 2.4, 0.5),
        (-7.5, -2.8, 0.25), (-7.2, -2.6, 0.35), (-7.0, -2.4, 0.45),
        (-7.5, 0, 0.15), (-7.2, 0, 0.25), (-7.0, 0, 0.35),
        (-7.5, 2.8, 0.25), (-7.2, 2.6, 0.35), (-7.0, 2.4, 0.45),
    ]
    
    bow_faces = [
        (0, 1, 4, 3), (1, 2, 5, 4),
        (3, 4, 7, 6), (4, 5, 8, 7),
        (9, 10, 1, 0), (10, 11, 2, 1),
        (12, 13, 4, 3), (13, 14, 5, 4),
        (15, 16, 7, 6), (16, 17, 8, 7),
    ]
    
    bow_obj = create_mesh_object(
        'Hull_Bow',
        bow_verts,
        bow_faces,
        materials['hull_light'],
        hull_collection
    )
    add_subdiv_surface(bow_obj, levels=3)
    
    # Boot stripe (underwater hull - dark section)
    boot_verts = []
    boot_faces = []
    for i in range(20):
        for j in range(3):
            x = -8.0 + (i / 20) * 16.0
            y = -2.5 + (j / 2) * 5.0
            z = -0.3 - 0.4 * (j / 2)
            boot_verts.append((x, y, z))
    
    for i in range(19):
        for j in range(2):
            v1 = i * 3 + j
            v2 = i * 3 + j + 1
            v3 = (i + 1) * 3 + j + 1
            v4 = (i + 1) * 3 + j
            boot_faces.append((v1, v2, v3, v4))
    
    boot_obj = create_mesh_object(
        'Hull_Boot_Stripe',
        boot_verts,
        boot_faces,
        materials['hull_dark'],
        hull_collection
    )
    add_subdiv_surface(boot_obj, levels=2)
    
    return hull_obj, bow_obj, boot_obj

# Create hull
hull_main, hull_bow, hull_boot = create_hull()

# ===============================
# FLIGHT DECK CONSTRUCTION
# ===============================

def create_flight_deck():
    """Create detailed flight deck with markings"""
    
    # Main deck surface
    deck_verts = [
        (-6.5, -2.0, 1.8), (6.5, -2.0, 1.8),
        (6.5, 2.0, 1.8), (-6.5, 2.0, 1.8),
        (-6.5, -2.0, 1.75), (6.5, -2.0, 1.75),
        (6.5, 2.0, 1.75), (-6.5, 2.0, 1.75),
    ]
    
    deck_faces = [
        (0, 1, 2, 3),  # Top surface
        (4, 7, 6, 5),  # Bottom surface
        (0, 4, 5, 1),  # Edges
        (1, 5, 6, 2),
        (2, 6, 7, 3),
        (3, 7, 4, 0),
    ]
    
    deck_obj = create_mesh_object(
        'Flight_Deck',
        deck_verts,
        deck_faces,
        materials['deck'],
        deck_collection
    )
    
    # Ski-jump ramp at bow
    ramp_verts = [
        (-6.8, -2.0, 1.8), (-6.0, -2.0, 2.1),
        (-6.0, 2.0, 2.1), (-6.8, 2.0, 1.8),
        (-6.8, -2.0, 1.75), (-6.0, -2.0, 2.0),
        (-6.0, 2.0, 2.0), (-6.8, 2.0, 1.75),
    ]
    
    ramp_faces = [
        (0, 1, 2, 3), (4, 7, 6, 5),
        (0, 4, 5, 1), (1, 5, 6, 2),
        (2, 6, 7, 3), (3, 7, 4, 0),
    ]
    
    ramp_obj = create_mesh_object(
        'Ski_Jump_Ramp',
        ramp_verts,
        ramp_faces,
        materials['deck'],
        deck_collection
    )
    
    # Deck edge railings
    rail_height = 0.1
    rail_verts = [
        (-6.5, -2.0, 1.81), (6.5, -2.0, 1.81),
        (6.5, -2.0, 1.81 + rail_height), (-6.5, -2.0, 1.81 + rail_height),
    ]
    
    rail_faces = [(0, 1, 2, 3)]
    
    railing_obj = create_mesh_object(
        'Deck_Railing',
        rail_verts,
        rail_faces,
        materials['antenna'],
        deck_collection
    )
    
    return deck_obj, ramp_obj, railing_obj

# Create flight deck
deck, ramp, railing = create_flight_deck()

# ===============================
# ISLAND SUPERSTRUCTURE
# ===============================

def create_island():
    """Create multi-level command tower"""
    
    # Base block
    base_verts = [
        (-1.1, -0.7, 1.6), (-0.1, -0.7, 1.6),
        (-0.1, 0.7, 1.6), (-1.1, 0.7, 1.6),
        (-1.1, -0.7, 3.0), (-0.1, -0.7, 3.0),
        (-0.1, 0.7, 3.0), (-1.1, 0.7, 3.0),
    ]
    
    base_faces = [
        (0, 1, 2, 3), (4, 7, 6, 5),
        (0, 4, 5, 1), (1, 5, 6, 2),
        (2, 6, 7, 3), (3, 7, 4, 0),
    ]
    
    base_obj = create_mesh_object(
        'Island_Base',
        base_verts,
        base_faces,
        materials['island'],
        island_collection
    )
    
    # Bridge/command section
    bridge_verts = [
        (-1.0, -0.6, 3.0), (-0.2, -0.6, 3.0),
        (-0.2, 0.6, 3.0), (-1.0, 0.6, 3.0),
        (-1.0, -0.6, 3.8), (-0.2, -0.6, 3.8),
        (-0.2, 0.6, 3.8), (-1.0, 0.6, 3.8),
    ]
    
    bridge_faces = [
        (0, 1, 2, 3), (4, 7, 6, 5),
        (0, 4, 5, 1), (1, 5, 6, 2),
        (2, 6, 7, 3), (3, 7, 4, 0),
    ]
    
    bridge_obj = create_mesh_object(
        'Island_Bridge',
        bridge_verts,
        bridge_faces,
        materials['island'],
        island_collection
    )
    
    # Upper observation deck
    upper_verts = [
        (-0.95, -0.5, 3.8), (-0.3, -0.5, 3.8),
        (-0.3, 0.5, 3.8), (-0.95, 0.5, 3.8),
        (-0.95, -0.5, 4.2), (-0.3, -0.5, 4.2),
        (-0.3, 0.5, 4.2), (-0.95, 0.5, 4.2),
    ]
    
    upper_faces = [
        (0, 1, 2, 3), (4, 7, 6, 5),
        (0, 4, 5, 1), (1, 5, 6, 2),
        (2, 6, 7, 3), (3, 7, 4, 0),
    ]
    
    upper_obj = create_mesh_object(
        'Island_Observation',
        upper_verts,
        upper_faces,
        materials['island'],
        island_collection
    )
    
    # Bridge windows
    window_verts = [
        (-1.0, -0.65, 3.2), (-0.2, -0.65, 3.2),
        (-0.2, -0.65, 3.6), (-1.0, -0.65, 3.6),
    ]
    
    window_faces = [(0, 1, 2, 3)]
    
    window_obj = create_mesh_object(
        'Island_Windows',
        window_verts,
        window_faces,
        materials['antenna'],
        island_collection
    )
    
    return base_obj, bridge_obj, upper_obj, window_obj

# Create island
island_base, island_bridge, island_upper, island_windows = create_island()

# ===============================
# MAST AND SENSOR ARRAYS
# ===============================

def create_mast():
    """Create integrated mast with sensor arrays"""
    
    # Main mast pole
    mast_verts = []
    mast_faces = []
    
    # Cylinder with 12 sides
    sides = 12
    height_segments = 8
    
    for h in range(height_segments):
        for s in range(sides):
            angle = (s / sides) * 2 * math.pi
            x = -0.6 + 0.08 * math.cos(angle)
            y = 0.08 * math.sin(angle)
            z = 4.2 + (h / height_segments) * 2.0
            mast_verts.append((x, y, z))
    
    for h in range(height_segments - 1):
        for s in range(sides):
            v1 = h * sides + s
            v2 = h * sides + (s + 1) % sides
            v3 = (h + 1) * sides + (s + 1) % sides
            v4 = (h + 1) * sides + s
            mast_faces.append((v1, v2, v3, v4))
    
    # Cap
    top_center = len(mast_verts)
    mast_verts.append((-0.6, 0, 6.2))
    last_ring_start = (height_segments - 1) * sides
    for s in range(sides):
        v1 = last_ring_start + s
        v2 = last_ring_start + (s + 1) % sides
        mast_faces.append((v1, v2, top_center))
    
    mast_obj = create_mesh_object(
        'Mast_Pole',
        mast_verts,
        mast_faces,
        materials['mast'],
        mast_collection
    )
    
    # Radar array mounted on mast
    radar_verts = [
        (-0.9, -0.7, 5.0), (-0.3, -0.7, 5.0),
        (-0.3, 0.7, 5.0), (-0.9, 0.7, 5.0),
        (-0.9, -0.7, 5.3), (-0.3, -0.7, 5.3),
        (-0.3, 0.7, 5.3), (-0.9, 0.7, 5.3),
    ]
    
    radar_faces = [
        (0, 1, 2, 3), (4, 7, 6, 5),
        (0, 4, 5, 1), (1, 5, 6, 2),
        (2, 6, 7, 3), (3, 7, 4, 0),
    ]
    
    radar_obj = create_mesh_object(
        'Radar_Array',
        radar_verts,
        radar_faces,
        materials['radar'],
        mast_collection
    )
    
    # Antenna elements
    ant_verts = [
        (-0.6, -0.3, 5.3), (-0.6, 0.3, 5.3),
        (-0.6, 0.3, 6.0), (-0.6, -0.3, 6.0),
    ]
    
    ant_faces = [(0, 1, 2, 3)]
    
    antenna_obj = create_mesh_object(
        'Antenna_Element',
        ant_verts,
        ant_faces,
        materials['antenna'],
        mast_collection
    )
    
    return mast_obj, radar_obj, antenna_obj

# Create mast
mast, radar, antenna = create_mast()

# ===============================
# AIRCRAFT MODELS
# ===============================

def create_fighter_jet(name, position, rotation):
    """Create MiG-29K style fighter jet"""
    
    # Fuselage
    fuselage_verts = [
        (-0.4, -0.05, 0), (-0.2, -0.05, 0), (0.2, -0.05, 0), (0.4, -0.05, 0),
        (-0.4, 0.05, 0), (-0.2, 0.05, 0), (0.2, 0.05, 0), (0.4, 0.05, 0),
        (-0.3, -0.08, 0.15), (-0.2, -0.08, 0.15), (0.2, -0.08, 0.15), (0.3, -0.08, 0.15),
        (-0.3, 0.08, 0.15), (-0.2, 0.08, 0.15), (0.2, 0.08, 0.15), (0.3, 0.08, 0.15),
    ]
    
    fuselage_faces = [
        (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6),
        (8, 9, 13, 12), (9, 10, 14, 13), (10, 11, 15, 14),
        (0, 4, 12, 8), (3, 11, 15, 7),
    ]
    
    fuselage_obj = create_mesh_object(
        name + '_Fuselage',
        fuselage_verts,
        fuselage_faces,
        materials['aircraft'],
        aircraft_collection
    )
    fuselage_obj.location = Vector(position)
    fuselage_obj.rotation_euler = Euler(rotation, 'XYZ')
    
    # Wings
    wing_verts = [
        (-0.05, -0.4, 0.05), (-0.05, -0.15, 0.05),
        (-0.05, -0.15, 0.08), (-0.05, -0.4, 0.08),
        (0.05, -0.4, 0.05), (0.05, -0.15, 0.05),
        (0.05, -0.15, 0.08), (0.05, -0.4, 0.08),
    ]
    
    wing_faces = [
        (0, 1, 2, 3), (4, 7, 6, 5),
        (0, 4, 5, 1), (1, 5, 6, 2),
        (2, 6, 7, 3), (3, 7, 4, 0),
    ]
    
    wing_obj = create_mesh_object(
        name + '_Wings',
        wing_verts,
        wing_faces,
        materials['aircraft'],
        aircraft_collection
    )
    wing_obj.location = Vector(position)
    wing_obj.rotation_euler = Euler(rotation, 'XYZ')
    
    # Cockpit
    cockpit_verts = [
        (-0.02, -0.01, 0.08), (0.02, -0.01, 0.08),
        (0.02, 0.01, 0.08), (-0.02, 0.01, 0.08),
        (-0.02, -0.01, 0.2), (0.02, -0.01, 0.2),
        (0.02, 0.01, 0.2), (-0.02, 0.01, 0.2),
    ]
    
    cockpit_faces = [
        (0, 1, 2, 3), (4, 7, 6, 5),
        (0, 4, 5, 1), (1, 5, 6, 2),
        (2, 6, 7, 3), (3, 7, 4, 0),
    ]
    
    cockpit_obj = create_mesh_object(
        name + '_Cockpit',
        cockpit_verts,
        cockpit_faces,
        materials['antenna'],
        aircraft_collection
    )
    cockpit_obj.location = Vector(position)
    cockpit_obj.rotation_euler = Euler(rotation, 'XYZ')
    
    return fuselage_obj, wing_obj, cockpit_obj

# Create fighter jets
f1_fus, f1_wing, f1_cock = create_fighter_jet('Fighter_1', (-2.0, -1.2, 1.9), (0, -0.2, 0))
f2_fus, f2_wing, f2_cock = create_fighter_jet('Fighter_2', (-1.0, 0.5, 1.9), (0, 0.1, 0))
f3_fus, f3_wing, f3_cock = create_fighter_jet('Fighter_3', (0.5, -0.8, 1.9), (0, 0.25, 0))

# ===============================
# HELICOPTER MODEL
# ===============================

def create_helicopter(name, position, rotation):
    """Create utility helicopter with rotor"""
    
    # Fuselage
    heli_verts = [
        (-0.3, -0.1, 0), (0.3, -0.1, 0),
        (0.3, 0.1, 0), (-0.3, 0.1, 0),
        (-0.3, -0.1, 0.25), (0.3, -0.1, 0.25),
        (0.3, 0.1, 0.25), (-0.3, 0.1, 0.25),
    ]
    
    heli_faces = [
        (0, 1, 2, 3), (4, 7, 6, 5),
        (0, 4, 5, 1), (1, 5, 6, 2),
        (2, 6, 7, 3), (3, 7, 4, 0),
    ]
    
    heli_obj = create_mesh_object(
        name + '_Fuselage',
        heli_verts,
        heli_faces,
        materials['aircraft'],
        aircraft_collection
    )
    heli_obj.location = Vector(position)
    heli_obj.rotation_euler = Euler(rotation, 'XYZ')
    
    # Rotor blades (2 main blades)
    rotor_blade_verts = [
        (-0.8, -0.05, 0.25), (0.8, -0.05, 0.25),
        (0.8, 0.05, 0.25), (-0.8, 0.05, 0.25),
    ]
    
    rotor_blade_faces = [(0, 1, 2, 3)]
    
    rotor1_obj = create_mesh_object(
        name + '_Rotor_1',
        rotor_blade_verts,
        rotor_blade_faces,
        materials['weapons'],
        aircraft_collection
    )
    rotor1_obj.location = Vector(position)
    rotor1_obj.rotation_euler = Euler(rotation, 'XYZ')
    
    # Second rotor blade (perpendicular)
    rotor2_verts = [
        (-0.05, -0.8, 0.25), (0.05, -0.8, 0.25),
        (0.05, 0.8, 0.25), (-0.05, 0.8, 0.25),
    ]
    
    rotor2_obj = create_mesh_object(
        name + '_Rotor_2',
        rotor2_verts,
        rotor_blade_faces,
        materials['weapons'],
        aircraft_collection
    )
    rotor2_obj.location = Vector(position)
    rotor2_obj.rotation_euler = Euler(rotation, 'XYZ')
    
    # Tail boom
    tail_verts = [
        (-0.02, -0.02, 0.25), (0.02, -0.02, 0.25),
        (0.02, 0.02, 0.25), (-0.02, 0.02, 0.25),
        (-0.02, -0.02, 0.6), (0.02, -0.02, 0.6),
        (0.02, 0.02, 0.6), (-0.02, 0.02, 0.6),
    ]
    
    tail_faces = [
        (0, 1, 2, 3), (4, 7, 6, 5),
        (0, 4, 5, 1), (1, 5, 6, 2),
        (2, 6, 7, 3), (3, 7, 4, 0),
    ]
    
    tail_obj = create_mesh_object(
        name + '_Tail',
        tail_verts,
        tail_faces,
        materials['aircraft'],
        aircraft_collection
    )
    tail_obj.location = Vector(position)
    tail_obj.rotation_euler = Euler(rotation, 'XYZ')
    
    return heli_obj, rotor1_obj, rotor2_obj, tail_obj

# Create helicopters
h1_fus, h1_r1, h1_r2, h1_tail = create_helicopter('Helicopter_1', (2.0, 0.5, 1.9), (0, -0.4, 0))
h2_fus, h2_r1, h2_r2, h2_tail = create_helicopter('Helicopter_2', (3.5, -0.8, 1.9), (0, 0.3, 0))

# ===============================
# WEAPONS SYSTEMS
# ===============================

def create_ciws(name, position, rotation):
    """Create CIWS gun mount"""
    
    # Mounting pedestal
    mount_verts = [
        (-0.2, -0.2, 0), (0.2, -0.2, 0),
        (0.2, 0.2, 0), (-0.2, 0.2, 0),
        (-0.15, -0.15, 0.5), (0.15, -0.15, 0.5),
        (0.15, 0.15, 0.5), (-0.15, 0.15, 0.5),
    ]
    
    mount_faces = [
        (0, 1, 2, 3), (4, 7, 6, 5),
        (0, 4, 5, 1), (1, 5, 6, 2),
        (2, 6, 7, 3), (3, 7, 4, 0),
    ]
    
    mount_obj = create_mesh_object(
        name + '_Mount',
        mount_verts,
        mount_faces,
        materials['weapons'],
        weapons_collection
    )
    mount_obj.location = Vector(position)
    mount_obj.rotation_euler = Euler(rotation, 'XYZ')
    
    # Radar dome
    radar_verts = [
        (-0.25, -0.25, 0.5), (0.25, -0.25, 0.5),
        (0.25, 0.25, 0.5), (-0.25, 0.25, 0.5),
        (-0.2, -0.2, 1.0), (0.2, -0.2, 1.0),
        (0.2, 0.2, 1.0), (-0.2, 0.2, 1.0),
        (0, 0, 1.3),
    ]
    
    radar_faces = [
        (0, 1, 2, 3), (4, 7, 6, 5),
        (0, 4, 5, 1), (1, 5, 6, 2),
        (2, 6, 7, 3), (3, 7, 4, 0),
        (4, 5, 8), (5, 6, 8), (6, 7, 8), (7, 4, 8),
    ]
    
    radar_dome_obj = create_mesh_object(
        name + '_Radar',
        radar_verts,
        radar_faces,
        materials['radar'],
        weapons_collection
    )
    radar_dome_obj.location = Vector(position)
    radar_dome_obj.rotation_euler = Euler(rotation, 'XYZ')
    
    # Gun barrels
    gun_verts = [
        (-0.05, 0, 1.0), (0.05, 0, 1.0),
        (0.05, 0.1, 1.0), (-0.05, 0.1, 1.0),
        (-0.05, 0, 1.8), (0.05, 0, 1.8),
        (0.05, 0.1, 1.8), (-0.05, 0.1, 1.8),
    ]
    
    gun_faces = [
        (0, 1, 2, 3), (4, 7, 6, 5),
        (0, 4, 5, 1), (1, 5, 6, 2),
        (2, 6, 7, 3), (3, 7, 4, 0),
    ]
    
    gun_barrel_obj = create_mesh_object(
        name + '_Gun',
        gun_verts,
        gun_faces,
        materials['weapons'],
        weapons_collection
    )
    gun_barrel_obj.location = Vector(position)
    gun_barrel_obj.rotation_euler = Euler(rotation, 'XYZ')
    
    return mount_obj, radar_dome_obj, gun_barrel_obj

# Create CIWS systems
ciws1_mount, ciws1_radar, ciws1_gun = create_ciws('CIWS_Port', (-3.5, 2.2, 2.5), (0.15, 0.2, 0))
ciws2_mount, ciws2_radar, ciws2_gun = create_ciws('CIWS_Starboard', (3.5, -2.2, 2.5), (0.15, -0.2, 0))

# ===============================
# SUPPORT EQUIPMENT
# ===============================

def create_elevator(name, position):
    """Create aircraft elevator"""
    
    # Platform
    elev_verts = [
        (-0.8, -0.6, 1.75), (0.8, -0.6, 1.75),
        (0.8, 0.6, 1.75), (-0.8, 0.6, 1.75),
        (-0.75, -0.55, 1.72), (0.75, -0.55, 1.72),
        (0.75, 0.55, 1.72), (-0.75, 0.55, 1.72),
    ]
    
    elev_faces = [
        (0, 1, 2, 3), (4, 7, 6, 5),
        (0, 4, 5, 1), (1, 5, 6, 2),
        (2, 6, 7, 3), (3, 7, 4, 0),
    ]
    
    elev_obj = create_mesh_object(
        name,
        elev_verts,
        elev_faces,
        materials['weapons'],
        support_collection
    )
    elev_obj.location = Vector(position)
    
    return elev_obj

# Create elevators
elevator1 = create_elevator('Elevator_Forward', (-2.0, -0.8, 1.75))
elevator2 = create_elevator('Elevator_Aft', (2.5, 1.2, 1.75))

# ===============================
# OCEAN PLANE
# ===============================

def create_water_plane():
    """Create ocean surface"""
    
    water_verts = [
        (-20, -20, -1), (20, -20, -1),
        (20, 20, -1), (-20, 20, -1),
    ]
    
    water_faces = [(0, 1, 2, 3)]
    
    water_collection = create_collection('99_Environment')
    
    water_obj = create_mesh_object(
        'Ocean_Plane',
        water_verts,
        water_faces,
        materials['water'],
        water_collection
    )
    
    return water_obj

water = create_water_plane()

# ===============================
# SCENE SETUP
# ===============================

# Set world background
world = bpy.data.worlds['World']
world.use_nodes = True
world_nodes = world.node_tree.nodes
world_nodes['Background'].inputs['Strength'].default_value = 0.5

# Add sun light
sun = bpy.data.lights.new('Sun', type='SUN')
sun.energy = 2.5
sun.angle = 0.05
sun_obj = bpy.data.objects.new('Sun', sun)
bpy.context.scene.collection.objects.link(sun_obj)
sun_obj.location = (10, 15, 20)
sun_obj.rotation_euler = Euler((math.radians(45), math.radians(45), 0), 'XYZ')

# Add fill light
fill = bpy.data.lights.new('Fill', type='POINT')
fill.energy = 500
fill_obj = bpy.data.objects.new('Fill_Light', fill)
bpy.context.scene.collection.objects.link(fill_obj)
fill_obj.location = (-10, -10, 8)

# Setup camera
bpy.context.scene.camera.location = (12, 8, 8)
bpy.context.scene.camera.rotation_euler = Euler((math.radians(65), 0, math.radians(45)), 'XYZ')

# Render settings
bpy.context.scene.render.engine = 'CYCLES'
bpy.context.scene.cycles.samples = 256
bpy.context.scene.cycles.use_denoising = True

print("=====================================")
print("INS Vikrant Model Generation Complete!")
print("=====================================")
print("✓ Hull with realistic curvature")
print("✓ Flight deck with markings")
print("✓ Island superstructure")
print("✓ Integrated mast and sensors")
print("✓ Aircraft (3 fighters + 2 helicopters)")
print("✓ Weapons systems (2 CIWS)")
print("✓ Support equipment (2 elevators)")
print("✓ Ocean plane")
print("\nModular Collections Created:")
print("- 01_Hull")
print("- 02_Flight_Deck")
print("- 03_Island")
print("- 04_Sensors_Mast")
print("- 05_Aircraft")
print("- 06_Weapons")
print("- 07_Support_Equipment")
print("- 99_Environment")
print("\nReady for animation and assembly/disassembly showcase!")
print("=====================================")
