// src/simulation/CelestialBody.js
import * as THREE from 'three';
import * as Astronomy from 'astronomy-engine';
import { 
  EARTH_RADIUS_KM,
  SOLAR_RADIUS_KM,
  AU_TO_KM,
  SECONDS_PER_DAY,
  SECONDS_PER_MINUTE,
  VISUAL_SETTINGS,
  ORBITAL_VELOCITIES
} from '../utils/constants.js';

/* ===================================
   CELESTIAL BODY CLASS
   Represents planets, moons, and other celestial objects
   =================================== */

export class CelestialBody {
  constructor(planetData, astronomyBody) {
    // Core data
    this.data = planetData;
    this.astronomyBody = astronomyBody;
    this.name = planetData.name;
    
    // Visual components
    this.mesh = null;
    this.atmosphere = null;
    this.rings = null;
    this.label = null;
    this.orbitLine = null;
    
    // Orbit data
    this.orbitPoints = [];
    this.currentPosition = new THREE.Vector3();
    this.currentVelocity = new THREE.Vector3();
    
    // Rotation - use SPICE sidereal period
    this.rotationSpeed = this.calculateRotationSpeed();
    this.axialTilt = this.data.axialTilt || 0;
    
    // LOD (Level of Detail)
    this.lodLevels = {
      high: 64,    // Sphere segments for close view
      medium: 32,  // Standard view
      low: 16      // Distant view
    };
    
    // Initialize components
    this.createVisualElements();
  }

  /* ===================================
     VISUAL COMPONENTS
     =================================== */
  
createVisualElements() {
  this.mesh = this.createMesh();
  this.orbitLine = this.createOrbitLine();
  
  // Create a container group for the planet system
  this.group = new THREE.Group();
  this.group.add(this.mesh);
  
  // Add special features
  if (this.data.hasRings) {
    this.createRings();
    if (this.rings) {
      this.group.add(this.rings);
    }
  }
  
  if (this.data.atmospherePressure > 0) {
    this.createAtmosphere();
  }
  
  // Create label (it will add itself to the group)
  this.createLabel();
  
  // Apply proper axial tilt to the entire group
  if (this.axialTilt !== 0) {
    this.group.rotation.z = THREE.MathUtils.degToRad(this.axialTilt);
  }
}
  
  createMesh() {
    const visualRadius = this.calculateVisualRadius();
    
    // Create LOD object for performance
    const lod = new THREE.LOD();
    
    // Calculate flattening for oblate spheroid shape
    const flattening = this.data.flattening || 0;
    const polarScale = 1 - flattening;
    
    // High detail mesh (close up)
    const highGeo = this.createOblateSpheroid(visualRadius, polarScale, this.lodLevels.high);
    const highMesh = new THREE.Mesh(highGeo, this.createMaterial());
    lod.addLevel(highMesh, 0);
    
    // Medium detail mesh (standard view)
    const medGeo = this.createOblateSpheroid(visualRadius, polarScale, this.lodLevels.medium);
    const medMesh = new THREE.Mesh(medGeo, this.createMaterial());
    lod.addLevel(medMesh, 5);
    
    // Low detail mesh (distant view)
    const lowGeo = this.createOblateSpheroid(visualRadius, polarScale, this.lodLevels.low);
    const lowMesh = new THREE.Mesh(lowGeo, this.createMaterial());
    lod.addLevel(lowMesh, 20);
    
    // Add glow effect for stars
    if (this.data.emissive) {
      this.addStarGlow(lod);
    }
    
    return lod;
  }
  
  createOblateSpheroid(equatorialRadius, polarScale, segments) {
    // Create a sphere and scale it to make an oblate spheroid
    const geometry = new THREE.SphereGeometry(equatorialRadius, segments, segments);
    
    // Scale Y axis (poles) by polarScale to create oblate shape
    if (polarScale < 1) {
      geometry.scale(1, polarScale, 1);
    }
    
    return geometry;
  }
  
