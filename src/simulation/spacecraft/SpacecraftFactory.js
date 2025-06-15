// src/simulation/spacecraft/SpacecraftFactory.js
import { BaseSpacecraft } from './BaseSpacecraft.js';
import * as THREE from 'three';

/**
 * Factory for creating different types of spacecraft
 */
export class SpacecraftFactory {
  /**
   * Create a basic spacecraft (lightweight, no complex systems)
   */
  static createBasic(name, initialState = {}) {
    return new BaseSpacecraft(name, initialState, {
      type: 'basic'
    });
  }
  
  /**
   * Create an enhanced spacecraft with full systems
   */
  static createEnhanced(name, initialState = {}, systemConfig = {}) {
    const defaultSystemConfig = {
      fuel: 500,
      oxidizer: 800,
      solarPanelArea: 30,
      batteryCapacity: 100,
      rcsFuel: 50,
      dishDiameter: 2,
      mainEngineType: 'CHEMICAL',
      isp: 350,
      thrust: 50000,
      ignitions: 10,
      xenon: 100
    };
    
    return new BaseSpacecraft(name, initialState, {
      type: 'enhanced',
      systems: true,
      systemConfig: { ...defaultSystemConfig, ...systemConfig }
    });
  }
  
  /**
   * Create spacecraft from a preset configuration
   */
  static createFromPreset(preset, name = null) {
    const presets = {
      probe: {
        type: 'basic',
        mass: 500,
        fuelMass: 200,
        exhaustVelocity: 3000,
        thrustPower: 5000
      },
      
      orbiter: {
        type: 'enhanced',
        mass: 2000,
        systemConfig: {
          fuel: 1000,
          oxidizer: 1600,
          solarPanelArea: 50,
          batteryCapacity: 150,
          dishDiameter: 3
        }
      },
      
      lander: {
        type: 'enhanced',
        mass: 5000,
        systemConfig: {
          fuel: 2000,
          oxidizer: 3200,
          solarPanelArea: 20,
          batteryCapacity: 200,
          rcsFuel: 100,
          thrust: 100000,
          ignitions: 50
        }
      },
      
      ionCraft: {
        type: 'enhanced',
        mass: 1500,
        systemConfig: {
          fuel: 100,
          oxidizer: 160,
          xenon: 300,
          solarPanelArea: 100,
          batteryCapacity: 300,
          mainEngineType: 'ION',
          isp: 3000,
          thrust: 90
        }
      }
    };
    
    const config = presets[preset];
    if (!config) {
      throw new Error(`Unknown spacecraft preset: ${preset}`);
    }
    
    const spacecraftName = name || `${preset.toUpperCase()}-${Date.now().toString(36)}`;
    
    if (config.type === 'basic') {
      return this.createBasic(spacecraftName, config);
    } else {
      return this.createEnhanced(spacecraftName, 
        { mass: config.mass },
        config.systemConfig
      );
    }
  }
  
  /**
   * Create a spacecraft optimised for a specific mission
   */
  static createForMission(missionType, departure, arrival) {
    const missionConfigs = {
      mars: {
        name: 'Mars Explorer',
        type: 'enhanced',
        systemConfig: {
          fuel: 1500,
          oxidizer: 2400,
          solarPanelArea: 40,
          batteryCapacity: 120,
          dishDiameter: 2.5
        }
      },
      
      venus: {
        name: 'Venus Observer',
        type: 'enhanced',
        systemConfig: {
          fuel: 800,
          oxidizer: 1280,
          solarPanelArea: 60, // More power near sun
          batteryCapacity: 100,
          thermalRadiatorArea: 20 // Extra cooling
        }
      },
      
      outerPlanets: {
        name: 'Deep Space Explorer',
        type: 'enhanced',
        systemConfig: {
          fuel: 2500,
          oxidizer: 4000,
          xenon: 500, // Ion propulsion backup
          solarPanelArea: 150, // Large panels for distant sun
          batteryCapacity: 500, // Large battery for eclipses
          dishDiameter: 4 // High-gain antenna
        }
      },
      
      asteroid: {
        name: 'Asteroid Prospector',
        type: 'enhanced',
        systemConfig: {
          fuel: 600,
          oxidizer: 960,
          rcsFuel: 100, // Extra RCS for proximity ops
          solarPanelArea: 35,
          batteryCapacity: 80,
          ignitions: 100 // Many small burns
        }
      }
    };
    
    const config = missionConfigs[missionType] || missionConfigs.mars;
    const name = `${config.name}-${Date.now().toString(36).toUpperCase()}`;
    
    return this.createEnhanced(name, {}, config.systemConfig);
  }
}

/**
 * Backwards compatibility exports
 */
export const Spacecraft = BaseSpacecraft; // For legacy code
export const EnhancedSpacecraft = BaseSpacecraft; // For legacy code

// Export factory method for SolarSystem.js compatibility
export function createSpacecraft(name, initialState, config) {
  if (config && (config.systems || config.type === 'enhanced')) {
    return SpacecraftFactory.createEnhanced(name, initialState, config.systemConfig);
  }
  return SpacecraftFactory.createBasic(name, initialState);
}