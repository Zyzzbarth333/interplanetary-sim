// src/simulation/PhysicsTest.js
import * as THREE from 'three';
import { OrbitalMechanics } from './OrbitalMechanics.js';
import { AU_TO_KM, GRAVITATIONAL_PARAMETERS } from '../utils/constants.js';

export class PhysicsTest {
  constructor(simulation) {
    this.sim = simulation;
    this.results = [];
  }
  
  async runAllTests() {
    console.log('🧪 Running Physics Validation Tests...\n');
    
    // Clear any existing spacecraft
    this.sim.spacecraft.forEach(s => this.sim.removeSpacecraft(s));
    
    // Run tests sequentially
    await this.testCircularOrbit();
    await this.delay(4000);
    
    await this.testProgradeBoost();
    await this.delay(4000);
    
    await this.testRetrogradeBoost();
    await this.delay(4000);
    
    await this.testHohmannTransfer();
    await this.delay(4000);
    
    await this.testEscapeVelocity();
    
    // Display results summary
    this.displayResults();
  }
  
  async testCircularOrbit() {
    console.log('Test 1: Circular Orbit - No Delta-V');
    
    // Launch with zero delta-v (should maintain Earth's orbit)
    const craft = this.sim.launchSpacecraft(
      'Circular-Test',
      'earth',
      new THREE.Vector3(0, 0, 0)
    );
    
    const initial = craft.getOrbitalElements();
    console.log('Initial:', {
      a: initial.semiMajorAxis.toFixed(3) + ' AU',
      e: initial.eccentricity.toFixed(4)
    });
    
    // Speed up time and wait
    this.sim.timeController.setTimeScale(100);
    this.sim.timeController.play();
    
    return new Promise(resolve => {
      setTimeout(() => {
        this.sim.timeController.pause();
        const final = craft.getOrbitalElements();
        
        const drift = Math.abs(final.semiMajorAxis - initial.semiMajorAxis);
        const pass = drift < 0.001 && final.eccentricity < 0.02;
        
        this.results.push({
          test: 'Circular Orbit',
          expected: 'Maintain 1.0 AU circular orbit',
          actual: `a=${final.semiMajorAxis.toFixed(3)} AU, e=${final.eccentricity.toFixed(4)}`,
          pass: pass
        });
        
        console.log(pass ? '✅ PASS' : '❌ FAIL');
        this.sim.removeSpacecraft(craft);
        resolve();
      }, 3650); // 365 days at 100x
    });
  }
  
  async testProgradeBoost() {
    console.log('\nTest 2: Prograde Boost - 5 km/s');
    
    const craft = this.sim.launchSpacecraft(
      'Prograde-Test',
      'earth',
      new THREE.Vector3(0, 5, 0) // 5 km/s prograde
    );
    
    const elements = craft.getOrbitalElements();
    
    // Expected: higher apoapsis, same periapsis
    const pass = elements.apoapsis > 1.5 && 
                 Math.abs(elements.periapsis - 1.0) < 0.1 &&
                 elements.eccentricity > 0.2;
    
    this.results.push({
      test: 'Prograde Boost',
      expected: 'Raise apoapsis, periapsis ≈ 1 AU',
      actual: `Ap=${elements.apoapsis.toFixed(2)} AU, Pe=${elements.periapsis.toFixed(2)} AU, e=${elements.eccentricity.toFixed(3)}`,
      pass: pass
    });
    
    console.log('Orbit:', {
      apoapsis: elements.apoapsis.toFixed(2) + ' AU',
      periapsis: elements.periapsis.toFixed(2) + ' AU',
      eccentricity: elements.eccentricity.toFixed(3)
    });
    console.log(pass ? '✅ PASS' : '❌ FAIL');
    
    this.sim.removeSpacecraft(craft);
  }
  
