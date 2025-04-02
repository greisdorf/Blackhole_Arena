// Sound Manager for handling all audio in the game
// Features:
// - Audio asset management (loading, caching, and support for multiple formats)
// - Separate channels for background music and sound effects
// - Volume/mute controls for each channel
// - Looping and fade effects
// - Dynamic playback with adjustable parameters
// - Basic 3D positional audio
// - Event-driven audio triggers
// - Performance optimizations (audio pooling and lazy loading)

interface SoundOptions {
  volume?: number;
  loop?: boolean;
  playbackRate?: number;
  pan?: number;
  distance?: number;
  fadeIn?: number;
  fadeOut?: number;
}

interface Sound {
  id: string;
  audio: HTMLAudioElement;
  isMusic: boolean;
  options: SoundOptions;
  gain?: GainNode;
  panner?: StereoPannerNode;
  isPlaying: boolean;
  startTime?: number;
  endTime?: number;
}

class SoundManager {
  private static instance: SoundManager;
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, Sound> = new Map();
  private soundsCache: Map<string, ArrayBuffer> = new Map();
  private musicVolume: number = 1.0;
  private sfxVolume: number = 1.0;
  private isMusicMuted: boolean = false;
  private isSfxMuted: boolean = false;
  private currentMusic: Sound | null = null;
  private audioPool: HTMLAudioElement[] = [];
  private maxPoolSize: number = 20;
  private eventListeners: Map<string, Function[]> = new Map();
  private isInitialized: boolean = false;

  // Private constructor to enforce singleton pattern
  private constructor() {}

  // Get the singleton instance
  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  // Initialize the sound manager
  public init(): void {
    if (this.isInitialized) return;

    // Create AudioContext on user interaction to avoid autoplay restrictions
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.isInitialized = true;
      console.log("Sound Manager initialized");
    } catch (error) {
      console.error("Failed to initialize AudioContext", error);
    }

    // Pre-create some audio elements for the pool
    for (let i = 0; i < 5; i++) {
      this.createPooledAudio();
    }

