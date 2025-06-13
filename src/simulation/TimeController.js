// src/simulation/TimeController.js
import { SECONDS_PER_DAY, SECONDS_PER_HOUR, SECONDS_PER_MINUTE } from '../utils/constants.js';

/* ===================================
   TIME CONTROLLER CLASS
   Manages simulation time, speed control, and date formatting
   =================================== */

export class TimeController {
  constructor(initialDate = new Date()) {
    // Time state
    this.currentDate = new Date(initialDate);
    this.startDate = new Date(initialDate);
    this.timeScale = 1; // days per second
    this.isPaused = false;
    
    // Performance tracking
    this.lastUpdate = performance.now();
    this.totalElapsedTime = 0; // Total simulated time in days
    this.realTimeElapsed = 0;  // Real time elapsed in seconds
    
    // Time scale limits and presets
    this.minTimeScale = 0.001;  // 1.44 minutes per second (slowest)
    this.maxTimeScale = 100000; // ~274 years per second (fastest)
    
    // Common time scales for quick access
    this.timeScalePresets = {
      realtime: 1 / SECONDS_PER_DAY,     // 1 second = 1 second
      minute: 1 / (SECONDS_PER_DAY / 60), // 1 second = 1 minute
      hour: 1 / 24,                       // 1 second = 1 hour
      day: 1,                             // 1 second = 1 day
      week: 7,                            // 1 second = 1 week
      month: 30,                          // 1 second = 30 days
      year: 365.25,                       // 1 second = 1 year
      decade: 3652.5,                     // 1 second = 10 years
      century: 36525                      // 1 second = 100 years
    };
    
    // Event tracking
    this.events = [];
    this.callbacks = new Map();
  }

  /* ===================================
     CORE TIME MANAGEMENT
     =================================== */
  
  update() {
    if (this.isPaused) return;

    const now = performance.now();
    const deltaTime = (now - this.lastUpdate) / 1000; // Convert to seconds
    this.realTimeElapsed += deltaTime;
    
    // Advance simulation time
    const daysToAdd = deltaTime * this.timeScale;
    this.totalElapsedTime += daysToAdd;
    
    // Update current date
    const newTime = this.currentDate.getTime() + daysToAdd * SECONDS_PER_DAY * 1000;
    this.currentDate = new Date(newTime);
    
    // Check for any scheduled events
    this.checkEvents();
    
    this.lastUpdate = now;
    
    return daysToAdd; // Return delta time in days for other systems
  }
  
  setDate(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.error('Invalid date provided to TimeController.setDate()');
      return;
    }
    
    this.currentDate = new Date(date);
    this.lastUpdate = performance.now();
    
