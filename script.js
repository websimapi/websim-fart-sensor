class FartSensor {
    constructor() {
        this.fartCount = 0;
        this.sounds = [];
        this.isInitialized = false;
        this.lastFartTime = 0;
        this.minFartInterval = 200; // Prevent spam
        
        this.elements = {
            counter: document.getElementById('fartCounter'),
            visual: document.getElementById('fartVisual'),
            sensorDisplay: document.querySelector('.sensor-display'),
            permissionBanner: document.getElementById('permission-request'),
            permissionButton: document.getElementById('permission-button'),
        };
        
        this.init();
    }
    
    async init() {
        await this.loadSounds();
        this.setupEventListeners();
        this.checkMotionPermissions();
        this.isInitialized = true;
        console.log('💨 Fart Sensor initialized and ready!');
    }
    
    async loadSounds() {
        const soundFiles = ['fart1.mp3', 'fart2.mp3', 'fart3.mp3', 'fart4.mp3', 'fart5.mp3'];
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        for (const soundFile of soundFiles) {
            try {
                const response = await fetch(soundFile);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                this.sounds.push({ buffer: audioBuffer, context: audioContext });
            } catch (error) {
                console.error(`Failed to load sound ${soundFile}:`, error);
            }
        }
        
        // Resume context on first user gesture
        const resumeContext = () => {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            document.body.removeEventListener('click', resumeContext);
            document.body.removeEventListener('touchstart', resumeContext);
        };
        document.body.addEventListener('click', resumeContext);
        document.body.addEventListener('touchstart', resumeContext);
    }
    
    setupEventListeners() {
        // Tap/Click detection
        document.addEventListener('click', () => this.triggerFart('Tap detected!'));
        document.addEventListener('touchstart', () => this.triggerFart('Touch detected!'));
        
        // Tab switching
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.triggerFart('Tab switch detected!');
            }
        });
        
        window.addEventListener('blur', () => this.triggerFart('Window blur detected!'));
        
        // Keyboard events (including volume keys)
        document.addEventListener('keydown', (e) => {
            const keyName = e.key === 'AudioVolumeUp' ? 'Volume Up' : 
                           e.key === 'AudioVolumeDown' ? 'Volume Down' :
                           e.key === 'AudioVolumeMute' ? 'Volume Mute' :
                           `Key: ${e.key}`;
            this.triggerFart(`${keyName} pressed!`);
        });
        
        // Device orientation change (mobile)
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.triggerFart('Device rotated!'), 100);
        });
        
        // Window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.triggerFart('Window resized!');
            }, 300);
        });
        
        // Double tap detection
        let lastTap = 0;
        document.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 500 && tapLength > 0) {
                this.triggerFart('Double tap detected!');
            }
            lastTap = currentTime;
        });
        
        // Right click context menu
        document.addEventListener('contextmenu', (e) => {
            this.triggerFart('Right click detected!');
        });

        // Add sensor event listeners that don't need special permissions
        this.setupNonPermissionSensors();

        if (this.elements.permissionButton) {
            this.elements.permissionButton.addEventListener('click', (e) => {
                e.stopPropagation(); // prevent body click from firing a fart
                this.requestMotionPermissions();
            });
        }
    }

    checkMotionPermissions() {
        if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
            // This is likely an iOS 13+ device that requires permission.
            // Let's see if we've already been granted permission.
            DeviceMotionEvent.requestPermission().then(permissionState => {
                if (permissionState === 'granted') {
                    this.setupMotionSensors();
                } else if (permissionState === 'prompt') {
                    // Show a button to ask for permission.
                    this.elements.permissionBanner.style.display = 'block';
                }
                // If 'denied', we don't do anything.
            });
        } else {
            // For browsers that don't require explicit permission (like Android)
            this.setupMotionSensors();
        }
    }

    requestMotionPermissions() {
        if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        console.log('Motion sensor permission granted.');
                        this.elements.permissionBanner.style.display = 'none';
                        this.setupMotionSensors();
                        this.triggerFart('Motion sensors enabled!');
                    } else {
                        console.log('Motion sensor permission denied.');
                        this.elements.permissionBanner.innerHTML = '<p>Motion sensor access was denied. You can change this in your browser settings.</p>';
                    }
                })
                .catch(console.error);
        }
    }
    
    setupMotionSensors() {
        if (!('DeviceMotionEvent' in window)) {
            console.log('DeviceMotionEvent not supported.');
            return;
        }

        const motionThreshold = 12; // Lowered for more sensitivity
        const rotationThreshold = 180; // Lowered for more sensitivity
        let lastMotionTime = 0;
        const motionDebounce = 500; // ms between motion farts

        window.addEventListener('devicemotion', (event) => {
            const now = Date.now();
            if (now - lastMotionTime < motionDebounce) return;

            const { acceleration, rotationRate } = event;

            // Shake detection
            if (acceleration && acceleration.x !== null) {
                const magnitude = Math.sqrt(acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2);
                if (magnitude > motionThreshold) {
                    this.triggerFart('Device shaken!');
                    lastMotionTime = now;
                    return; // Don't check for twist if shake is detected
                }
            }

            // Twist detection
            if (rotationRate && rotationRate.alpha !== null) {
                const magnitude = Math.sqrt(rotationRate.alpha ** 2 + rotationRate.beta ** 2 + rotationRate.gamma ** 2);
                if (magnitude > rotationThreshold) {
                    this.triggerFart('Device twisted!');
                    lastMotionTime = now;
                }
            }
        });
        console.log('Motion sensors are active.');
    }

    setupNonPermissionSensors() {
        // Proximity Sensor
        if ('ondeviceproximity' in window) {
             window.addEventListener('deviceproximity', (event) => {
                // value is distance in cm. Typically fires when something is very close.
                if (event.value < 5) {
                    this.triggerFart('Proximity detected!');
                }
            });
        } else if ('onuserproximity' in window) {
             window.addEventListener('userproximity', (event) => {
                 if (event.near) {
                     this.triggerFart('User proximity detected!');
                 }
            });
        } else {
            // console.log('Proximity sensor not supported.');
        }
    }
    
    triggerFart(reason = 'Unknown trigger') {
        const now = Date.now();
        if (now - this.lastFartTime < this.minFartInterval) {
            return; // Prevent spam
        }
        
        this.lastFartTime = now;
        this.fartCount++;
        this.updateDisplay();
        this.playFartSound();
        this.showVisualEffect();
        
        console.log(`💨 FART #${this.fartCount}: ${reason}`);
    }
    
    playFartSound() {
        if (this.sounds.length === 0) return;
        
        const randomIndex = Math.floor(Math.random() * this.sounds.length);
        const sound = this.sounds[randomIndex];
        
        if (sound.context.state === 'suspended') {
            sound.context.resume();
        }

        const source = sound.context.createBufferSource();
        source.buffer = sound.buffer;
        
        const gainNode = sound.context.createGain();
        gainNode.gain.value = 0.7; // Volume
        
        source.connect(gainNode);
        gainNode.connect(sound.context.destination);
        source.start(0);
    }
    
    updateDisplay() {
        this.elements.counter.textContent = this.fartCount;
        this.elements.counter.style.animation = 'none';
        // requestAnimationFrame is better for performance than setTimeout for animations
        requestAnimationFrame(() => {
            this.elements.counter.style.animation = 'pulse 0.5s ease-out';
        });
    }
    
    showVisualEffect() {
        // Visual fart emoji animation
        this.elements.visual.classList.remove('active');
        // Use requestAnimationFrame for smoother animations
        requestAnimationFrame(() => {
            this.elements.visual.classList.add('active');
        });
        
        setTimeout(() => {
            this.elements.visual.classList.remove('active');
        }, 600);
        
        // Shake the sensor display
        this.elements.sensorDisplay.classList.add('triggered');
        setTimeout(() => {
            this.elements.sensorDisplay.classList.remove('triggered');
        }, 500);
    }
}

// Initialize the fart sensor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FartSensor();
});