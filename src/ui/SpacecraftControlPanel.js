// src/ui/SpacecraftControlPanel.js
import * as THREE from 'three';

/**
 * Advanced spacecraft control interface
 */
export class SpacecraftControlPanel {
  constructor(simulation) {
    this.simulation = simulation;
    this.selectedSpacecraft = null;
    this.panel = null;
    
    this.createPanel();
    this.hide();
  }
  
  createPanel() {
    this.panel = document.createElement('div');
    this.panel.className = 'spacecraft-control-panel';
    this.panel.innerHTML = `
      <div class="panel-header">
        <h3>🛸 <span id="spacecraft-name">No Spacecraft Selected</span></h3>
        <button class="close-btn" id="close-panel">×</button>
      </div>
      
      <!-- Mission Status -->
      <div class="panel-section">
        <h4>Mission Status</h4>
        <div class="status-grid">
          <div class="status-item">
            <span class="label">Phase:</span>
            <span id="mission-phase" class="value">--</span>
          </div>
          <div class="status-item">
            <span class="label">Time:</span>
            <span id="mission-elapsed" class="value">--</span>
          </div>
          <div class="status-item">
            <span class="label">Distance:</span>
            <span id="sun-distance" class="value">--</span>
          </div>
          <div class="status-item">
            <span class="label">Speed:</span>
            <span id="velocity" class="value">--</span>
          </div>
        </div>
      </div>
      
      <!-- Systems Status -->
      <div class="panel-section">
        <h4>Systems</h4>
        <div class="systems-grid">
          <!-- Power -->
          <div class="system-status">
            <div class="system-header">
              <span>⚡ Power</span>
              <span id="power-status" class="status-indicator">●</span>
            </div>
            <div class="progress-bar">
              <div id="battery-bar" class="progress-fill power"></div>
            </div>
            <div class="system-details">
              <span id="power-generation">--W</span> / 
              <span id="power-consumption">--W</span>
            </div>
          </div>
          
          <!-- Thermal -->
          <div class="system-status">
            <div class="system-header">
              <span>🌡️ Thermal</span>
              <span id="thermal-status" class="status-indicator">●</span>
            </div>
            <div class="temp-display">
              <span id="internal-temp">--°C</span>
            </div>
          </div>
          
          <!-- Communications -->
          <div class="system-status">
            <div class="system-header">
              <span>📡 Comms</span>
              <span id="comms-status" class="status-indicator">●</span>
            </div>
            <div class="comms-details">
              <div>Rate: <span id="data-rate">--</span></div>
              <div>Delay: <span id="signal-delay">--</span></div>
            </div>
          </div>
          
          <!-- Propulsion -->
          <div class="system-status">
            <div class="system-header">
              <span>🚀 Propulsion</span>
              <span id="prop-status" class="status-indicator">●</span>
            </div>
            <div class="fuel-display">
              <div>Fuel: <span id="main-fuel">--kg</span></div>
              <div>Ignitions: <span id="ignitions">--</span></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Attitude Control -->
      <div class="panel-section">
        <h4>Attitude Control</h4>
        <div class="attitude-controls">
          <select id="attitude-mode">
            <option value="INERTIAL">Inertial</option>
            <option value="PROGRADE">Prograde</option>
            <option value="RETROGRADE">Retrograde</option>
            <option value="RADIAL">Radial Out</option>
            <option value="NORMAL">Normal</option>
            <option value="SUN_POINTING">Sun Pointing</option>
          </select>
          <div class="attitude-status">
            <span>RCS: <span id="rcs-fuel">--kg</span></span>
            <span>Wheels: <span id="wheel-momentum">--%</span></span>
          </div>
        </div>
      </div>
      
      <!-- Manoeuvre Planning -->
      <div class="panel-section">
        <h4>Manoeuvre Planning</h4>
        <div class="manoeuvre-controls">
          <button id="add-node-btn" class="control-btn">+ Add Node</button>
          
          <div id="node-list" class="node-list"></div>
          
          <div id="node-editor" class="node-editor hidden">
            <h5>Node <span id="node-number">1</span></h5>
            <div class="node-timing">
              <label>Time from now:</label>
              <input type="number" id="node-time" value="86400" step="3600">
              <span>seconds</span>
            </div>
            <div class="deltaV-controls">
              <div class="deltaV-input">
                <label>Radial (R):</label>
                <input type="number" id="dv-radial" value="0" step="0.1">
                <span>km/s</span>
              </div>
              <div class="deltaV-input">
                <label>Prograde (S):</label>
                <input type="number" id="dv-prograde" value="0" step="0.1">
                <span>km/s</span>
              </div>
              <div class="deltaV-input">
                <label>Normal (W):</label>
                <input type="number" id="dv-normal" value="0" step="0.1">
                <span>km/s</span>
              </div>
            </div>
            <div class="node-info">
              <div>Total ΔV: <span id="total-dv">0.0</span> km/s</div>
              <div>Burn time: <span id="burn-time">0</span>s</div>
              <div>Fuel required: <span id="fuel-required">0</span> kg</div>
            </div>
            <div class="node-actions">
              <button id="update-node" class="control-btn small">Update</button>
              <button id="delete-node" class="control-btn small danger">Delete</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Warnings -->
      <div id="warnings-section" class="panel-section warnings hidden">
        <h4>⚠️ Warnings</h4>
        <ul id="warnings-list"></ul>
      </div>
    `;
    
    document.body.appendChild(this.panel);
    
    // Add styles
    this.addStyles();
    
    // Setup event listeners
    this.setupEventListeners();
  }
  
  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .spacecraft-control-panel {
        position: fixed;
        right: 20px;
        top: 50%;
        transform: translateY(-50%);
        width: 400px;
        max-height: 80vh;
        background: rgba(0, 0, 0, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        overflow-y: auto;
        backdrop-filter: blur(10px);
        z-index: 1000;
      }
      
      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .panel-header h3 {
        margin: 0;
        font-size: 18px;
      }
      
      .close-btn {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
      }
      
      .panel-section {
        padding: 15px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .panel-section h4 {
        margin: 0 0 10px 0;
        font-size: 14px;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.7);
      }
      
      .status-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      
      .status-item {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
      }
      
      .status-item .label {
        color: rgba(255, 255, 255, 0.6);
      }
      
      .status-item .value {
        font-family: 'Consolas', monospace;
      }
      
      .systems-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
      }
      