  calculateVisualRadius() {
    // Use equatorial radius for visual scaling
    const radius = this.data.equatorial_radius || this.data.radius || EARTH_RADIUS_KM;
    
    // Special handling for the Sun
    if (this.data.name === 'Sun') {
      const sunScale = Math.log10(radius / EARTH_RADIUS_KM + 1) * 0.15;
      return sunScale * VISUAL_SETTINGS.planetScale;
    }
    
    // For planets, use logarithmic scaling based on Earth radii
    const radiusInEarthRadii = radius / EARTH_RADIUS_KM;
    const scaledRadius = Math.log10(radiusInEarthRadii + 1) * 0.1;
    
    return scaledRadius * VISUAL_SETTINGS.planetScale;
  }
  
  createMaterial() {
    const materialOptions = {
      color: this.data.color,
      emissive: this.data.emissive ? this.data.color : 0x000000,
      emissiveIntensity: this.data.emissive ? 1 : 0,
      shininess: this.data.emissive ? 0 : 50
    };
    
    // Add texture support preparation
    if (this.data.textureUrl) {
      // Texture loading would go here
      // const texture = textureLoader.load(this.data.textureUrl);
      // materialOptions.map = texture;
    }
    
    return new THREE.MeshPhongMaterial(materialOptions);
  }
  
  addStarGlow(mesh) {
    // Create glow sprite for stars
    const spriteMaterial = new THREE.SpriteMaterial({
      map: this.createGlowTexture(),
      color: this.data.color,
      blending: THREE.AdditiveBlending,
      opacity: 0.8
    });
    
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.multiplyScalar(4);
    mesh.add(sprite);
  }
  
  createGlowTexture() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    
    return new THREE.CanvasTexture(canvas);
  }
  
  createAtmosphere() {
    const visualRadius = this.calculateVisualRadius();
    const flattening = this.data.flattening || 0;
    const polarScale = 1 - flattening;
    
    // Atmosphere is slightly larger than the planet
    const atmosphereGeometry = new THREE.SphereGeometry(
      visualRadius * 1.1, // 10% larger than planet
      32, 32
    );
    
    // Apply same flattening to atmosphere
    if (polarScale < 1) {
      atmosphereGeometry.scale(1, polarScale, 1);
    }
    
    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(this.data.atmosphereColor || 0x4444ff) },
        opacity: { value: 0.2 }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float opacity;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(color, intensity * opacity);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    
    this.atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    this.mesh.add(this.atmosphere);
  }
  
