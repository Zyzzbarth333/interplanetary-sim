// src/simulation/Spacecraft.js
import * as THREE from 'three';
import { 
  G,
  AU_TO_METERS,
  AU_TO_KM,
  SECONDS_PER_DAY,
  SPACECRAFT_DEFAULTS,
  GRAVITATIONAL_PARAMETERS,
  VISUAL_SETTINGS
} from '../utils/constants.js';

/* ===================================
   SPACECRAFT CLASS
   Handles spacecraft physics, rendering, and trajectory tracking
   =================================== */

export class Spacecraft {
  constructor(name, initialState = {}) {
    // Basic properties
    this.name = name;
    this.createdAt = new Date();
    
    // Physics state
    this.position = new THREE.Vector3(...(initialState.position || [1, 0, 0])); // AU
    this.velocity = new THREE.Vector3(...(initialState.velocity || [0, 30, 0])); // km/s
    this.acceleration = new THREE.Vector3(); // m/s²
    
    // Spacecraft properties
    this.mass = initialState.mass || SPACECRAFT_DEFAULTS.mass; // kg
    this.fuelMass = initialState.fuelMass || SPACECRAFT_DEFAULTS.fuelMass; // kg
    this.exhaustVelocity = initialState.exhaustVelocity || SPACECRAFT_DEFAULTS.exhaustVelocity; // m/s
    this.thrustPower = initialState.thrustPower || SPACECRAFT_DEFAULTS.thrustPower; // N
    
    // Mission state
    this.thrustVector = new THREE.Vector3();
    this.engineOn = false;
    this.missionElapsedTime = 0; // seconds
    
    // Trajectory tracking
    this.trajectory = [];
    this.maxTrajectoryPoints = VISUAL_SETTINGS.trailLength;
    
    // Visual elements
    this.mesh = this.createMesh();
    this.trajectoryLine = this.createTrajectoryLine();
    this.thrustIndicator = this.createThrustIndicator();
  }

  /* ===================================
     VISUAL COMPONENTS
     =================================== */
  
  createMesh() {
    // Main spacecraft body (cone pointing forward)
    const geometry = new THREE.ConeGeometry(0.005, 0.02, 8);
    geometry.rotateX(Math.PI / 2); // Point forward
    
    const material = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.3,
      shininess: 100
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Add solar panels (simplified)
    const panelGeometry = new THREE.BoxGeometry(0.04, 0.001, 0.01);
    const panelMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a2e,
      emissive: 0x0066ff,
      emissiveIntensity: 0.1
    });
    
    const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    leftPanel.position.set(-0.025, 0, 0);
    mesh.add(leftPanel);
    
    const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    rightPanel.position.set(0.025, 0, 0);
    mesh.add(rightPanel);
    
    return mesh;
  }
  