    // Trigger date change callbacks
    this.triggerCallbacks('dateChange', this.currentDate);
  }
  
  reset() {
    this.currentDate = new Date(this.startDate);
    this.totalElapsedTime = 0;
    this.realTimeElapsed = 0;
    this.lastUpdate = performance.now();
    this.clearEvents();
  }

  /* ===================================
     PLAYBACK CONTROLS
     =================================== */
  
  pause() {
    if (!this.isPaused) {
      this.isPaused = true;
      this.triggerCallbacks('pause');
    }
  }

  play() {
    if (this.isPaused) {
      this.isPaused = false;
      this.lastUpdate = performance.now(); // Reset to avoid time jump
      this.triggerCallbacks('play');
    }
  }

  togglePause() {
    if (this.isPaused) {
      this.play();
    } else {
      this.pause();
    }
    return this.isPaused;
  }

  /* ===================================
     TIME SCALE CONTROLS
     =================================== */
  
  setTimeScale(scale) {
    const clampedScale = Math.max(this.minTimeScale, Math.min(this.maxTimeScale, scale));
    this.timeScale = clampedScale;
    this.triggerCallbacks('timeScaleChange', this.timeScale);
    return this.timeScale;
  }
  
  increaseSpeed() {
    return this.setTimeScale(this.timeScale * 2);
  }

  decreaseSpeed() {
    return this.setTimeScale(this.timeScale / 2);
  }
  
  setPresetSpeed(preset) {
    if (preset in this.timeScalePresets) {
      return this.setTimeScale(this.timeScalePresets[preset]);
    }
    console.warn(`Unknown time scale preset: ${preset}`);
    return this.timeScale;
  }
  
  getTimeScaleDescription() {
    const scale = this.timeScale;
    
    if (scale < 1 / SECONDS_PER_DAY) {
      return `${(SECONDS_PER_DAY * scale).toFixed(2)} seconds/second`;
    } else if (scale < 1 / 3600) {
      return `${(1440 * scale).toFixed(2)} minutes/second`;
    } else if (scale < 1 / 60) {
      return `${(24 * scale).toFixed(2)} hours/second`;
    } else if (scale < 1) {
      return `${scale.toFixed(3)} days/second`;
    } else if (scale < 7) {
      return `${scale.toFixed(2)} days/second`;
    } else if (scale < 30) {
      return `${(scale / 7).toFixed(2)} weeks/second`;
    } else if (scale < 365) {
      return `${(scale / 30).toFixed(2)} months/second`;
    } else if (scale < 3650) {
      return `${(scale / 365.25).toFixed(2)} years/second`;
    } else {
      return `${(scale / 3652.5).toFixed(1)} decades/second`;
    }
  }

  /* ===================================
     DATE FORMATTING
     =================================== */
  
  getFormattedDate(format = 'ISO') {
    const date = this.currentDate;
    
    switch (format) {
      case 'ISO':
        return date.toISOString().split('T')[0];
        
      case 'US':
        return date.toLocaleDateString('en-US');
        
      case 'EU':
        return date.toLocaleDateString('en-GB');
        
      case 'full':
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
      case 'fulltime':
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
        
      case 'julian':
        return this.getJulianDate().toFixed(5);
        
      case 'mission':
        return `Day ${Math.floor(this.totalElapsedTime)}`;
        
      default:
        return date.toISOString();
    }
  }
  
  getJulianDate(date = this.currentDate) {
    // Convert to Julian Date
    const time = date.getTime();
    const jd = (time / 86400000) + 2440587.5;
    return jd;
  }
  
  getMissionElapsedTime() {
    return {
      days: Math.floor(this.totalElapsedTime),
      hours: Math.floor((this.totalElapsedTime % 1) * 24),
      minutes: Math.floor((this.totalElapsedTime * 24 % 1) * 60),
      seconds: Math.floor((this.totalElapsedTime * 1440 % 1) * 60)
    };
  }
  
  getFormattedMissionTime() {
    const met = this.getMissionElapsedTime();
    return `T+${met.days}d ${met.hours}h ${met.minutes}m ${met.seconds}s`;
  }

  /* ===================================
     EVENT SCHEDULING
     =================================== */
  
  scheduleEvent(date, callback, name = null) {
    const event = {
      date: new Date(date),
      callback,
      name,
      id: Date.now() + Math.random()
    };
    
    this.events.push(event);
    this.events.sort((a, b) => a.date - b.date);
    
    return event.id;
  }
  
  cancelEvent(eventId) {
    this.events = this.events.filter(event => event.id !== eventId);
  }
  
  checkEvents() {
    const currentTime = this.currentDate.getTime();
    
    // Process all events that should have occurred
    while (this.events.length > 0 && this.events[0].date.getTime() <= currentTime) {
      const event = this.events.shift();
      try {
        event.callback(this.currentDate);
      } catch (error) {
        console.error(`Error executing scheduled event: ${event.name || 'unnamed'}`, error);
      }
    }
  }
  
  clearEvents() {
    this.events = [];
  }

  /* ===================================
     CALLBACK MANAGEMENT
     =================================== */
  
  addCallback(event, callback) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event).push(callback);
  }
  
  removeCallback(event, callback) {
    if (this.callbacks.has(event)) {
      const callbacks = this.callbacks.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  triggerCallbacks(event, data = null) {
    if (this.callbacks.has(event)) {
      this.callbacks.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in TimeController callback for event '${event}':`, error);
        }
      });
    }
  }

  /* ===================================
     UTILITY METHODS
     =================================== */
  
  getDaysSince(date) {
    const timeDiff = this.currentDate.getTime() - new Date(date).getTime();
    return timeDiff / (SECONDS_PER_DAY * 1000);
  }
  
  getDaysUntil(date) {
    const timeDiff = new Date(date).getTime() - this.currentDate.getTime();
    return timeDiff / (SECONDS_PER_DAY * 1000);
  }
  
  addDays(days) {
    const newDate = new Date(this.currentDate);
    newDate.setDate(newDate.getDate() + days);
    this.setDate(newDate);
  }
  
  getTimeInfo() {
    return {
      currentDate: this.currentDate,
      startDate: this.startDate,
      formattedDate: this.getFormattedDate(),
      julianDate: this.getJulianDate(),
      missionTime: this.getFormattedMissionTime(),
      timeScale: this.timeScale,
      timeScaleDesc: this.getTimeScaleDescription(),
      isPaused: this.isPaused,
      totalElapsedDays: this.totalElapsedTime,
      realTimeElapsed: this.realTimeElapsed,
      eventsScheduled: this.events.length
    };
  }
}