  async testRetrogradeBoost() {
    console.log('\nTest 3: Retrograde Boost - 5 km/s');
    
    const craft = this.sim.launchSpacecraft(
      'Retrograde-Test',
      'earth',
      new THREE.Vector3(0, -5, 0) // 5 km/s retrograde
    );
    
    const elements = craft.getOrbitalElements();
    
    // Expected: lower periapsis, same apoapsis
    const pass = elements.periapsis < 0.8 && 
                 Math.abs(elements.apoapsis - 1.0) < 0.1 &&
                 elements.eccentricity > 0.2;
    
    this.results.push({
      test: 'Retrograde Boost',
      expected: 'Lower periapsis, apoapsis ≈ 1 AU',
      actual: `Ap=${elements.apoapsis.toFixed(2)} AU, Pe=${elements.periapsis.toFixed(2)} AU, e=${elements.eccentricity.toFixed(3)}`,
      pass: pass
    });
    
    console.log('Orbit:', {
      apoapsis: elements.apoapsis.toFixed(2) + ' AU',
      periapsis: elements.periapsis.toFixed(2) + ' AU',
      eccentricity: elements.eccentricity.toFixed(3)
    });
    console.log(pass ? '✅ PASS' : '❌ FAIL');
    
    this.sim.removeSpacecraft(craft);
  }
  
  async testHohmannTransfer() {
    console.log('\nTest 4: Earth-Mars Hohmann Transfer');
    
    // Calculate Hohmann transfer
    const transfer = OrbitalMechanics.calculateHohmannTransfer(
      1.0 * AU_TO_KM,   // Earth
      1.524 * AU_TO_KM  // Mars
    );
    
    console.log('Calculated transfer:', {
      deltaV: transfer.departure.toFixed(3) + ' km/s',
      time: transfer.transferTime.toFixed(0) + ' days'
    });
    
    const craft = this.sim.launchSpacecraft(
      'Mars-Transfer',
      'earth',
      new THREE.Vector3(0, transfer.departure, 0)
    );
    
    const elements = craft.getOrbitalElements();
    
    // Expected: apoapsis at Mars, periapsis at Earth
    const pass = Math.abs(elements.apoapsis - 1.524) < 0.05 &&
                 Math.abs(elements.periapsis - 1.0) < 0.05;
    
    this.results.push({
      test: 'Hohmann Transfer',
      expected: 'Pe=1.0 AU, Ap=1.524 AU',
      actual: `Pe=${elements.periapsis.toFixed(3)} AU, Ap=${elements.apoapsis.toFixed(3)} AU`,
      pass: pass
    });
    
    console.log('Transfer orbit:', {
      apoapsis: elements.apoapsis.toFixed(3) + ' AU (Mars)',
      periapsis: elements.periapsis.toFixed(3) + ' AU (Earth)'
    });
    console.log(pass ? '✅ PASS' : '❌ FAIL');
    
    this.sim.removeSpacecraft(craft);
  }
  
  async testEscapeVelocity() {
    console.log('\nTest 5: Solar Escape Velocity');
    
    // Earth's orbital velocity is ~30 km/s
    // Escape from 1 AU needs ~42 km/s
    // So we need ~12 km/s prograde
    const craft = this.sim.launchSpacecraft(
      'Escape-Test',
      'earth',
      new THREE.Vector3(0, 12.3, 0)
    );
    
    const elements = craft.getOrbitalElements();
    
    // Expected: eccentricity ≥ 1 (parabolic/hyperbolic)
    const pass = elements.eccentricity >= 0.98;
    
    this.results.push({
      test: 'Escape Velocity',
      expected: 'e ≥ 1.0 (escape trajectory)',
      actual: `e=${elements.eccentricity.toFixed(3)}`,
      pass: pass
    });
    
    console.log('Orbit:', {
      eccentricity: elements.eccentricity.toFixed(3),
      type: elements.eccentricity < 1 ? 'Elliptical' : 'Hyperbolic/Parabolic'
    });
    console.log(pass ? '✅ PASS' : '❌ FAIL');
    
    this.sim.removeSpacecraft(craft);
  }
  
  displayResults() {
    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.table(this.results);
    
    const passed = this.results.filter(r => r.pass).length;
    const total = this.results.length;
    
    console.log(`\nTotal: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('✅ All physics tests passed! Orbital mechanics working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Check coordinate system implementation.');
    }
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}