// src/simulation/trajectory/TrajectoryPlanner.js
import * as THREE from 'three';
import { 
  AU_TO_KM, 
  GRAVITATIONAL_PARAMETERS,
  SECONDS_PER_DAY 
} from '../../utils/constants.js';

/**
 * Advanced trajectory planning system
 * Inspired by NASA's Trajectory Browser and KSP
 */
export class TrajectoryPlanner {
  constructor(simulation) {
    this.simulation = simulation;
    this.plannerPanel = null;
    
    // Current plan
    this.currentPlan = {
      departure: null,
      arrival: null,
      departureDate: null,
      arrivalDate: null,
      trajectory: null,
      deltaV: null,
      flybys: []
    };
    
    // Trajectory types
    this.trajectoryTypes = {
      HOHMANN: 'Hohmann Transfer',
      BIELLIPTIC: 'Bi-elliptic Transfer',
      GRAVITY_ASSIST: 'Gravity Assist',
      DIRECT: 'Direct Injection',
      BALLISTIC: 'Ballistic Capture'
    };
    
    this.createUI();
  }
  
  createUI() {
    this.plannerPanel = document.createElement('div');
    this.plannerPanel.className = 'trajectory-planner';
    this.plannerPanel.innerHTML = `
      <div class="planner-header">
        <h3>🚀 Trajectory Planner</h3>
        <button class="close-btn" id="close-planner">×</button>
      </div>
      
      <!-- Origin Selection -->
      <div class="planner-section">
        <h4>Departure</h4>
        <div class="orbit-selector">
          <select id="departure-body">
            <option value="earth">Earth</option>
            <option value="mars">Mars</option>
            <option value="venus">Venus</option>
            <option value="jupiter">Jupiter</option>
          </select>
          <div class="orbit-params">
            <label>Parking Orbit:</label>
            <input type="number" id="departure-altitude" value="200" min="0"> km
            <input type="number" id="departure-inclination" value="28.5" min="0" max="180"> deg
          </div>
        </div>
        <div class="date-selector">
          <label>Departure Date:</label>
          <input type="date" id="departure-date">
          <button id="find-window">Find Launch Window</button>
        </div>
      </div>
      
      <!-- Target Selection -->
      <div class="planner-section">
        <h4>Arrival</h4>
        <div class="orbit-selector">
          <select id="arrival-body">
            <option value="mars">Mars</option>
            <option value="venus">Venus</option>
            <option value="jupiter">Jupiter</option>
            <option value="saturn">Saturn</option>
            <option value="pluto">Pluto</option>
          </select>
          <div class="orbit-params">
            <label>Target Orbit:</label>
            <input type="number" id="arrival-altitude" value="400" min="0"> km
            <input type="number" id="arrival-inclination" value="0" min="0" max="180"> deg
          </div>
        </div>
      </div>
      
      <!-- Trajectory Type -->
      <div class="planner-section">
        <h4>Trajectory Type</h4>
        <select id="trajectory-type">
          <option value="HOHMANN">Hohmann Transfer (Minimum Energy)</option>
          <option value="DIRECT">Direct Transfer (Fast)</option>
          <option value="GRAVITY_ASSIST">Gravity Assist Route</option>
          <option value="BIELLIPTIC">Bi-elliptic (For High Orbits)</option>
        </select>
        
        <div id="gravity-assist-options" class="hidden">
          <label>Flyby Bodies:</label>
          <div class="flyby-list">
            <label><input type="checkbox" value="venus"> Venus</label>
            <label><input type="checkbox" value="earth"> Earth</label>
            <label><input type="checkbox" value="jupiter"> Jupiter</label>
          </div>
        </div>
      </div>
      
      <!-- Spacecraft Selection -->
      <div class="planner-section">
        <h4>Spacecraft</h4>
        <select id="spacecraft-type">
          <option value="chemical">Chemical Rocket (Isp: 450s)</option>
          <option value="ion">Ion Drive (Isp: 3000s)</option>
          <option value="nuclear">Nuclear Thermal (Isp: 900s)</option>
          <option value="solar-sail">Solar Sail</option>
          <option value="custom">Custom</option>
        </select>
        
        <div id="custom-spacecraft" class="hidden">
          <label>Dry Mass: <input type="number" id="dry-mass" value="1000"> kg</label>
          <label>Fuel Mass: <input type="number" id="fuel-mass" value="2000"> kg</label>
          <label>Isp: <input type="number" id="isp" value="450"> s</label>
        </div>
      </div>
      
      <!-- Calculate Button -->
      <div class="planner-controls">
        <button id="calculate-trajectory" class="primary-btn">Calculate Trajectory</button>
        <button id="optimize-trajectory" class="secondary-btn">Optimize</button>
      </div>
      
      <!-- Results -->
      <div id="trajectory-results" class="results-section hidden">
        <h4>Trajectory Analysis</h4>
        <div class="result-grid">
          <div class="result-item">
            <span class="label">Total ΔV:</span>
            <span id="total-deltav" class="value">-- km/s</span>
          </div>
          <div class="result-item">
            <span class="label">Flight Time:</span>
            <span id="flight-time" class="value">-- days</span>
          </div>
          <div class="result-item">
            <span class="label">Fuel Required:</span>
            <span id="fuel-required" class="value">-- kg</span>
          </div>
          <div class="result-item">
            <span class="label">Arrival Velocity:</span>
            <span id="arrival-velocity" class="value">-- km/s</span>
          </div>
        </div>
        
        <div class="maneuver-list">
          <h5>Maneuver Sequence</h5>
          <div id="maneuver-sequence"></div>
        </div>
        
        <div class="trajectory-actions">
          <button id="execute-trajectory" class="execute-btn">Execute Plan</button>
          <button id="save-trajectory" class="save-btn">Save</button>
          <button id="visualize-trajectory" class="viz-btn">3D Preview</button>
        </div>
      </div>
      
      <!-- Porkchop Plot -->
      <div id="porkchop-plot" class="plot-section hidden">
        <h4>Launch Window Analysis</h4>
        <canvas id="porkchop-canvas" width="400" height="300"></canvas>
        <div class="plot-legend">
          <span class="low-dv">Low ΔV</span>
          <span class="high-dv">High ΔV</span>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.plannerPanel);
    this.addStyles();
    this.setupEventListeners();
    this.hide();
  }
  
  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .trajectory-planner {
        position: fixed;
        left: 20px;
        top: 50%;
        transform: translateY(-50%);
        width: 450px;
        max-height: 90vh;
        background: rgba(0, 0, 0, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        overflow-y: auto;
        backdrop-filter: blur(10px);
        z-index: 1000;
      }
      
      .planner-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(0, 100, 255, 0.1);
      }
      
      .planner-section {
        padding: 15px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .planner-section h4 {
        margin: 0 0 10px 0;
        font-size: 14px;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.7);
      }
      
      .orbit-selector select {
        width: 100%;
        padding: 8px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        border-radius: 4px;
        margin-bottom: 10px;
      }
      
      .orbit-params {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 10px;
        align-items: center;
        font-size: 13px;
      }
      
      .orbit-params input {
        width: 80px;
        padding: 5px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        border-radius: 3px;
      }
      
      .date-selector {
        margin-top: 10px;
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 10px;
        align-items: center;
      }
      
      .date-selector input[type="date"] {
        padding: 5px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        border-radius: 3px;
      }
      
      #find-window {
        padding: 5px 10px;
        background: rgba(0, 255, 0, 0.2);
        border: 1px solid rgba(0, 255, 0, 0.5);
        color: white;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
      }
      
      .flyby-list {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 5px;
        margin-top: 10px;
      }
      
      .flyby-list label {
        display: flex;
        align-items: center;
        font-size: 13px;
      }
      
      .planner-controls {
        padding: 20px;
        display: flex;
        gap: 10px;
      }
      
      .primary-btn {
        flex: 1;
        padding: 10px;
        background: rgba(0, 100, 255, 0.3);
        border: 1px solid rgba(0, 100, 255, 0.5);
        color: white;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
      }
      
      .secondary-btn {
        padding: 10px 20px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        border-radius: 5px;
        cursor: pointer;
      }
      
      .results-section {
        padding: 20px;
        background: rgba(0, 255, 0, 0.05);
      }
      
      .result-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-bottom: 20px;
      }
      
      .result-item {
        display: flex;
        justify-content: space-between;
        font-size: 14px;
      }
      
      .result-item .label {
        color: rgba(255, 255, 255, 0.7);
      }
      
      .result-item .value {
        font-family: 'Consolas', monospace;
        color: #00ff00;
        font-weight: bold;
      }
      
      .maneuver-list {
        background: rgba(0, 0, 0, 0.3);
        padding: 15px;
        border-radius: 5px;
        margin-bottom: 15px;
      }
      
      .maneuver-list h5 {
        margin: 0 0 10px 0;
        font-size: 13px;
      }
      
      .maneuver-item {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 10px;
        padding: 8px;
        margin: 5px 0;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 3px;
        font-size: 12px;
      }
      
      .trajectory-actions {
        display: flex;
        gap: 10px;
      }
      
      .execute-btn {
        flex: 1;
        padding: 10px;
        background: rgba(0, 255, 0, 0.3);
        border: 1px solid rgba(0, 255, 0, 0.5);
        color: white;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
      }
      
      .save-btn, .viz-btn {
        padding: 10px 20px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        border-radius: 5px;
        cursor: pointer;
      }
      
      .plot-section {
        padding: 20px;
      }
      
      #porkchop-canvas {
        width: 100%;
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 5px;
      }
      
      .plot-legend {
        display: flex;
        justify-content: space-between;
        margin-top: 10px;
        font-size: 12px;
      }
      
      .low-dv {
        color: #00ff00;
      }
      
      .high-dv {
        color: #ff0000;
      }
      
      .hidden {
        display: none;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  setupEventListeners() {
    // Close button
    document.getElementById('close-planner').addEventListener('click', () => {
      this.hide();
    });
    
    // Trajectory type change
    document.getElementById('trajectory-type').addEventListener('change', (e) => {
      const gravityAssistOptions = document.getElementById('gravity-assist-options');
      gravityAssistOptions.classList.toggle('hidden', e.target.value !== 'GRAVITY_ASSIST');
    });
    
    // Spacecraft type change
    document.getElementById('spacecraft-type').addEventListener('change', (e) => {
      const customOptions = document.getElementById('custom-spacecraft');
      customOptions.classList.toggle('hidden', e.target.value !== 'custom');
    });
    
    // Calculate button
    document.getElementById('calculate-trajectory').addEventListener('click', () => {
      this.calculateTrajectory();
    });
    
    // Find launch window
    document.getElementById('find-window').addEventListener('click', () => {
      this.findLaunchWindow();
    });
    
    // Execute trajectory
    document.getElementById('execute-trajectory').addEventListener('click', () => {
      this.executeTrajectory();
    });
    
    // Visualize trajectory
    document.getElementById('visualize-trajectory').addEventListener('click', () => {
      this.visualizeTrajectory();
    });
    
    // Set default departure date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('departure-date').value = today;
  }
  
  show() {
    this.plannerPanel.style.display = 'block';
  }
  
  hide() {
    this.plannerPanel.style.display = 'none';
  }
  
  /**
   * Calculate trajectory based on selected parameters
   */
  async calculateTrajectory() {
    const departure = document.getElementById('departure-body').value;
    const arrival = document.getElementById('arrival-body').value;
    const trajectoryType = document.getElementById('trajectory-type').value;
    const departureDate = new Date(document.getElementById('departure-date').value);
    
    // Get orbit parameters
    const depAltitude = parseFloat(document.getElementById('departure-altitude').value);
    const arrAltitude = parseFloat(document.getElementById('arrival-altitude').value);
    
    // Calculate based on trajectory type
    let result;
    switch (trajectoryType) {
      case 'HOHMANN':
        result = this.calculateHohmannTransfer(departure, arrival, depAltitude, arrAltitude);
        break;
      case 'DIRECT':
        result = this.calculateDirectTransfer(departure, arrival, depAltitude, arrAltitude);
        break;
      case 'GRAVITY_ASSIST':
        result = await this.calculateGravityAssist(departure, arrival, depAltitude, arrAltitude);
        break;
      default:
        result = this.calculateHohmannTransfer(departure, arrival, depAltitude, arrAltitude);
    }
    
    // Store result
    this.currentPlan = {
      ...result,
      departure,
      arrival,
      departureDate,
      trajectoryType
    };
    
    // Display results
    this.displayResults(result);
  }
  
  /**
   * Calculate Hohmann transfer orbit
   */
  calculateHohmannTransfer(dep, arr, depAlt, arrAlt) {
    const depBody = this.simulation.bodies.get(dep);
    const arrBody = this.simulation.bodies.get(arr);
    
    if (!depBody || !arrBody) {
      console.error('Invalid bodies');
      return null;
    }
    
    // Get orbital radii
    const r1 = (depBody.data.semiMajorAxis || 1) * AU_TO_KM;
    const r2 = (arrBody.data.semiMajorAxis || 1.5) * AU_TO_KM;
    
    // Account for parking orbits
    const depRadius = (depBody.data.radius || 6371) + depAlt;
    const arrRadius = (arrBody.data.radius || 3390) + arrAlt;
    
    // Solar gravitational parameter
    const muSun = GRAVITATIONAL_PARAMETERS.sun / 1e9; // km³/s²
    
    // Hohmann calculations
    const a_transfer = (r1 + r2) / 2;
    const v1 = Math.sqrt(muSun / r1);
    const v_transfer_1 = Math.sqrt(muSun * (2/r1 - 1/a_transfer));
    const v_transfer_2 = Math.sqrt(muSun * (2/r2 - 1/a_transfer));
    const v2 = Math.sqrt(muSun / r2);
    
    // Delta-V requirements
    const dv_departure = Math.abs(v_transfer_1 - v1);
    const dv_arrival = Math.abs(v2 - v_transfer_2);
    
    // Add escape/capture velocities
    const muDep = GRAVITATIONAL_PARAMETERS[dep] / 1e9;
    const muArr = GRAVITATIONAL_PARAMETERS[arr] / 1e9;
    
    const v_escape = Math.sqrt(2 * muDep / depRadius);
    const v_capture = Math.sqrt(2 * muArr / arrRadius);
    
    const v_infinity_dep = dv_departure;
    const v_infinity_arr = dv_arrival;
    
    const dv_launch = Math.sqrt(v_escape * v_escape + v_infinity_dep * v_infinity_dep) - Math.sqrt(muDep / depRadius);
    const dv_capture_burn = Math.sqrt(v_capture * v_capture + v_infinity_arr * v_infinity_arr) - Math.sqrt(muArr / arrRadius);
    
    // Transfer time
    const transferTime = Math.PI * Math.sqrt(Math.pow(a_transfer, 3) / muSun) / SECONDS_PER_DAY;
    
    return {
      deltaV: {
        launch: dv_launch,
        arrival: dv_capture_burn,
        total: dv_launch + dv_capture_burn
      },
      transferTime: transferTime,
      maneuvers: [
        {
          time: 0,
          location: dep + ' orbit',
          deltaV: dv_launch,
          direction: 'Prograde'
        },
        {
          time: transferTime,
          location: arr + ' orbit',
          deltaV: dv_capture_burn,
          direction: 'Retrograde'
        }
      ]
    };
  }
  
  /**
   * Calculate direct high-energy transfer
   */
  calculateDirectTransfer(dep, arr, depAlt, arrAlt) {
    // Simplified - adds 30% more delta-v but 40% less time
    const hohmann = this.calculateHohmannTransfer(dep, arr, depAlt, arrAlt);
    
    return {
      deltaV: {
        launch: hohmann.deltaV.launch * 1.3,
        arrival: hohmann.deltaV.arrival * 1.3,
        total: hohmann.deltaV.total * 1.3
      },
      transferTime: hohmann.transferTime * 0.6,
      maneuvers: hohmann.maneuvers.map(m => ({
        ...m,
        deltaV: m.deltaV * 1.3
      }))
    };
  }
  
  /**
   * Calculate gravity assist trajectory
   */
  async calculateGravityAssist(dep, arr, depAlt, arrAlt) {
    // Get selected flyby bodies
    const flybyInputs = document.querySelectorAll('#gravity-assist-options input:checked');
    const flybys = Array.from(flybyInputs).map(input => input.value);
    
    if (flybys.length === 0) {
      // No flybys selected, use direct transfer
      return this.calculateHohmannTransfer(dep, arr, depAlt, arrAlt);
    }
    
    // Simplified gravity assist calculation
    // In reality, this would use Lambert solvers and patched conics
    const directTransfer = this.calculateHohmannTransfer(dep, arr, depAlt, arrAlt);
    
    // Each flyby reduces delta-v by ~20% but adds time
    const flybyReduction = Math.pow(0.8, flybys.length);
    const timeMultiplier = 1 + (flybys.length * 0.5);
    
    const maneuvers = [{
      time: 0,
      location: dep + ' orbit',
      deltaV: directTransfer.deltaV.launch * flybyReduction,
      direction: 'Prograde'
    }];
    
    // Add flyby maneuvers
    flybys.forEach((body, index) => {
      maneuvers.push({
        time: directTransfer.transferTime * 0.3 * (index + 1),
        location: body + ' flyby',
        deltaV: 0.5, // Small course correction
        direction: 'Variable'
      });
    });
    
    maneuvers.push({
      time: directTransfer.transferTime * timeMultiplier,
      location: arr + ' orbit',
      deltaV: directTransfer.deltaV.arrival * flybyReduction,
      direction: 'Retrograde'
    });
    
    return {
      deltaV: {
        launch: directTransfer.deltaV.launch * flybyReduction,
        arrival: directTransfer.deltaV.arrival * flybyReduction,
        total: directTransfer.deltaV.total * flybyReduction + (0.5 * flybys.length)
      },
      transferTime: directTransfer.transferTime * timeMultiplier,
      maneuvers: maneuvers,
      flybys: flybys
    };
  }
  
  /**
   * Display calculation results
   */
  displayResults(result) {
    if (!result) return;
    
    // Show results section
    document.getElementById('trajectory-results').classList.remove('hidden');
    
    // Update values
    document.getElementById('total-deltav').textContent = result.deltaV.total.toFixed(2) + ' km/s';
    document.getElementById('flight-time').textContent = result.transferTime.toFixed(0) + ' days';
    
    // Calculate fuel required
    const spacecraft = document.getElementById('spacecraft-type').value;
    const fuel = this.calculateFuelRequired(result.deltaV.total, spacecraft);
    document.getElementById('fuel-required').textContent = 
    isFinite(fuel) && fuel > 0 ? fuel.toFixed(0) + ' kg' : 'N/A';
    
    // Arrival velocity
    document.getElementById('arrival-velocity').textContent = result.deltaV.arrival.toFixed(2) + ' km/s';
    
    // Maneuver sequence
    const sequenceDiv = document.getElementById('maneuver-sequence');
    sequenceDiv.innerHTML = result.maneuvers.map((m, i) => `
      <div class="maneuver-item">
        <span>${i + 1}</span>
        <span>${m.location} - ${m.direction}</span>
        <span>${m.deltaV.toFixed(2)} km/s</span>
      </div>
    `).join('');
  }
  
  /**
   * Calculate fuel required using Tsiolkovsky equation
   */
  calculateFuelRequired(deltaV, spacecraftType) {
    let isp, dryMass;
    
    switch (spacecraftType) {
      case 'chemical':
        isp = 450;
        dryMass = 1000;
        break;
      case 'ion':
        isp = 3000;
        dryMass = 800;
        break;
      case 'nuclear':
        isp = 900;
        dryMass = 2000;
        break;
      case 'custom':
        isp = parseFloat(document.getElementById('isp').value);
        dryMass = parseFloat(document.getElementById('dry-mass').value);
        break;
      default:
        isp = 450;
        dryMass = 1000;
    }
    
    const exhaustVelocity = isp * 9.81 / 1000; // km/s
    const massRatio = Math.exp(deltaV / exhaustVelocity);
    
    // Add this check to prevent infinity
    if (!isFinite(massRatio) || massRatio <= 1) {
        return 0;
    }
    
    const fuelMass = dryMass * (massRatio - 1);
    return fuelMass;
    }
  
  /**
   * Find optimal launch window (simplified porkchop plot)
   */
  findLaunchWindow() {
    const departure = document.getElementById('departure-body').value;
    const arrival = document.getElementById('arrival-body').value;
    
    // Show porkchop plot section
    document.getElementById('porkchop-plot').classList.remove('hidden');
    
    // Generate porkchop data
    const canvas = document.getElementById('porkchop-canvas');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Generate grid of departure/arrival dates
    const startDate = new Date();
    const dayRange = 365; // Check 1 year
    const dayStep = 10; // Every 10 days
    
    const cellSize = canvas.width / (dayRange / dayStep);
    
    for (let depDay = 0; depDay < dayRange; depDay += dayStep) {
      for (let arrDay = depDay + 30; arrDay < dayRange; arrDay += dayStep) {
        // Simple approximation of delta-v based on synodic period
        const transferAngle = ((arrDay - depDay) / 365) * 360;
        const optimalAngle = 180; // Hohmann transfer
        const angleDiff = Math.abs(transferAngle - optimalAngle);
        
        // Color based on angle difference
        const quality = Math.max(0, 1 - angleDiff / 180);
        const r = Math.floor(255 * (1 - quality));
        const g = Math.floor(255 * quality);
        
        ctx.fillStyle = `rgb(${r}, ${g}, 0)`;
        ctx.fillRect(
          (depDay / dayRange) * canvas.width,
          (arrDay / dayRange) * canvas.height,
          cellSize,
          cellSize
        );
      }
    }
    
    // Add labels
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.fillText('Departure →', 10, canvas.height - 10);
    ctx.save();
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Arrival →', -canvas.height + 10, 20);
    ctx.restore();
  }
  
  /**
   * Execute the planned trajectory
   */
  executeTrajectory() {
    if (!this.currentPlan || !this.currentPlan.maneuvers) {
      alert('No trajectory calculated');
      return;
    }
    
    // Launch spacecraft
    const depBody = this.currentPlan.departure;
    const firstManeuver = this.currentPlan.maneuvers[0];
    
    // Create delta-v vector (simplified - assumes prograde)
    const deltaV = new THREE.Vector3(firstManeuver.deltaV, 0, 0);
    
    // Use enhanced spacecraft if available
    const spacecraftName = `Mission-${this.currentPlan.arrival.toUpperCase()}`;
    
    const spacecraft = this.simulation.launchSpacecraft(
      spacecraftName,
      depBody,
      deltaV
    );
    
    if (!spacecraft) {
      alert('Failed to launch spacecraft');
      return;
    }
    
    // Schedule remaining maneuvers
    this.currentPlan.maneuvers.slice(1).forEach(maneuver => {
    if (spacecraft.addManoeuvreNode) {
        const node = spacecraft.addManoeuvreNode(maneuver.time * SECONDS_PER_DAY);
        
        // Fix: Make sure deltaV is a Vector3
        let dvVector = new THREE.Vector3();
        switch (maneuver.direction) {
        case 'Retrograde':
            dvVector.set(0, -maneuver.deltaV, 0);
            break;
        case 'Prograde':
            dvVector.set(0, maneuver.deltaV, 0);
            break;
        default:
            dvVector.set(maneuver.deltaV, 0, 0);
        }
        
        node.setDeltaV(dvVector.x, dvVector.y, dvVector.z);
    }
    });
    
    // Close planner
    this.hide();
    
    // Focus on spacecraft
    this.simulation.focusOnSpacecraft(spacecraft);
    
    // Show notification
    this.simulation.showNotification(
      `Trajectory executed: ${spacecraftName} launched to ${this.currentPlan.arrival}!`
    );
  }
  
  /**
   * Visualize trajectory in 3D
   */
visualizeTrajectory() {
  if (!this.currentPlan) return;
  
  // Get bodies
  const depBody = this.simulation.bodies.get(this.currentPlan.departure);
  const arrBody = this.simulation.bodies.get(this.currentPlan.arrival);
  
  if (!depBody || !arrBody) return;
  
  // Calculate actual transfer orbit
  const points = [];
  const segments = 100;
  
  // Starting position (Earth now)
  const r1 = depBody.position.length(); // AU from Sun
  const startAngle = Math.atan2(depBody.position.z, depBody.position.x);
  
  // For Hohmann transfer, semi-major axis
  const r2 = arrBody.data.semiMajorAxis || 1.524; // Mars orbit radius
  const a = (r1 + r2) / 2; // Semi-major axis of transfer orbit
  
  // Transfer orbit parameters
  const e = Math.abs(r2 - r1) / (r2 + r1); // Eccentricity
  const p = a * (1 - e * e); // Semi-latus rectum
  
  // Generate transfer ellipse
  for (let i = 0; i <= segments; i++) {
    const transferAngle = (i / segments) * Math.PI; // 0 to 180 degrees
    const angle = startAngle + transferAngle;
    
    // Ellipse equation in polar coordinates
    const r = p / (1 + e * Math.cos(transferAngle));
    
    const point = new THREE.Vector3(
      r * Math.cos(angle),
      0, // Keep in ecliptic plane
      r * Math.sin(angle)
    );
    
    points.push(point);
  }
  
  // Create the trajectory line
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    opacity: 0.8,
    transparent: true,
    linewidth: 3
  });
  
  const trajectoryLine = new THREE.Line(geometry, material);
  trajectoryLine.name = 'TrajectoryPreview';
  
  // Also show where Mars WILL BE
  const transferTime = this.currentPlan.transferTime; // days
  const marsAngle = 2 * Math.PI * (transferTime / arrBody.data.orbitalPeriod);
  const futureAngle = Math.atan2(arrBody.position.z, arrBody.position.x) + marsAngle;
  
  // Mars future position indicator
  const markerGeometry = new THREE.SphereGeometry(0.05, 16, 16);
  const markerMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.5
  });
  const futureMarker = new THREE.Mesh(markerGeometry, markerMaterial);
  futureMarker.position.set(
    r2 * Math.cos(futureAngle),
    0,
    r2 * Math.sin(futureAngle)
  );
  
  // Remove old preview
  const oldPreview = this.simulation.scene.getObjectByName('TrajectoryPreview');
  if (oldPreview) this.simulation.scene.remove(oldPreview);
  
  const oldMarker = this.simulation.scene.getObjectByName('FutureMarsPosition');
  if (oldMarker) this.simulation.scene.remove(oldMarker);
  
  // Add new preview
  this.simulation.scene.add(trajectoryLine);
  futureMarker.name = 'FutureMarsPosition';
  this.simulation.scene.add(futureMarker);
  
  // Animate camera to show full trajectory
  const center = new THREE.Vector3(0, 0, 0); // Sun
  this.simulation.camera.position.set(0, 3, 3);
  this.simulation.controls.target.copy(center);
  this.simulation.controls.update();
}
}