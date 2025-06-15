# 🌌 Interplanetary Simulation

A realistic, web-based solar system simulation with spacecraft mission planning capabilities. Built with Three.js and real astronomical data.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-2.1.0-green.svg)
![Three.js](https://img.shields.io/badge/three.js-r177-orange.svg)

## 🎥 Demo

[Live Demo](#) | [Video Walkthrough](#) | [Screenshots](#)

## ✨ Features

### Current Features ✅
- **Accurate Solar System Model**
  - Real planetary positions using NASA JPL ephemeris data
  - SPICE-precision constants for all planetary bodies
  - Logarithmic scaling for visual clarity
  - Realistic orbital mechanics
  - Planet rotation and axial tilts

- **Advanced Spacecraft System**
  - Enhanced spacecraft with full systems simulation:
    - Power generation and battery management
    - Thermal control with radiators
    - Communications with realistic data rates
    - Propulsion with fuel consumption
    - Attitude control (RCS and reaction wheels)
  - Real physics simulation with gravitational calculations
  - Trajectory visualization with persistent trails
  - Factory pattern for easy spacecraft creation

- **Trajectory Planning System**
  - Interactive trajectory planner interface
  - Hohmann transfers with delta-v calculations
  - Direct and gravity assist trajectories
  - Fuel requirement estimates
  - Launch window calculations
  - 3D trajectory preview

- **Manoeuvre Planning System**
  - Add manoeuvre nodes to plan burns
  - Real-time trajectory preview
  - Delta-V calculations with fuel requirements
  - Burn duration estimates
  - Visual node markers in 3D space

- **Time Control System**
  - Variable time acceleration (real-time to 100,000x)
  - Pause/resume functionality
  - Jump to specific dates
  - Mission elapsed time tracking

- **Visual Features**
  - Dynamic Level of Detail (LOD) for performance
  - Atmospheric effects on terrestrial planets
  - Saturn's rings
  - 10,000+ background stars
  - Orbit line toggling
  - Enhanced spacecraft visuals with solar panels, antennas, and status lights

- **User Interface**
  - Click-to-select planets and spacecraft
  - Real-time telemetry display
  - Advanced spacecraft control panel
  - Mission control panel with presets
  - Keyboard shortcuts
  - Mobile touch support

## 🚀 Quick Start

### Prerequisites
- Node.js (v20+ recommended, v22 also supported)
- npm or yarn
- Modern web browser with WebGL support (Chrome recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/Zyzzbarth333/interplanetary-sim.git
cd interplanetary-sim

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Development Options

#### Local Development (Recommended)
```cmd
# Use Command Prompt (not PowerShell)
cd C:\Users\[YourUser]\interplanetary-sim
npm install
npm run dev
```

#### DevContainer Development
1. Install VS Code Remote - Containers extension
2. Open project in VS Code
3. F1 → "Dev Containers: Reopen in Container"
4. Wait for container to build
5. Terminal will open inside container
6. Run `npm install` and `npm run dev`

#### WSL Development
```bash
# In WSL Ubuntu
cd ~/projects
git clone https://github.com/Zyzzbarth333/interplanetary-sim.git
cd interplanetary-sim
npm install
npm run dev
```

### Basic Usage

1. **Navigation**
   - Left click + drag: Rotate view
   - Right click + drag: Pan
   - Scroll: Zoom in/out
   - Click planets: Focus and select

2. **Keyboard Controls**
   - `Space`: Pause/Resume
   - `+/-`: Speed up/down time
   - `1-9`: Launch preset missions
   - `H`: Show help
   - `O`: Toggle orbits
   - `L`: Toggle labels
   - `M`: Mission control panel
   - `N`: Add manoeuvre node (with spacecraft selected)
   - `A`: Cycle attitude mode
   - `F`: Fullscreen
   - `P`: Screenshot
   - `B`: Trajectory planner
   - `T`: Cycle time display format

3. **Launching Spacecraft**
   - Press `1-9` for preset missions
   - Or use Mission Control panel (`M`)
   - Or use Trajectory Planner (`B`)
   - Click spacecraft to track and control

## 🏗️ Architecture

```
interplanetary-sim/
├── src/
│   ├── simulation/
│   │   ├── SolarSystem.js         # Main simulation controller
│   │   ├── CelestialBody.js       # Planet/moon representation
│   │   ├── TimeController.js      # Time management system
│   │   ├── OrbitalMechanics.js    # Physics calculations
│   │   ├── PhysicsTest.js         # Physics validation suite
│   │   ├── spacecraft/
│   │   │   ├── EnhancedSpacecraft.js  # Advanced spacecraft
│   │   │   ├── SpacecraftSystems.js   # Realistic subsystems
│   │   │   └── ManoeuvreNode.js      # Manoeuvre planning
│   │   └── trajectory/
│   │       └── TrajectoryPlanner.js   # Mission planning tools
│   ├── ui/
│   │   └── SpacecraftControlPanel.js  # Advanced controls
│   ├── utils/
│   │   └── constants.js           # SPICE-precision constants
│   ├── main.js                    # Application entry point
│   └── style.css                  # UI styling
├── public/                        # Static assets
├── .devcontainer/                 # DevContainer configuration
│   ├── devcontainer.json         
│   └── Dockerfile                
├── index.html                     # Entry HTML
├── vite.config.js                # Vite configuration
└── package.json                  # Project dependencies
```

### Key Technologies
- **Three.js r177**: 3D graphics and rendering
- **Astronomy Engine**: Accurate ephemeris calculations
- **Vite 5.4**: Build tool and dev server
- **CSS3**: Modern UI with animations
- **ES6 Modules**: Clean code organization

## 📚 API Documentation

### Launching Spacecraft
```javascript
// Launch spacecraft with enhanced systems
const spacecraft = simulation.launchSpacecraft(
  'Mission-Name',
  'earth',              // Launch from
  new THREE.Vector3(0, 3.6, 0)  // Delta-V (km/s)
);

// Add manoeuvre nodes
const node = spacecraft.addManoeuvreNode(86400); // 1 day from now
node.setDeltaV(0, 2, 0); // 2 km/s prograde burn

// Control spacecraft systems
spacecraft.systems.attitude.mode = 'PROGRADE';
spacecraft.systems.power.consumers.instruments = 500; // Watts
```

### Time Control
```javascript
// Set specific date
simulation.timeController.setDate(new Date('2025-12-25'));

// Change time scale
simulation.timeController.setPresetSpeed('day'); // 1 day/second
simulation.timeController.setTimeScale(100);     // Custom scale

// Pause/resume
simulation.timeController.togglePause();
```

### Camera Control
```javascript
// Focus on objects
simulation.focusOnBody(simulation.bodies.get('mars'));
simulation.focusOnSpacecraft(spacecraft);

// Take screenshot
simulation.takeScreenshot();
```

## 📈 Performance

### Optimization Techniques
- Level of Detail (LOD) for distant objects
- Orbit line culling based on camera distance
- Efficient trajectory point management
- WebGL state caching
- RequestAnimationFrame throttling
- Vite dependency pre-bundling

### Benchmarks
- 60 FPS with 9 planets + 10 spacecraft
- < 150MB memory usage
- 2ms physics calculations per frame
- Works on mobile devices

## 🧪 Testing

```javascript
// Run physics validation tests in console
const test = new PhysicsTest(simulation);
test.runAllTests();
```

Tests include:
- Circular orbit stability
- Hohmann transfer accuracy
- Energy conservation
- Escape velocity calculations

## 🐛 Known Issues

- [ ] Three.js warning about multiple instances (harmless)
- [ ] Initial load time in DevContainer can be slow
- [ ] Edge browser may have stricter security for DevContainers (use Chrome)
- [ ] Touch controls need improvement on small screens

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- ES6+ JavaScript
- Meaningful variable names
- JSDoc comments for public methods
- Consistent formatting

## 📜 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- NASA JPL for ephemeris data and SPICE toolkit
- Three.js community for excellent documentation
- Astronomy Engine for accurate calculations
- KSP for inspiration

## 📞 Contact

- GitHub Issues: [Report bugs or request features](https://github.com/Zyzzbarth333/interplanetary-sim/issues)
- GitHub: [@Zyzzbarth333](https://github.com/Zyzzbarth333)

---

Made with 🚀 by Zyzzbarth333

*"The cosmos is within us. We are made of star-stuff." - Carl Sagan*