createThrustIndicator() {
  // Thrust exhaust cone
  const geometry = new THREE.ConeGeometry(0.003, 0.015, 8);
  geometry.rotateX(-Math.PI / 2);
  
  // Use PhongMaterial for emissive glow
  const material = new THREE.MeshPhongMaterial({
    color: 0xff4400,
    emissive: 0xffaa00,
    emissiveIntensity: 1,
    transparent: true,
    opacity: 0.8,
    visible: false
  });
  
  const indicator = new THREE.Mesh(geometry, material);
  indicator.position.z = -0.015;
  this.mesh.add(indicator);
  
  return indicator;
}
  
  createTrajectoryLine() {
    const geometry = new THREE.BufferGeometry();
    
    // Use gradient material for fading trail
    const material = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      opacity: 0.6,
      transparent: true,
      linewidth: 2 // Note: only works on some platforms
    });
    
    const line = new THREE.Line(geometry, material);
    
    // Initialize empty buffer
    const positions = new Float32Array(this.maxTrajectoryPoints * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setDrawRange(0, 0);
    
    return line;
  }

  /* ===================================
     PHYSICS CALCULATIONS
     =================================== */
  
  update(deltaTime, bodies) {
    const dt = deltaTime * SECONDS_PER_DAY; // Convert days to seconds
    this.missionElapsedTime += dt;
    
    // Calculate all accelerations
    this.acceleration = this.calculateTotalAcceleration(bodies, dt);
    
    // Update velocity and position using improved integration
    this.integrateMotion(dt);
    
    // Update visual elements
    this.updateVisuals();
    
    // Track trajectory
    this.updateTrajectory();
  }
  
  calculateTotalAcceleration(bodies, dt) {
    const totalAcceleration = new THREE.Vector3();
    
    // Gravitational acceleration
    const gravAccel = this.calculateGravitationalAcceleration(bodies);
    totalAcceleration.add(gravAccel);
    
    // Thrust acceleration (if engine is on)
    if (this.engineOn && this.fuelMass > 0) {
      const thrustAccel = this.calculateThrustAcceleration(dt);
      totalAcceleration.add(thrustAccel);
    }
    
    return totalAcceleration;
  }
  
  calculateGravitationalAcceleration(bodies) {
    const acceleration = new THREE.Vector3();
    
    bodies.forEach((body, key) => {
      // Skip if no mass data
      if (!body.data || !body.data.mass) return;
      
      // Calculate distance vector
      const r = body.mesh.position.clone().sub(this.position);
      const distanceAU = r.length();
      const distanceMeters = distanceAU * AU_TO_METERS;
      
      if (distanceMeters > 0) {
        // Use gravitational parameter if available for better accuracy
        const mu = GRAVITATIONAL_PARAMETERS[key] || (G * body.data.mass);
        
        // F = μ/r² in the direction of r
        const accelMagnitude = mu / (distanceMeters * distanceMeters);
        const accelDirection = r.normalize();
        
        acceleration.add(accelDirection.multiplyScalar(accelMagnitude));
      }
    });
    
    return acceleration; // m/s²
  }
  
  calculateThrustAcceleration(dt) {
    // Check fuel availability
    if (this.fuelMass <= 0) {
      this.engineOn = false;
      this.thrustIndicator.visible = false;
      return new THREE.Vector3();
    }
    
    // Calculate fuel consumption
    const fuelBurnRate = this.thrustPower / (this.exhaustVelocity * 9.81); // kg/s
    const fuelUsed = Math.min(fuelBurnRate * dt, this.fuelMass);
    this.fuelMass -= fuelUsed;
    
    // Calculate current total mass
    const currentMass = this.mass + this.fuelMass;
    
    // F = ma, so a = F/m
    const acceleration = this.thrustVector.clone()
      .normalize()
      .multiplyScalar(this.thrustPower / currentMass);
    
    // Update visual indicator
    this.thrustIndicator.visible = true;
    
    return acceleration; // m/s²
  }
  
  integrateMotion(dt) {
    // Use velocity Verlet integration for better accuracy
    // v(t+dt) = v(t) + a(t) * dt
    // x(t+dt) = x(t) + v(t+dt) * dt
    
    // Update velocity (convert m/s² to km/s)
    const deltaV = this.acceleration.clone().multiplyScalar(dt / 1000);
    this.velocity.add(deltaV);
    
    // Update position (convert km/s to AU)
    const deltaP = this.velocity.clone().multiplyScalar(dt / AU_TO_KM);
    this.position.add(deltaP);
  }

  /* ===================================
     TRAJECTORY MANAGEMENT
     =================================== */
  
  updateTrajectory() {
    // Add current position to trajectory
    this.trajectory.push(this.position.clone());
    
    // Remove old points if exceeding limit
    if (this.trajectory.length > this.maxTrajectoryPoints) {
      this.trajectory.shift();
    }
    
    // Update line geometry
    const positions = this.trajectoryLine.geometry.attributes.position.array;
    
    for (let i = 0; i < this.trajectory.length; i++) {
      const point = this.trajectory[i];
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    }
    
    this.trajectoryLine.geometry.attributes.position.needsUpdate = true;
    this.trajectoryLine.geometry.setDrawRange(0, this.trajectory.length);
    this.trajectoryLine.geometry.computeBoundingSphere();
  }
  
  clearTrajectory() {
    this.trajectory = [];
    this.trajectoryLine.geometry.setDrawRange(0, 0);
  }

  /* ===================================
     VISUAL UPDATES
     =================================== */
  
  updateVisuals() {
    // Update mesh position
    this.mesh.position.copy(this.position);
    
    // Orient spacecraft along velocity vector
    if (this.velocity.length() > 0.01) {
      const direction = this.velocity.clone().normalize();
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      this.mesh.quaternion.copy(quaternion);
    }
    
    // Update thrust indicator
    if (this.engineOn && this.fuelMass > 0) {
      // Animate thrust flame
      const scale = 1 + Math.sin(this.missionElapsedTime * 10) * 0.2;
      this.thrustIndicator.scale.set(scale, scale, scale);
    }
  }

  /* ===================================
     MANEUVER CONTROLS
     =================================== */
  
  applyManeuver(deltaV, direction) {
    // Apply instantaneous velocity change (impulse maneuver)
    const dv = direction.normalize().multiplyScalar(deltaV);
    this.velocity.add(dv);
    
    console.log(`Maneuver applied: ${deltaV.toFixed(2)} km/s`);
  }
  
  setThrust(direction, on = true) {
    this.engineOn = on;
    
    if (on && direction) {
      this.thrustVector = direction.normalize();
    }
    
    this.thrustIndicator.visible = on;
  }
  
  performBurn(deltaV, direction, duration) {
    // Schedule a burn for a specific duration
    this.setThrust(direction, true);
    
    setTimeout(() => {
      this.setThrust(null, false);
    }, duration * 1000);
  }

  /* ===================================
     ORBITAL MECHANICS CALCULATIONS
     =================================== */
  
  getOrbitalElements(centralBody = { position: new THREE.Vector3(0, 0, 0) }) {
    // State vectors
    const r = this.position.clone().sub(centralBody.position);
    const v = this.velocity.clone();
    
    // Convert to consistent units (km and km/s)
    const rVec = r.clone().multiplyScalar(AU_TO_KM);
    const rMag = rVec.length();
    const vMag = v.length();
    
    // Gravitational parameter (Sun by default)
    const mu = GRAVITATIONAL_PARAMETERS.sun / 1e9; // Convert to km³/s²
    
    // Specific orbital energy
    const specificEnergy = (vMag * vMag) / 2 - mu / rMag;
    
    // Semi-major axis
    const a = -mu / (2 * specificEnergy);
    
    // Angular momentum vector
    const h = rVec.cross(v);
    const hMag = h.length();
    
    // Eccentricity vector
    const eVec = v.cross(h).divideScalar(mu).sub(rVec.normalize());
    const e = eVec.length();
    
    // Inclination
    const i = Math.acos(h.z / hMag) * 180 / Math.PI;
    
    // Orbital period
    const period = 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / mu) / SECONDS_PER_DAY;
    
    return {
      semiMajorAxis: a / AU_TO_KM,  // Convert back to AU
      eccentricity: e,
      inclination: i,               // degrees
      periapsis: a * (1 - e) / AU_TO_KM,  // AU
      apoapsis: a * (1 + e) / AU_TO_KM,   // AU
      period: period,               // days
      specificEnergy: specificEnergy // km²/s²
    };
  }

  /* ===================================
     TELEMETRY AND INFO
     =================================== */
  
  getInfo() {
    const elements = this.getOrbitalElements();
    const totalMass = this.mass + this.fuelMass;
    const fuelPercent = (this.fuelMass / SPACECRAFT_DEFAULTS.fuelMass) * 100;
    
    return {
      // Basic info
      name: this.name,
      missionTime: (this.missionElapsedTime / SECONDS_PER_DAY).toFixed(2), // days
      
      // Position and velocity
      position: this.position.length().toFixed(3), // AU from Sun
      speed: this.velocity.length().toFixed(1),    // km/s
      
      // Spacecraft status
      mass: totalMass.toFixed(0),          // kg
      fuelPercent: fuelPercent.toFixed(1), // %
      engineStatus: this.engineOn ? 'ON' : 'OFF',
      
      // Orbital elements
      apoapsis: elements.apoapsis.toFixed(3),     // AU
      periapsis: elements.periapsis.toFixed(3),   // AU
      eccentricity: elements.eccentricity.toFixed(3),
      inclination: elements.inclination.toFixed(1), // degrees
      period: elements.period.toFixed(1),          // days
      
      // Energy
      specificEnergy: elements.specificEnergy.toFixed(0) // km²/s²
    };
  }
  
  getTelemetryString() {
    const info = this.getInfo();
    return `
${info.name} - Mission Day ${info.missionTime}
Position: ${info.position} AU | Speed: ${info.speed} km/s
Fuel: ${info.fuelPercent}% | Engine: ${info.engineStatus}
Orbit: ${info.periapsis} x ${info.apoapsis} AU (e=${info.eccentricity})
    `.trim();
  }
}