      .system-status {
        background: rgba(255, 255, 255, 0.05);
        padding: 10px;
        border-radius: 5px;
      }
      
      .system-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;
        font-size: 13px;
      }
      
      .status-indicator {
        font-size: 10px;
      }
      
      .status-indicator.green { color: #00ff00; }
      .status-indicator.yellow { color: #ffaa00; }
      .status-indicator.red { color: #ff0000; }
      
      .progress-bar {
        height: 4px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        overflow: hidden;
        margin: 5px 0;
      }
      
      .progress-fill {
        height: 100%;
        transition: width 0.3s ease;
      }
      
      .progress-fill.power { background: #00ff00; }
      
      .system-details, .comms-details, .fuel-display {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.7);
      }
      
      .attitude-controls select {
        width: 100%;
        padding: 5px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        border-radius: 3px;
        margin-bottom: 10px;
      }
      
      .attitude-status {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
      }
      
      .control-btn {
        background: rgba(0, 255, 0, 0.2);
        border: 1px solid rgba(0, 255, 0, 0.5);
        color: white;
        padding: 8px 15px;
        border-radius: 5px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .control-btn:hover {
        background: rgba(0, 255, 0, 0.3);
      }
      
      .control-btn.small {
        padding: 5px 10px;
        font-size: 12px;
      }
      
      .control-btn.danger {
        background: rgba(255, 0, 0, 0.2);
        border-color: rgba(255, 0, 0, 0.5);
      }
      
      .node-list {
        margin: 10px 0;
      }
      
      .node-item {
        background: rgba(255, 255, 255, 0.05);
        padding: 8px;
        margin: 5px 0;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
      }
      
      .node-item.active {
        background: rgba(0, 255, 255, 0.2);
        border: 1px solid rgba(0, 255, 255, 0.5);
      }
      
      .node-editor {
        background: rgba(255, 255, 255, 0.05);
        padding: 10px;
        border-radius: 5px;
        margin-top: 10px;
      }
      
      .node-editor h5 {
        margin: 0 0 10px 0;
      }
      
      .deltaV-controls {
        margin: 10px 0;
      }
      
      .deltaV-input {
        display: flex;
        align-items: center;
        margin: 5px 0;
        font-size: 12px;
      }
      
      .deltaV-input label {
        width: 100px;
      }
      
      .deltaV-input input {
        width: 80px;
        padding: 3px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        border-radius: 3px;
        margin: 0 5px;
      }
      
      .node-info {
        background: rgba(0, 0, 0, 0.3);
        padding: 8px;
        border-radius: 3px;
        font-size: 12px;
        margin: 10px 0;
      }
      
      .node-actions {
        display: flex;
        gap: 10px;
      }
      
      .warnings {
        background: rgba(255, 100, 0, 0.1);
        border: 1px solid rgba(255, 100, 0, 0.3);
      }
      
      .warnings ul {
        list-style: none;
        padding: 0;
        margin: 0;
        font-size: 12px;
      }
      
      .warnings li {
        padding: 5px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .warnings li:last-child {
        border-bottom: none;
      }
      
      .hidden {
        display: none;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  setupEventListeners() {
    // Close button
    document.getElementById('close-panel').addEventListener('click', () => {
      this.hide();
    });
    
    // Attitude mode
    document.getElementById('attitude-mode').addEventListener('change', (e) => {
      if (this.selectedSpacecraft && this.selectedSpacecraft.systems) {
        this.selectedSpacecraft.systems.attitude.mode = e.target.value;
      }
    });
    
    // Add manoeuvre node
    document.getElementById('add-node-btn').addEventListener('click', () => {
      this.addManoeuvreNode();
    });
    
    // Node editor controls
    ['dv-radial', 'dv-prograde', 'dv-normal'].forEach(id => {
      document.getElementById(id).addEventListener('input', () => {
        this.updateNodePreview();
      });
    });
    
    document.getElementById('update-node').addEventListener('click', () => {
      this.updateActiveNode();
    });
    
    document.getElementById('delete-node').addEventListener('click', () => {
      this.deleteActiveNode();
    });
  }
  
  show(spacecraft) {
    this.selectedSpacecraft = spacecraft;
    this.panel.style.display = 'block';
    
    // Start update loop
    this.updateInterval = setInterval(() => this.update(), 100);
  }
  
  hide() {
    this.panel.style.display = 'none';
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
  
  update() {
    if (!this.selectedSpacecraft) return;
    
    const info = this.selectedSpacecraft.getInfo();
    const systems = info.systems;
    
    // Update header
    document.getElementById('spacecraft-name').textContent = this.selectedSpacecraft.name;
    
    // Mission status
    document.getElementById('mission-phase').textContent = info.phase;
    document.getElementById('mission-elapsed').textContent = `${info.missionTime} days`;
    document.getElementById('sun-distance').textContent = `${info.position} AU`;
    document.getElementById('velocity').textContent = `${info.speed} km/s`;
    
    // Power system
    const batteryPercent = parseFloat(systems.power.batteryPercent);
    document.getElementById('battery-bar').style.width = batteryPercent + '%';
    document.getElementById('power-generation').textContent = systems.power.generation;
    document.getElementById('power-consumption').textContent = systems.power.consumption;
    
    const powerStatus = document.getElementById('power-status');
    if (batteryPercent > 50) {
      powerStatus.className = 'status-indicator green';
    } else if (batteryPercent > 20) {
      powerStatus.className = 'status-indicator yellow';
    } else {
      powerStatus.className = 'status-indicator red';
    }
    
    // Thermal
    document.getElementById('internal-temp').textContent = systems.thermal.internal + '°C';
    const thermalStatus = document.getElementById('thermal-status');
    thermalStatus.className = systems.thermal.status === 'NOMINAL' ? 
      'status-indicator green' : 'status-indicator yellow';
    
    // Communications
    document.getElementById('data-rate').textContent = systems.comms.dataRate;
    document.getElementById('signal-delay').textContent = systems.comms.delay;
    document.getElementById('comms-status').className = 'status-indicator green';
    
    // Propulsion
    document.getElementById('main-fuel').textContent = systems.propulsion.mainFuel;
    document.getElementById('ignitions').textContent = systems.propulsion.ignitions;
    
    // Attitude
    document.getElementById('rcs-fuel').textContent = systems.attitude.rcsFuel;
    document.getElementById('wheel-momentum').textContent = systems.attitude.wheelMomentum + '%';
    
    // Update manoeuvre nodes
    this.updateNodeList();
    
    // Warnings
    this.updateWarnings();
  }
  
  updateNodeList() {
    const nodeList = document.getElementById('node-list');
    
    if (!this.selectedSpacecraft.manoeuvreNodes) {
      nodeList.innerHTML = '<p style="font-size: 12px; color: #666;">No manoeuvre capability</p>';
      return;
    }
    
    const nodes = this.selectedSpacecraft.manoeuvreNodes;
    
    if (nodes.length === 0) {
      nodeList.innerHTML = '<p style="font-size: 12px; color: #666;">No nodes planned</p>';
      return;
    }
    
    nodeList.innerHTML = nodes.map((node, index) => `
      <div class="node-item ${this.activeNode === node ? 'active' : ''}" data-index="${index}">
        Node ${index + 1}: ${(node.timeFromNow / 86400).toFixed(1)} days
        (${node.deltaV.length().toFixed(2)} km/s)
      </div>
    `).join('');
    
    // Add click handlers
    nodeList.querySelectorAll('.node-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index);
        this.selectNode(nodes[index]);
      });
    });
  }
  
  addManoeuvreNode() {
    if (!this.selectedSpacecraft.addManoeuvreNode) {
      alert('This spacecraft does not support manoeuvre planning');
      return;
    }
    
    const node = this.selectedSpacecraft.addManoeuvreNode(86400); // 1 day from now
    this.selectNode(node);
    
    // Add to scene
    if (node.nodeMarker) {
      this.simulation.scene.add(node.nodeMarker);
    }
    if (node.trajectoryPreview) {
      this.simulation.scene.add(node.trajectoryPreview);
    }
  }
  
  selectNode(node) {
    this.activeNode = node;
    document.getElementById('node-editor').classList.remove('hidden');
    
    // Update editor values
    document.getElementById('node-time').value = node.timeFromNow;
    document.getElementById('dv-radial').value = node.deltaV.x;
    document.getElementById('dv-prograde').value = node.deltaV.y;
    document.getElementById('dv-normal').value = node.deltaV.z;
    
    this.updateNodePreview();
  }
  
  updateNodePreview() {
    if (!this.activeNode) return;
    
    const radial = parseFloat(document.getElementById('dv-radial').value) || 0;
    const prograde = parseFloat(document.getElementById('dv-prograde').value) || 0;
    const normal = parseFloat(document.getElementById('dv-normal').value) || 0;
    
    const totalDV = Math.sqrt(radial*radial + prograde*prograde + normal*normal);
    
    document.getElementById('total-dv').textContent = totalDV.toFixed(2);
    
    // Temporary update for preview
    this.activeNode.setDeltaV(radial, prograde, normal);
    
    document.getElementById('burn-time').textContent = this.activeNode.burnDuration.toFixed(1);
    document.getElementById('fuel-required').textContent = this.activeNode.fuelRequired.toFixed(1);
  }
  
  updateActiveNode() {
    if (!this.activeNode) return;
    
    const radial = parseFloat(document.getElementById('dv-radial').value) || 0;
    const prograde = parseFloat(document.getElementById('dv-prograde').value) || 0;
    const normal = parseFloat(document.getElementById('dv-normal').value) || 0;
    const time = parseFloat(document.getElementById('node-time').value) || 86400;
    
    this.activeNode.timeFromNow = time;
    this.activeNode.setDeltaV(radial, prograde, normal);
  }
  
  deleteActiveNode() {
    if (!this.activeNode) return;
    
    this.selectedSpacecraft.removeManoeuvreNode(this.activeNode);
    this.activeNode = null;
    
    document.getElementById('node-editor').classList.add('hidden');
  }
  
  updateWarnings() {
    const warnings = this.selectedSpacecraft.systems.checkSystemConstraints();
    const section = document.getElementById('warnings-section');
    const list = document.getElementById('warnings-list');
    
    if (warnings.length === 0) {
      section.classList.add('hidden');
      return;
    }
    
    section.classList.remove('hidden');
    list.innerHTML = warnings.map(w => `<li>${w}</li>`).join('');
  }
}