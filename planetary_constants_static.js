// NASA/JPL SPICE Planetary Constants - Static Values Only
// No time-dependent coefficients included

export const CONSTANTS = {
  AU_TO_KM: 149597870.7,
  SPEED_OF_LIGHT_KM_S: 299792.458,
  GRAVITATIONAL_CONSTANT: 6.67430e-11, // m³/kg/s²
  SOLAR_CONSTANT: 1361.0, // W/m² at 1 AU
};

export const MERCURY_STATIC = {
  name: "Mercury",
  radius: {
    equatorial: 2440.53,
    polar: 2438.26,
    mean: 2439.773333333334,
    flattening: 0.0009301258333230822
  },
  gm: 22031.8685514, // km³/s²
  mass: 3.301000636980658e+23, // kg
  rotationPeriod: 58.64614590235795, // days
  axialTilt: 28.5845, // degrees
};

export const VENUS_STATIC = {
  name: "Venus",
  radius: {
    equatorial: 6051.8,
    polar: 6051.8,
    mean: 6051.8,
    flattening: 0
  },
  gm: 324858.592, // km³/s²
  mass: 4.867305814842006e+24, // kg
  rotationPeriod: 243.0184839858919, // days
  axialTilt: 22.84, // degrees
};

export const EARTH_STATIC = {
  name: "Earth",
  radius: {
    equatorial: 6378.1366,
    polar: 6356.7519,
    mean: 6371.008366666666,
    flattening: 0.003352813108455472
  },
  gm: 398600.4355070226, // km³/s²
  mass: 5.972168399787583e+24, // kg
  rotationPeriod: 0.997269632262793, // days
  axialTilt: 0, // degrees
};

export const MARS_STATIC = {
  name: "Mars",
  radius: {
    equatorial: 3396.19,
    polar: 3376.2,
    mean: 3389.526666666667,
    flattening: 0.005886007555525526
  },
  gm: 42828.37362069909, // km³/s²
  mass: 6.416908682663213e+23, // kg
  rotationPeriod: 1.02595675596029, // days
  axialTilt: 35.567484, // degrees
};

export const JUPITER_STATIC = {
  name: "Jupiter",
  radius: {
    equatorial: 71492,
    polar: 66854,
    mean: 69946,
    flattening: 0.0648743915403122
  },
  gm: 126686531.9003704, // km³/s²
  mass: 1.898124625809005e+27, // kg
  rotationPeriod: 0.4135383258130623, // days
  axialTilt: 25.50469699999999, // degrees
};

export const SATURN_STATIC = {
  name: "Saturn",
  radius: {
    equatorial: 60268,
    polar: 54364,
    mean: 58300,
    flattening: 0.09796243445941462
  },
  gm: 37931206.23436167, // km³/s²
  mass: 5.683173701266302e+26, // kg
  rotationPeriod: 0.4440092592388495, // days
  axialTilt: 6.462999999999994, // degrees
};

export const URANUS_STATIC = {
  name: "Uranus",
  radius: {
    equatorial: 25559,
    polar: 24973,
    mean: 25363.66666666667,
    flattening: 0.02292734457529637
  },
  gm: 5793951.256527211, // km³/s²
  mass: 8.680987154498916e+25, // kg
  rotationPeriod: 0.7183333333439753, // days
  axialTilt: 105.175, // degrees
};

export const NEPTUNE_STATIC = {
  name: "Neptune",
  radius: {
    equatorial: 24764,
    polar: 24341,
    mean: 24623,
    flattening: 0.01708124697141011
  },
  gm: 6835103.145462294, // km³/s²
  mass: 1.024092885465486e+26, // kg
  rotationPeriod: 0.6652624999415655, // days
  axialTilt: 46.54, // degrees
};

export const SUN_STATIC = {
  name: "Sun",
  radius: {
    equatorial: 695700,
    polar: 695700,
    mean: 695700,
    flattening: 0
  },
  gm: 132712440041.2794, // km³/s²
  mass: 1.988409871316534e+30, // kg
  rotationPeriod: 25.37999492400101, // days
  axialTilt: 26.13, // degrees
};

export const PLUTO_STATIC = {
  name: "Pluto",
  radius: {
    equatorial: 1188.3,
    polar: 1188.3,
    mean: 1188.3,
    flattening: 0
  },
  gm: 869.6138177608749, // km³/s²
  mass: 1.302928873081634e+22, // kg
  rotationPeriod: 6.387222999112575, // days
  axialTilt: 96.163, // degrees
};