createRings() {
  if (this.data.name !== 'Saturn') return; // Only Saturn for now
  
  const innerRadius = this.calculateVisualRadius() * 1.5;
  const outerRadius = this.calculateVisualRadius() * 2.5;
  
  const ringGeometry = new THREE.RingGeometry(
    innerRadius,
    outerRadius,
    64, // Theta segments
    8   // Phi segments
  );
  
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xffcc99,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7
  });
  
  this.rings = new THREE.Mesh(ringGeometry, ringMaterial);
  this.rings.rotation.x = Math.PI / 2; // Lay flat
    
    // Apply Saturn's axial tilt to rings
    if (this.axialTilt !== 0) {
      this.rings.rotation.z = THREE.MathUtils.degToRad(this.axialTilt);
    }
    
    this.mesh.add(this.rings);
  }

  /* ===================================
     ORBIT VISUALIZATION
     =================================== */
  
  createOrbitLine() {
    if (!this.data.orbitalPeriod) return null;

    const points = [];
    const segments = 512; // Higher quality orbits
    const currentDate = new Date();

    // Generate orbit points over one full orbit
    for (let i = 0; i <= segments; i++) {
      const fraction = i / segments;
      const daysOffset = fraction * this.data.orbitalPeriod;
      const date = new Date(currentDate.getTime() + daysOffset * SECONDS_PER_DAY * 1000);
      
      const pos = Astronomy.HelioVector(this.astronomyBody, date);
      points.push(new THREE.Vector3(pos.x, pos.z, -pos.y));
    }

    // Create gradient material for orbit
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // Add vertex colors for gradient effect
    const colors = new Float32Array(points.length * 3);
    for (let i = 0; i < points.length; i++) {
      const t = i / points.length;
      colors[i * 3] = 1 - t * 0.3;     // R
      colors[i * 3 + 1] = 1 - t * 0.3; // G
      colors[i * 3 + 2] = 1 - t * 0.3; // B
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      opacity: 0.3,
      transparent: true,
      blending: THREE.AdditiveBlending
    });

    this.orbitLine = new THREE.Line(geometry, material);
    this.orbitPoints = points;
    
    return this.orbitLine;
  }
  
  updateOrbitVisibility(cameraDistance) {
    if (!this.orbitLine) return;
    
    // Fade orbit based on camera distance
    const fadeStart = 10;
    const fadeEnd = 100;
    
    const opacity = THREE.MathUtils.clamp(
      1 - (cameraDistance - fadeStart) / (fadeEnd - fadeStart),
      0, 0.3
    );
    
    this.orbitLine.material.opacity = opacity;
  }

  /* ===================================
     POSITION AND MOTION
     =================================== */
  
  updatePosition(date) {
    if (this.data.name === 'Sun') {
      this.group.position.set(0, 0, 0);
      this.currentPosition.set(0, 0, 0);
      return;
    }

    // Get position from astronomy engine
    const pos = Astronomy.HelioVector(this.astronomyBody, date);
    
    // Convert to Three.js coordinates (swap Y and Z, negate Z)
    this.currentPosition.set(pos.x, pos.z, -pos.y);
    this.group.position.copy(this.currentPosition); // Move the group, not mesh
    
    // Update velocity for info display
    this.updateVelocity(date);
  }
  
  updateVelocity(date) {
    // Calculate velocity using finite difference
    const futureDate = new Date(date.getTime() + SECONDS_PER_MINUTE * 1000);
    const currentPos = Astronomy.HelioVector(this.astronomyBody, date);
    const futurePos = Astronomy.HelioVector(this.astronomyBody, futureDate);
    
    const dx = futurePos.x - currentPos.x;
    const dy = futurePos.y - currentPos.y;
    const dz = futurePos.z - currentPos.z;
    
    const velocityAU = new THREE.Vector3(dx, dz, -dy); // Convert to Three.js coords
    this.currentVelocity = velocityAU.multiplyScalar(AU_TO_KM / SECONDS_PER_MINUTE);
  }
  
  updateRotation(deltaTime) {
    if (this.rotationSpeed === 0 || !this.mesh) return;
    
    // Rotate around Y axis (poles)
    const rotationAngle = (deltaTime * this.rotationSpeed) % (2 * Math.PI);
    this.mesh.rotation.y += rotationAngle;
  }
  
  calculateRotationSpeed() {
    if (!this.data.rotationPeriod || this.data.rotationPeriod === 0) return 0;
    
    // Convert rotation period (in days) to radians per day
    const radiansPerDay = (2 * Math.PI) / Math.abs(this.data.rotationPeriod);
    
    // Negative period means retrograde rotation
    return this.data.rotationPeriod < 0 ? -radiansPerDay : radiansPerDay;
  }

  get position() {
  return this.group ? this.group.position : new THREE.Vector3();
}

  /* ===================================
     LABELS AND INFO
     =================================== */
  
  createLabel() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;
    
    // Style the label
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.font = 'Bold 48px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(this.data.name, canvas.width / 2, canvas.height / 2);
    
    // Create sprite
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.8
    });
    
    this.label = new THREE.Sprite(spriteMaterial);
    this.label.scale.set(0.5, 0.125, 1);
    this.label.position.y = this.calculateVisualRadius() * 1.5;
    
    // Add label to the group, not the mesh
    if (this.group) {
      this.group.add(this.label);
    }
    
    return this.label;
  }
  
  updateLabelVisibility(cameraDistance) {
    if (!this.label) return;
    
    // Show labels only when close enough
    const maxDistance = 10;
    this.label.visible = cameraDistance < maxDistance;
    
    // Scale label based on distance
    if (this.label.visible) {
      const scale = Math.max(0.1, Math.min(1, 5 / cameraDistance));
      this.label.scale.set(scale * 0.5, scale * 0.125, 1);
    }
  }

  /* ===================================
     DATA AND INFORMATION
     =================================== */
  
  getInfo(date = new Date()) {
    const baseInfo = {
      name: this.data.name,
      equatorial_radius: this.data.equatorial_radius || this.data.radius,
      polar_radius: this.data.polar_radius || this.data.radius,
      flattening: this.data.flattening || 0,
      mass: this.data.mass,
      type: this.getBodyType()
    };
    
    // Sun doesn't orbit
    if (this.data.name === 'Sun') {
      return {
        ...baseInfo,
        distance: 0,
        velocity: 0,
        temperature: this.data.temperature || 'N/A',
        rotationPeriod: this.data.rotationPeriod
      };
    }
    
    // Calculate orbital information
    const distance = this.currentPosition.length();
    const velocity = this.currentVelocity.length();
    
    // Additional orbital elements
    const orbitalInfo = this.getOrbitalElements();
    
    return {
      ...baseInfo,
      distance: distance.toFixed(3),
      velocity: velocity.toFixed(1),
      orbitalPeriod: this.data.orbitalPeriod,
      rotationPeriod: Math.abs(this.data.rotationPeriod || 0),
      axialTilt: this.data.axialTilt,
      eccentricity: this.data.eccentricity,
      inclination: this.data.inclination,
      atmosphere: this.data.atmospherePressure > 0,
      ...orbitalInfo
    };
  }
  
  getBodyType() {
    const radius = this.data.radius || this.data.equatorial_radius || 0;
    
    if (this.data.name === 'Sun') return 'Star';
    if (radius < 3000) return 'Terrestrial Planet';
    if (radius < 10000) return 'Super-Earth';
    return 'Gas Giant';
  }
  
  getOrbitalElements() {
    if (!this.astronomyBody || this.data.name === 'Sun') {
      return {};
    }
    
    // Calculate current anomalies and phase
    const orbitalPhase = this.calculateOrbitalPhase();
    
    return {
      meanAnomaly: orbitalPhase.meanAnomaly,
      trueAnomaly: orbitalPhase.trueAnomaly,
      phaseAngle: orbitalPhase.phaseAngle,
      elongation: orbitalPhase.elongation
    };
  }
  
  calculateOrbitalPhase() {
    // Simplified orbital phase calculations
    const currentDate = new Date();
    const timeSinceEpoch = currentDate.getTime() / 1000;
    const orbitalPeriodSeconds = this.data.orbitalPeriod * SECONDS_PER_DAY;
    
    const meanAnomaly = ((timeSinceEpoch % orbitalPeriodSeconds) / orbitalPeriodSeconds) * 360;
    
    // True anomaly would require solving Kepler's equation
    // For now, approximate with mean anomaly
    const trueAnomaly = meanAnomaly; // Simplified
    
    return {
      meanAnomaly: meanAnomaly.toFixed(1),
      trueAnomaly: trueAnomaly.toFixed(1),
      phaseAngle: 0, // Would need Earth position
      elongation: 0  // Would need Earth position
    };
  }

  /* ===================================
     UTILITY METHODS
     =================================== */
  
  dispose() {
    // Clean up Three.js resources
    if (this.mesh) {
      this.mesh.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
    
    if (this.orbitLine) {
      this.orbitLine.geometry.dispose();
      this.orbitLine.material.dispose();
    }
    
    if (this.label) {
      this.label.material.map.dispose();
      this.label.material.dispose();
    }
  }
  
  setHighlight(enabled) {
    // Highlight the body when selected
    if (!this.mesh) return;
    
    const emissiveIntensity = enabled ? 0.3 : (this.data.emissive ? 1 : 0);
    const emissiveColor = enabled ? 0xffff00 : (this.data.emissive ? this.data.color : 0x000000);
    
    this.mesh.traverse((child) => {
      if (child.material && child.material.emissive) {
        child.material.emissive = new THREE.Color(emissiveColor);
        child.material.emissiveIntensity = emissiveIntensity;
      }
    });
  }
}