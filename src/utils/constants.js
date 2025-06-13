// src/utils/constants.js

/* ===================================
   PHYSICAL CONSTANTS
   =================================== */

// Fundamental Constants
export const G = 6.67430e-11;              // Gravitational constant (m³/kg·s²)
export const C = 299792458;                // Speed of light (m/s)

// Distance Conversions
export const AU_TO_METERS = 149597870700;  // 1 AU in meters
export const AU_TO_KM = 149597870.7;       // 1 AU in kilometers
export const EARTH_RADIUS_KM = 6371;       // Earth's mean radius
export const SOLAR_RADIUS_KM = 696340;     // Sun's radius

// Time Conversions
export const SECONDS_PER_MINUTE = 60;
export const SECONDS_PER_HOUR = 3600;
export const SECONDS_PER_DAY = 86400;
export const DAYS_PER_YEAR = 365.25;
export const SECONDS_PER_YEAR = 31557600;  // 365.25 * 86400

/* ===================================
   VISUALIZATION SETTINGS
   =================================== */

export const VISUAL_SETTINGS = {
  planetScale: 1,        // Planet size multiplier
  orbitScale: 1,         // Orbit size multiplier
  trailLength: 5000,     // Maximum trail points for spacecraft
  starCount: 10000,      // Background stars
  defaultFOV: 60,        // Camera field of view
};

/* ===================================
   SPACECRAFT PARAMETERS
   =================================== */

export const SPACECRAFT_DEFAULTS = {
  mass: 1000,            // kg
  fuelMass: 500,         // kg
  exhaustVelocity: 3000, // m/s (chemical rocket)
  thrustPower: 50000,    // N (50 kN)
};

// Common delta-v requirements (km/s)
export const DELTA_V = {
  earthOrbitToEscape: 3.2,
  earthToMars: 3.6,
  earthToVenus: 3.5,
  marsOrbitToEscape: 1.4,
  earthEscape: 11.2,
  solarEscape: 42.1,
};

/* ===================================
   CELESTIAL BODY DATA
   =================================== */

