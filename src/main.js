// src/main.js
import './style.css';
import { SolarSystem } from './simulation/SolarSystem.js';
import * as THREE from 'three';
import { DELTA_V, TRANSFER_TIMES, SYNODIC_PERIODS } from './utils/constants.js';
import { PhysicsTest } from './simulation/PhysicsTest.js';
import { OrbitalMechanics } from './simulation/OrbitalMechanics.js';
import { SpacecraftFactory } from './simulation/spacecraft/SpacecraftFactory.js';

/* ===================================
   MISSION PRESETS
   Pre-configured spacecraft launch scenarios
   =================================== */

const MISSION_PRESETS = {
  // Earth missions
  earthEscape: {
    name: 'Explorer-1',
    from: 'earth',
    deltaV: () => new THREE.Vector3(8, 0, 0.5),
    description: 'Earth escape trajectory - explore outer solar system'
  },
  
  marsTransfer: {
    name: 'Mars Pathfinder',
    from: 'earth',
    deltaV: () => new THREE.Vector3(DELTA_V.earthToMars, 0, 0.2),
    description: 'Hohmann transfer to Mars - 8.5 month journey'
  },
  
  venusTransfer: {
    name: 'Venus Express',
    from: 'earth',
    deltaV: () => new THREE.Vector3(-DELTA_V.earthToVenus, 0, -0.3),
    description: 'Venus transfer orbit - 5 month journey'
  },
  
  solarEscape: {
    name: 'Interstellar Pioneer',
    from: 'earth',
    deltaV: () => new THREE.Vector3(DELTA_V.solarEscape - 30, 0, 5),
    description: 'Solar system escape velocity - journey to the stars'
  },
  
  mercuryDive: {
    name: 'Mercury Messenger',
    from: 'earth',
    deltaV: () => new THREE.Vector3(-8, 0, -1),
    description: 'Deep inner system trajectory - Mercury flyby'
  },
  
  // Mars missions
  marsReturn: {
    name: 'Mars Return Vehicle',
    from: 'mars',
    deltaV: () => new THREE.Vector3(-DELTA_V.marsOrbitToEscape, 0, 0),
    description: 'Return trajectory from Mars to Earth'
  },
  
  marsEscape: {
    name: 'Mars Explorer',
    from: 'mars',
    deltaV: () => new THREE.Vector3(3, 0, 1),
    description: 'Mars escape to explore asteroid belt'
  },
  
  // Advanced missions
  jupiterFlyby: {
    name: 'Jupiter Gravity Assist',
    from: 'earth',
    deltaV: () => new THREE.Vector3(9, 0, 2),
    description: 'Jupiter flyby for outer planet exploration'
  },
  
  retrogradeOrbit: {
    name: 'Solar Observer',
    from: 'earth',
    deltaV: () => new THREE.Vector3(0, 0, -15),
    description: 'Retrograde solar orbit for unique observations'
  }
};

/* ===================================
   APPLICATION CLASS
   Main application controller
   =================================== */

class InterplanetarySimulationApp {
  constructor() {
    this.simulation = null;
    this.container = null;
    this.isLoading = true;
    this.missionQueue = [];
    
    this.init();
  }
  
  async init() {
    try {
      // Show loading screen
      this.showLoadingScreen();
      
      // Get container
      this.container = document.getElementById('app');
      if (!this.container) {
        throw new Error('App container not found');
      }
      
      // Create simulation
      this.simulation = new SolarSystem(this.container);
      
      // Expose to window for debugging
      window.simulation = this.simulation;
      window.app = this;
      window.PhysicsTest = PhysicsTest;
      window.OrbitalMechanics = OrbitalMechanics;
      window.SpacecraftFactory = SpacecraftFactory;
      
      // Setup controls
      this.setupKeyboardControls();
      this.setupMissionLauncher();
      
      // Hide loading screen
      await this.hideLoadingScreen();
      
      // Show welcome message
      this.showWelcomeMessage();
      
      // Log startup info
      this.logStartupInfo();
      
    } catch (error) {
      console.error('Failed to initialize simulation:', error);
      this.showErrorScreen(error.message);
    }
  }
  
  /* ===================================
     UI SCREENS
     =================================== */
  
  showLoadingScreen() {
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'loading-screen';
    loadingScreen.className = 'loading-screen';
    loadingScreen.innerHTML = `
      <div class="loading-content">
        <h1>🌌 Interplanetary Simulation</h1>
        <div class="loading-spinner"></div>
        <p>Initializing solar system...</p>
        <div class="loading-progress">
          <div class="loading-bar"></div>
        </div>
      </div>
    `;
    
    document.body.appendChild(loadingScreen);
    
    // Animate progress bar
    setTimeout(() => {
      const bar = loadingScreen.querySelector('.loading-bar');
      if (bar) bar.style.width = '100%';
    }, 100);
  }
  