    // Listen for visibility change to handle background/foreground transitions
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handleBackgroundTransition();
      } else {
        this.handleForegroundTransition();
      }
    });
  }

  // Lazy initialization for the AudioContext
  private ensureInitialized(): boolean {
    if (!this.isInitialized) {
      this.init();
    }
    return this.isInitialized && this.audioContext !== null;
  }

  // Create a new audio element for the pool
  private createPooledAudio(): HTMLAudioElement {
    const audio = new Audio();
    audio.autoplay = false;
    audio.preload = "none";
    this.audioPool.push(audio);
    return audio;
  }

  // Get an audio element from the pool or create a new one
  private getAudioFromPool(): HTMLAudioElement {
    // Try to reuse an existing, idle audio element
    for (let i = 0; i < this.audioPool.length; i++) {
      const audio = this.audioPool[i];
      if (audio.paused) {
        return audio;
      }
    }

    // If all are in use but we haven't reached max pool size, create a new one
    if (this.audioPool.length < this.maxPoolSize) {
      return this.createPooledAudio();
    }

    // Otherwise, reuse the oldest one
    const audio = this.audioPool.shift();
    audio?.pause();
    this.audioPool.push(audio!);
    return audio!;
  }

  // Test if browser supports a specific audio format
  private canPlayType(type: string): boolean {
    const audio = document.createElement('audio');
    const canPlay = audio.canPlayType(type);
    // canPlayType returns '', 'maybe', or 'probably'
    return canPlay !== '';
  }

  // Get supported format from multiple options
  private getSupportedFormat(formats: string[]): string | null {
    for (const format of formats) {
      const mimeType = this.getMimeType(format);
      if (this.canPlayType(mimeType)) {
        return format;
      }
    }
    return null;
  }

  // Get MIME type from file extension
  private getMimeType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'mp3': return 'audio/mpeg';
      case 'wav': return 'audio/wav';
      case 'ogg': return 'audio/ogg';
      case 'm4a': return 'audio/mp4';
      case 'webm': return 'audio/webm';
      default: return 'audio/mpeg'; // fallback
    }
  }

  // Load a sound file
  public async loadSound(id: string, url: string, isMusic: boolean = false): Promise<Sound | null> {
    if (!this.ensureInitialized()) return null;

    // Check if already loaded
    if (this.sounds.has(id)) {
      return this.sounds.get(id) || null;
    }

    // Try to load from cache first
    if (this.soundsCache.has(url)) {
      const cachedBuffer = this.soundsCache.get(url);
      if (cachedBuffer) {
        const audio = this.getAudioFromPool();
        const mimeType = this.getMimeType(url);
        audio.src = URL.createObjectURL(new Blob([cachedBuffer], { type: mimeType }));
        
        // Add error handling
        audio.onerror = (e) => {
          console.error(`Error loading sound ${id}:`, audio.error);
          this.triggerEvent('error', { id, error: audio.error });
        };
        
        const sound: Sound = {
          id,
          audio,
          isMusic,
          options: {},
          isPlaying: false
        };
        
        this.sounds.set(id, sound);
        return sound;
      }
    }

    // If not cached, load it
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      
      // Cache the sound data
      this.soundsCache.set(url, arrayBuffer);
      
      const audio = this.getAudioFromPool();
      const mimeType = this.getMimeType(url);
      audio.src = URL.createObjectURL(new Blob([arrayBuffer], { type: mimeType }));
      
      // Add error handling
      audio.onerror = (e) => {
        console.error(`Error loading sound ${id}:`, audio.error);
        this.triggerEvent('error', { id, error: audio.error });
      };
      
      const sound: Sound = {
        id,
        audio,
        isMusic,
        options: {},
        isPlaying: false
      };
      
      this.sounds.set(id, sound);
      
      // Trigger load event
      this.triggerEvent('load', { id, isMusic });
      
      return sound;
    } catch (error) {
      console.error(`Failed to load sound ${id} from ${url}:`, error);
      this.triggerEvent('error', { id, error });
      return null;
    }
  }

  // Check if a file exists (returns true or false)
  private async fileExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error(`Error checking if file exists at ${url}:`, error);
      return false;
    }
  }

  // Preload multiple sounds at once
  public async preloadSounds(sounds: { id: string, url: string, isMusic?: boolean, alternateFormats?: string[] }[]): Promise<void> {
    const loadPromises = sounds.map(async sound => {
      // First check if primary file exists
      const primaryExists = await this.fileExists(sound.url);
      
      // Try to load the primary format if it exists
      let loaded = false;
      if (primaryExists) {
        loaded = await this.loadSound(sound.id, sound.url, sound.isMusic) !== null;
      } else {
        console.warn(`Sound file not found: ${sound.url}`);
      }
      
      // If primary format failed/missing and we have alternates, check and try them
      if (!loaded && sound.alternateFormats && sound.alternateFormats.length > 0) {
        for (const altUrl of sound.alternateFormats) {
          // Check if alternate format exists
          const altExists = await this.fileExists(altUrl);
          if (altExists) {
            loaded = await this.loadSound(sound.id, altUrl, sound.isMusic) !== null;
            if (loaded) break;
          } else {
            console.warn(`Alternate sound file not found: ${altUrl}`);
          }
        }
      }
      
      // If still not loaded with any format, log error
      if (!loaded) {
        console.error(`Could not load sound ${sound.id} in any format - file(s) missing or format not supported`);
        this.triggerEvent('error', { id: sound.id, error: 'Sound file missing or no supported format available' });
      }
    });
    
    await Promise.all(loadPromises);
  }

  // Play a sound
  public async play(id: string, options: SoundOptions = {}): Promise<Sound | null> {
    if (!this.ensureInitialized() || !this.audioContext) return null;

    // Get or load the sound
    let sound = this.sounds.get(id);
    if (!sound) {
      console.warn(`Sound ${id} not loaded`);
      return null;
    }

    // Check if muted
    if ((sound.isMusic && this.isMusicMuted) || (!sound.isMusic && this.isSfxMuted)) {
      return null;
    }

    // Get base volume based on sound type
    const baseVolume = sound.isMusic ? this.musicVolume : this.sfxVolume;
    
    // Apply options
    const volume = (options.volume !== undefined ? options.volume : 1) * baseVolume;
    const loop = options.loop !== undefined ? options.loop : false;
    const playbackRate = options.playbackRate !== undefined ? options.playbackRate : 1;
    const pan = options.pan !== undefined ? options.pan : 0;
    
    // Create audio nodes for effect control
    if (this.audioContext) {
      const source = this.audioContext.createMediaElementSource(sound.audio);
      
      // Create gain node for volume control
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = volume;
      sound.gain = gainNode;
      
      // Create panner for 3D positioning
      const pannerNode = this.audioContext.createStereoPanner();
      pannerNode.pan.value = pan;
      sound.panner = pannerNode;
      
      // Connect nodes
      source.connect(pannerNode);
      pannerNode.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
    }
    
    // Set audio element properties
    sound.audio.loop = loop;
    sound.audio.playbackRate = playbackRate;
    sound.audio.volume = volume;
    
    // Handle fade in if specified
    if (options.fadeIn && options.fadeIn > 0 && sound.gain) {
      sound.gain.gain.value = 0;
      sound.audio.play();
      
      const startTime = this.audioContext.currentTime;
      sound.gain.gain.setValueAtTime(0, startTime);
      sound.gain.gain.linearRampToValueAtTime(volume, startTime + options.fadeIn);
    } else {
      // Standard play
      sound.audio.play();
    }
    
    // Update sound state
    sound.isPlaying = true;
    sound.options = options;
    sound.startTime = Date.now();
    
    // If this is music, update current music track
    if (sound.isMusic) {
      // If there's already music playing, stop it (with fade out if specified)
      if (this.currentMusic && this.currentMusic.id !== id) {
        this.stop(this.currentMusic.id, { fadeOut: options.fadeOut });
      }
      this.currentMusic = sound;
    }
    
    // Set up event for when sound finishes
    sound.audio.onended = () => {
      sound.isPlaying = false;
      sound.endTime = Date.now();
      
      // Trigger event
      this.triggerEvent('end', { id, isMusic: sound.isMusic });
      
      // Clean up audio nodes 
      if (!loop) {
        this.cleanupAudioNodes(sound);
      }
    };
    
    // Trigger play event
    this.triggerEvent('play', { id, isMusic: sound.isMusic });
    
    return sound;
  }

  // Stop a sound
  public stop(id: string, options: SoundOptions = {}): void {
    const sound = this.sounds.get(id);
    if (!sound) return;

    // Handle fade out if specified
    if (options.fadeOut && options.fadeOut > 0 && sound.gain && this.audioContext) {
      const startTime = this.audioContext.currentTime;
      sound.gain.gain.setValueAtTime(sound.gain.gain.value, startTime);
      sound.gain.gain.linearRampToValueAtTime(0, startTime + options.fadeOut);
      
      // Clean up after fade out
      setTimeout(() => {
        sound.audio.pause();
        sound.audio.currentTime = 0;
        sound.isPlaying = false;
        this.cleanupAudioNodes(sound);
      }, options.fadeOut * 1000);
    } else {
      // Immediate stop
      sound.audio.pause();
      sound.audio.currentTime = 0;
      sound.isPlaying = false;
      this.cleanupAudioNodes(sound);
    }

    // If this was the current music, clear the reference
    if (this.currentMusic?.id === id) {
      this.currentMusic = null;
    }
  }

  // Pause a sound
  public pause(id: string): void {
    const sound = this.sounds.get(id);
    if (!sound || !sound.isPlaying) return;
    
    sound.audio.pause();
    sound.isPlaying = false;
    
    // Trigger event
    this.triggerEvent('pause', { id, isMusic: sound.isMusic });
  }

  // Resume a paused sound
  public resume(id: string): void {
    const sound = this.sounds.get(id);
    if (!sound || sound.isPlaying) return;
    
    sound.audio.play();
    sound.isPlaying = true;
    
    // Trigger event
    this.triggerEvent('resume', { id, isMusic: sound.isMusic });
  }

  // Clean up audio nodes when a sound finishes
  private cleanupAudioNodes(sound: Sound): void {
    if (sound.gain) {
      sound.gain.disconnect();
      sound.gain = undefined;
    }
    
    if (sound.panner) {
      sound.panner.disconnect();
      sound.panner = undefined;
    }
  }

  // Set music volume (0-1)
  public setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    
    // Update current music volume if playing
    if (this.currentMusic && this.currentMusic.gain) {
      this.currentMusic.gain.gain.value = this.musicVolume * 
        (this.currentMusic.options.volume !== undefined ? this.currentMusic.options.volume : 1);
    }
    
    // Trigger event
    this.triggerEvent('volumeChange', { channel: 'music', volume: this.musicVolume });
  }

  // Set sound effects volume (0-1)
  public setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    
    // Update all playing sound effects
    this.sounds.forEach(sound => {
      if (!sound.isMusic && sound.isPlaying && sound.gain) {
        sound.gain.gain.value = this.sfxVolume * 
          (sound.options.volume !== undefined ? sound.options.volume : 1);
      }
    });
    
    // Trigger event
    this.triggerEvent('volumeChange', { channel: 'sfx', volume: this.sfxVolume });
  }

  // Toggle music mute
  public toggleMusicMute(): boolean {
    this.isMusicMuted = !this.isMusicMuted;
    
    if (this.currentMusic) {
      if (this.isMusicMuted) {
        this.currentMusic.audio.pause();
      } else {
        this.currentMusic.audio.play();
      }
    }
    
    // Trigger event
    this.triggerEvent('muteChange', { channel: 'music', muted: this.isMusicMuted });
    
    return this.isMusicMuted;
  }

  // Toggle sound effects mute
  public toggleSfxMute(): boolean {
    this.isSfxMuted = !this.isSfxMuted;
    
    // Pause all playing sound effects
    this.sounds.forEach(sound => {
      if (!sound.isMusic && sound.isPlaying) {
        if (this.isSfxMuted) {
          sound.audio.pause();
        } else {
          sound.audio.play();
        }
      }
    });
    
    // Trigger event
    this.triggerEvent('muteChange', { channel: 'sfx', muted: this.isSfxMuted });
    
    return this.isSfxMuted;
  }

  // Set music mute state directly
  public setMusicMute(muted: boolean): void {
    if (this.isMusicMuted === muted) return;
    this.toggleMusicMute();
  }

  // Set sound effects mute state directly
  public setSfxMute(muted: boolean): void {
    if (this.isSfxMuted === muted) return;
    this.toggleSfxMute();
  }

  // Handle when the app goes to background
  private handleBackgroundTransition(): void {
    // Pause all sounds to save resources
    this.sounds.forEach(sound => {
      if (sound.isPlaying) {
        sound.audio.pause();
      }
    });
  }

  // Handle when the app comes back to foreground
  private handleForegroundTransition(): void {
    // Resume music if it was playing
    if (this.currentMusic && !this.isMusicMuted) {
      this.currentMusic.audio.play();
    }
  }

  // Add event listener
  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }

  // Remove event listener
  public off(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) return;
    
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Trigger event
  private triggerEvent(event: string, data: any): void {
    if (!this.eventListeners.has(event)) return;
    
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in sound event listener for ${event}:`, error);
        }
      });
    }
  }

  // Update positional audio parameters
  public updatePosition(id: string, pan: number, distance: number = 0): void {
    const sound = this.sounds.get(id);
    if (!sound || !sound.panner) return;
    
    // Update stereo panning (-1 to 1)
    sound.panner.pan.value = Math.max(-1, Math.min(1, pan));
    
    // Apply volume attenuation based on distance
    if (sound.gain && distance > 0) {
      // Simple inverse square law for distance attenuation
      const baseVolume = sound.isMusic ? this.musicVolume : this.sfxVolume;
      const volumeScale = sound.options.volume !== undefined ? sound.options.volume : 1;
      const distanceFactor = 1 / (1 + distance * 0.1);
      
      sound.gain.gain.value = baseVolume * volumeScale * distanceFactor;
    }
  }

  // Get sound playback state
  public isPlaying(id: string): boolean {
    const sound = this.sounds.get(id);
    return !!sound && sound.isPlaying;
  }

  // Check if a sound is loaded and available
  public hasSoundLoaded(id: string): boolean {
    return this.sounds.has(id);
  }

  // Get current music track ID
  public getCurrentMusic(): string | null {
    return this.currentMusic ? this.currentMusic.id : null;
  }

  // Dispose and clean up all resources
  public dispose(): void {
    // Stop and unload all sounds
    this.sounds.forEach((sound, id) => {
      this.stop(id);
      
      if (sound.audio.src) {
        URL.revokeObjectURL(sound.audio.src);
      }
    });
    
    // Clear collections
    this.sounds.clear();
    this.soundsCache.clear();
    this.eventListeners.clear();
    
    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    this.audioContext = null;
    this.currentMusic = null;
    this.isInitialized = false;
  }
}

export default SoundManager; 