export const PLANETS = {
  sun: {
    name: 'Sun',
    radius: 696340,        // km
    mass: 1.989e30,        // kg
    color: 0xffff00,
    emissive: true,
    temperature: 5778,     // K (surface)
    rotationPeriod: 25.38, // days (at equator)
  },
  
  mercury: {
    name: 'Mercury',
    radius: 2439.7,        // km
    mass: 3.301e23,        // kg
    color: 0x8c7853,
    orbitalPeriod: 87.97,  // days
    rotationPeriod: 58.65, // days
    semiMajorAxis: 0.387,  // AU
    eccentricity: 0.206,
    inclination: 7.0,      // degrees
    atmospherePressure: 0, // Pa
  },
  
  venus: {
    name: 'Venus',
    radius: 6051.8,        // km
    mass: 4.867e24,        // kg
    color: 0xffc649,
    orbitalPeriod: 224.70, // days
    rotationPeriod: -243,  // days (retrograde)
    semiMajorAxis: 0.723,  // AU
    eccentricity: 0.007,
    inclination: 3.4,      // degrees
    atmospherePressure: 9.2e6, // Pa
  },
  
  earth: {
    name: 'Earth',
    radius: 6371,          // km
    mass: 5.972e24,        // kg
    color: 0x2233ff,
    orbitalPeriod: 365.25, // days
    rotationPeriod: 1,     // days
    semiMajorAxis: 1.000,  // AU
    eccentricity: 0.017,
    inclination: 0.0,      // degrees (reference)
    atmospherePressure: 101325, // Pa
  },
  
  mars: {
    name: 'Mars',
    radius: 3389.5,        // km
    mass: 6.417e23,        // kg
    color: 0xcd5c5c,
    orbitalPeriod: 686.98, // days
    rotationPeriod: 1.03,  // days
    semiMajorAxis: 1.524,  // AU
    eccentricity: 0.093,
    inclination: 1.9,      // degrees
    atmospherePressure: 610, // Pa
  },
  
  jupiter: {
    name: 'Jupiter',
    radius: 69911,         // km
    mass: 1.899e27,        // kg
    color: 0xdaa520,
    orbitalPeriod: 4332.59, // days
    rotationPeriod: 0.41,  // days
    semiMajorAxis: 5.203,  // AU
    eccentricity: 0.048,
    inclination: 1.3,      // degrees
    atmospherePressure: null, // No solid surface
  },
  
  saturn: {
    name: 'Saturn',
    radius: 58232,         // km
    mass: 5.685e26,        // kg
    color: 0xf4a460,
    orbitalPeriod: 10759.22, // days
    rotationPeriod: 0.45,  // days
    semiMajorAxis: 9.537,  // AU
    eccentricity: 0.054,
    inclination: 2.5,      // degrees
    atmospherePressure: null, // No solid surface
    hasRings: true,
  },
  
  uranus: {
    name: 'Uranus',
    radius: 25362,         // km
    mass: 8.682e25,        // kg
    color: 0x4fd1c5,
    orbitalPeriod: 30688.5, // days
    rotationPeriod: -0.72, // days (retrograde)
    semiMajorAxis: 19.191, // AU
    eccentricity: 0.047,
    inclination: 0.8,      // degrees
    atmospherePressure: null, // No solid surface
    axialTilt: 97.8,       // degrees
  },
  
  neptune: {
    name: 'Neptune',
    radius: 24622,         // km
    mass: 1.024e26,        // kg
    color: 0x4169e1,
    orbitalPeriod: 60182,  // days
    rotationPeriod: 0.67,  // days
    semiMajorAxis: 30.069, // AU
    eccentricity: 0.009,
    inclination: 1.8,      // degrees
    atmospherePressure: null, // No solid surface
  }
};

/* ===================================
   GRAVITATIONAL PARAMETERS (μ = GM)
   =================================== */

// More accurate than calculating G × mass separately
export const GRAVITATIONAL_PARAMETERS = {
  sun:     1.32712440018e20,  // m³/s²
  mercury: 2.2032e13,         // m³/s²
  venus:   3.257e14,          // m³/s²
  earth:   3.986004418e14,    // m³/s²
  mars:    4.282837e13,       // m³/s²
  jupiter: 1.26686534e17,     // m³/s²
  saturn:  3.7931187e16,      // m³/s²
  uranus:  5.793939e15,       // m³/s²
  neptune: 6.836529e15        // m³/s²
};

/* ===================================
   DERIVED CONSTANTS
   =================================== */

// Orbital velocities at planet distances (km/s)
export const ORBITAL_VELOCITIES = {
  mercury: 47.87,
  venus:   35.02,
  earth:   29.78,
  mars:    24.07,
  jupiter: 13.07,
  saturn:  9.69,
  uranus:  6.81,
  neptune: 5.43
};

// Escape velocities from planet surfaces (km/s)
export const ESCAPE_VELOCITIES = {
  mercury: 4.25,
  venus:   10.36,
  earth:   11.19,
  mars:    5.03,
  jupiter: 60.20,
  saturn:  36.09,
  uranus:  21.38,
  neptune: 23.56
};

/* ===================================
   MISSION PLANNING CONSTANTS
   =================================== */

// Typical launch windows (Earth days between opportunities)
export const SYNODIC_PERIODS = {
  earthMars:    779.9,  // ~26 months
  earthVenus:   583.9,  // ~19 months
  earthJupiter: 398.9,  // ~13 months
  earthSaturn:  378.1,  // ~12.5 months
};

// Hohmann transfer times (days)
export const TRANSFER_TIMES = {
  earthMars:    259,    // ~8.5 months
  earthVenus:   146,    // ~5 months
  earthJupiter: 997,    // ~2.7 years
  earthSaturn:  2208,   // ~6 years
};