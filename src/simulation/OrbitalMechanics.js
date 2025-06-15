// src/simulation/OrbitalMechanics.js
import * as THREE from 'three';
import { AU_TO_KM, GRAVITATIONAL_PARAMETERS } from '../utils/constants.js';

export class OrbitalMechanics {
  // Get velocity components in orbital reference frame
  static getOrbitalReferenceFrame(position, velocity) {
    // Position vector (from Sun)
    const r = position.clone().normalize();
    
    // Velocity direction (tangent to orbit)
    const v = velocity.clone().normalize();
    
    // Normal to orbital plane (angular momentum direction)
    const h = new THREE.Vector3().crossVectors(r, v).normalize();
    
    // Prograde direction (perpendicular to r in orbital plane)
    const prograde = new THREE.Vector3().crossVectors(h, r).normalize();
    
    return {
      radial: r,        // Away from Sun
      prograde: prograde, // Direction of motion
      normal: h         // Perpendicular to orbital plane
    };
  }
  
  // Convert delta-v from RSW (Radial-Along-Cross) to inertial coordinates
static convertDeltaV(deltaV_RSW, position, velocity) {
  const frame = this.getOrbitalReferenceFrame(position, velocity);
  
  // deltaV_RSW components: [radial, along-track, cross-track]
  const deltaV = new THREE.Vector3();
  
  // Radial component (toward/away from Sun)
  deltaV.addScaledVector(frame.radial, deltaV_RSW.x);
  
  // Along-track component (prograde/retrograde)
  deltaV.addScaledVector(frame.prograde, deltaV_RSW.y);
  
  // Cross-track component (normal to orbital plane)
  deltaV.addScaledVector(frame.normal, deltaV_RSW.z);
  
  return deltaV;
}
  
  // Calculate Hohmann transfer delta-v requirements
  static calculateHohmannTransfer(r1, r2) {
    // r1, r2 in km
    const mu = GRAVITATIONAL_PARAMETERS.sun / 1e9; // Convert to km³/s²
    
    // Current orbit velocity
    const v1 = Math.sqrt(mu / r1);
    
    // Transfer orbit velocities
    const a_transfer = (r1 + r2) / 2; // Semi-major axis of transfer orbit
    const v_transfer1 = Math.sqrt(mu * (2/r1 - 1/a_transfer));
    const v_transfer2 = Math.sqrt(mu * (2/r2 - 1/a_transfer));
    
    // Target orbit velocity
    const v2 = Math.sqrt(mu / r2);
    
    // Delta-v requirements
    const dv1 = v_transfer1 - v1; // At departure (positive = prograde)
    const dv2 = v2 - v_transfer2; // At arrival
    
    return {
      departure: dv1,
      arrival: dv2,
      total: Math.abs(dv1) + Math.abs(dv2),
      transferTime: Math.PI * Math.sqrt(Math.pow(a_transfer, 3) / mu) / 86400 // days
    };
  }
  
// Calculate orbital elements from state vectors
  static calculateOrbitalElements(position, velocity, mu) {
    // Input validation
    if (!position || !velocity || !mu || mu === 0) {
      return {
        semiMajorAxis: 0,
        eccentricity: 0,
        inclination: 0,
        periapsis: 0,
        apoapsis: 0,
        period: 0,
        specificEnergy: 0
      };
    }
    
    const r = position.length() * AU_TO_KM; // Convert AU to km
    const v = velocity.length(); // Already in km/s
    
    // Validate inputs
    if (r === 0 || !isFinite(r) || !isFinite(v)) {
      return {
        semiMajorAxis: 0,
        eccentricity: 0,
        inclination: 0,
        periapsis: 0,
        apoapsis: 0,
        period: 0,
        specificEnergy: 0
      };
    }
    
    // Specific orbital energy
    const energy = (v * v) / 2 - mu / r;
    
    // Semi-major axis
    const a = -mu / (2 * energy);
    
    // Angular momentum
    const h = position.clone().cross(velocity);
    const hMag = h.length() * AU_TO_KM; // Convert to km²/s
    
    // Eccentricity vector
    const eVector = velocity.clone().cross(h).multiplyScalar(1/mu).sub(position.clone().normalize());
    const e = eVector.length();
    
    // Inclination
    const i = Math.acos(Math.min(1, Math.max(-1, h.z / h.length()))) * 180 / Math.PI;
    
    // Orbital period
    const period = a > 0 ? 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / mu) / 86400 : 0; // days
    
    // Validate all outputs
    const safeValue = (value, fallback = 0) => {
      return isFinite(value) ? value : fallback;
    };
    
    return {
      semiMajorAxis: safeValue(a / AU_TO_KM), // Convert back to AU
      eccentricity: safeValue(e),
      inclination: safeValue(i),
      periapsis: safeValue(a * (1 - e) / AU_TO_KM),
      apoapsis: safeValue(a * (1 + e) / AU_TO_KM),
      period: safeValue(period),
      specificEnergy: safeValue(energy)
    };
  }
  
  // Validate physics implementation
  static validatePhysics(spacecraft) {
    const elements = spacecraft.getOrbitalElements();
    const position = spacecraft.position.clone();
    const velocity = spacecraft.velocity.clone();
    
    // Test 1: Energy conservation
    const r = position.length() * AU_TO_KM;
    const v = velocity.length();
    const mu = GRAVITATIONAL_PARAMETERS.sun / 1e9;
    const energy = (v * v) / 2 - mu / r;
    const expectedEnergy = -mu / (2 * elements.semiMajorAxis * AU_TO_KM);
    const energyError = Math.abs(energy - expectedEnergy) / Math.abs(expectedEnergy);
    
    // Test 2: Kepler's third law
    const predictedPeriod = 2 * Math.PI * Math.sqrt(Math.pow(elements.semiMajorAxis * AU_TO_KM, 3) / mu) / 86400;
    const keplerError = Math.abs(predictedPeriod - elements.period) / elements.period;
    
    return {
      energyConserved: energyError < 0.01,
      energyError: energyError * 100,
      keplerValid: keplerError < 0.01,
      keplerError: keplerError * 100,
      overallValid: energyError < 0.01 && keplerError < 0.01
    };
  }
}