  async hideLoadingScreen() {
    // First hide the simple HTML loader
    const htmlLoader = document.getElementById('loading');
    if (htmlLoader) {
      htmlLoader.style.display = 'none';
    }
    
    const loadingScreen = document.getElementById('loading-screen');
    if (!loadingScreen) return;
    
    // Wait for assets to load
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Fade out
    loadingScreen.classList.add('fade-out');
    
    // Remove after animation
    setTimeout(() => loadingScreen.remove(), 500);
    
    this.isLoading = false;
  }
  
  showErrorScreen(message) {
    const errorScreen = document.createElement('div');
    errorScreen.className = 'error-screen';
    errorScreen.innerHTML = `
      <div class="error-content">
        <h1>⚠️ Initialization Error</h1>
        <p>${message}</p>
        <button onclick="location.reload()">Reload</button>
      </div>
    `;
    
    document.body.appendChild(errorScreen);
  }
  
  showWelcomeMessage() {
    const welcome = document.createElement('div');
    welcome.className = 'welcome-message fade-in';
    welcome.innerHTML = `
      <h2>Welcome to the Solar System</h2>
      <p>Press <kbd>H</kbd> for help • <kbd>1-9</kbd> to launch missions</p>
      <p>Click on planets to explore • Use mouse to navigate</p>
    `;
    
    document.body.appendChild(welcome);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      welcome.classList.add('fade-out');
      setTimeout(() => welcome.remove(), 500);
    }, 5000);
  }
  
  /* ===================================
     MISSION LAUNCHER
     =================================== */
  
  setupMissionLauncher() {
    // Create mission panel
    const missionPanel = document.createElement('div');
    missionPanel.className = 'mission-panel hidden';
    missionPanel.id = 'mission-panel';
    missionPanel.innerHTML = `
      <h3>🚀 Mission Control</h3>
      <div class="mission-list">
        ${Object.entries(MISSION_PRESETS).map(([key, mission], index) => `
          <div class="mission-item" data-mission="${key}">
            <div class="mission-number">${index + 1}</div>
            <div class="mission-details">
              <strong>${mission.name}</strong>
              <small>${mission.description}</small>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="mission-info">
        <p>Next Mars window: <span id="next-mars-window">Calculating...</span></p>
        <p>Next Venus window: <span id="next-venus-window">Calculating...</span></p>
      </div>
    `;
    
    document.body.appendChild(missionPanel);
    
    // Calculate launch windows
    this.updateLaunchWindows();
    
    // Add click handlers
    missionPanel.querySelectorAll('.mission-item').forEach(item => {
      item.addEventListener('click', () => {
        const missionKey = item.dataset.mission;
        this.launchMission(missionKey);
      });
    });
  }
  
  updateLaunchWindows() {
    // Calculate next launch windows
    const currentDate = this.simulation.timeController.currentDate;
    
    // Simplified calculation - would use proper synodic periods in reality
    const marsWindow = new Date(currentDate.getTime() + SYNODIC_PERIODS.earthMars * 86400000);
    const venusWindow = new Date(currentDate.getTime() + SYNODIC_PERIODS.earthVenus * 86400000);
    
    document.getElementById('next-mars-window').textContent = marsWindow.toLocaleDateString();
    document.getElementById('next-venus-window').textContent = venusWindow.toLocaleDateString();
  }
  
  launchMission(missionKey) {
    const preset = MISSION_PRESETS[missionKey];
    if (!preset) {
      console.error(`Unknown mission: ${missionKey}`);
      return;
    }
    
    // Check if launch body exists
    const launchBody = this.simulation.bodies.get(preset.from);
    if (!launchBody) {
      this.simulation.showNotification(`Cannot launch from ${preset.from} - body not found`);
      return;
    }
    
    // Generate unique mission name with timestamp
    const missionName = `${preset.name}-${Date.now().toString(36).toUpperCase()}`;
    
    // Launch spacecraft
    const spacecraft = this.simulation.launchSpacecraft(
      missionName,
      preset.from,
      preset.deltaV()
    );
    
    if (spacecraft) {
      // Log mission details
      console.log(`
╔════════════════════════════════════════════
║ MISSION LAUNCHED: ${missionName}
║ From: ${preset.from.toUpperCase()}
║ Type: ${preset.description}
║ Delta-V: ${preset.deltaV().length().toFixed(2)} km/s
║ Time: ${this.simulation.timeController.getFormattedDate('fulltime')}
╚════════════════════════════════════════════
      `.trim());
      
      // Add to mission history
      this.missionQueue.push({
        spacecraft,
        preset,
        launchTime: new Date(this.simulation.timeController.currentDate)
      });
    }
  }
  
  /* ===================================
     KEYBOARD CONTROLS
     =================================== */
  
  setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
      // Prevent conflicts with simulation controls
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      // Number keys for missions
      const numberKey = parseInt(e.key);
      if (numberKey >= 1 && numberKey <= 9) {
        e.preventDefault();
        const missionKeys = Object.keys(MISSION_PRESETS);
        if (numberKey <= missionKeys.length) {
          this.launchMission(missionKeys[numberKey - 1]);
        }
      }
      
      // Additional controls
      switch(e.key.toLowerCase()) {
        case 'm':
          // Toggle mission panel
          e.preventDefault();
          document.getElementById('mission-panel').classList.toggle('hidden');
          break;
          
        case 'p':
          // Take screenshot
          e.preventDefault();
          this.simulation.takeScreenshot();
          break;
          
        case 't':
          // Toggle time display format
          e.preventDefault();
          this.cycleTimeFormat();
          break;
          
        case 'g':
          // Toggle graphics quality
          e.preventDefault();
          this.toggleGraphicsQuality();
          break;
          
        case 'd':
          // Debug info
          if (e.shiftKey) {
            e.preventDefault();
            this.showDebugInfo();
          }
          break;
      }
    });
  }
  
  /* ===================================
     UTILITY METHODS
     =================================== */
  
  cycleTimeFormat() {
    // Cycle through different time display formats
    const formats = ['ISO', 'US', 'EU', 'julian', 'mission'];
    const currentFormat = this.simulation.timeController.currentFormat || 0;
    const nextFormat = (currentFormat + 1) % formats.length;
    
    this.simulation.timeController.currentFormat = nextFormat;
    this.simulation.showNotification(`Time format: ${formats[nextFormat]}`);
  }
  
  toggleGraphicsQuality() {
    // Toggle between quality presets
    const currentQuality = this.simulation.renderer.getPixelRatio();
    const newQuality = currentQuality > 1 ? 1 : window.devicePixelRatio;
    
    this.simulation.renderer.setPixelRatio(newQuality);
    this.simulation.showNotification(`Graphics: ${newQuality > 1 ? 'High' : 'Performance'}`);
  }
  
  showDebugInfo() {
    const info = {
      bodies: this.simulation.bodies.size,
      spacecraft: this.simulation.spacecraft.length,
      missions: this.missionQueue.length,
      time: this.simulation.timeController.getTimeInfo(),
      renderer: this.simulation.renderer.info
    };
    
    console.table(info);
    console.log('Full simulation object:', this.simulation);
  }
  
  logStartupInfo() {
    console.log(`
╔═══════════════════════════════════════════════════════════════
║ 🌌 INTERPLANETARY SIMULATION v2.0
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
║ 
║ KEYBOARD CONTROLS:
║   1-9 ......... Launch preset missions
║   M ........... Toggle mission control panel  
║   H ........... Toggle help
║   P ........... Take screenshot
║   F ........... Fullscreen
║   Space ....... Pause/Resume
║   +/- ......... Speed up/down
║   O ........... Toggle orbits
║   L ........... Toggle labels
║   
║ MOUSE CONTROLS:
║   Left click ... Select object
║   Drag ........ Rotate view
║   Scroll ...... Zoom in/out
║   
║ DEBUG:
║   Shift+D ..... Show debug info
║   
║ Ready for launch! 🚀
╚═══════════════════════════════════════════════════════════════
    `);
  }
}

/* ===================================
   APPLICATION STARTUP
   =================================== */

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new InterplanetarySimulationApp();
  });
} else {
  // DOM already loaded
  new InterplanetarySimulationApp();
}

// Handle uncaught errors gracefully
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
  
  // Show error notification if simulation exists
  if (window.simulation && window.simulation.showNotification) {
    window.simulation.showNotification('An error occurred - check console', 5000);
  }
});

// Prevent accidental navigation
window.addEventListener('beforeunload', (event) => {
  if (window.simulation && window.simulation.spacecraft.length > 0) {
    event.preventDefault();
    event.returnValue = 'Active missions will be lost. Leave anyway?';
  }
});