class FartSensor {
    constructor() {
        this.fartCount = 0;
        this.currentSoundIndex = 0;
        this.sounds = [];
        this.isInitialized = false;
        this.lastFartTime = 0;
        this.minFartInterval = 200; // Prevent spam
        
        this.elements = {
            counter: document.getElementById('fartCounter'),
            visual: document.getElementById('fartVisual'),
            sensorDisplay: document.querySelector('.sensor-display')
        };
        
        this.init();
    }
    
    async init() {
        await this.loadSounds();
        this.setupEventListeners();
        this.isInitialized = true;
        console.log('💨 Fart Sensor initialized and ready!');
    }
    
    async loadSounds() {
        const soundFiles = ['fart1.mp3', 'fart2.mp3', 'fart3.mp3', 'fart4.mp3', 'fart5.mp3'];
        
        for (const soundFile of soundFiles) {
            const audio = new Audio(soundFile);
            audio.preload = 'auto';
            audio.volume = 0.7;
            this.sounds.push(audio);
        }
    }
    
    setupEventListeners() {
        const handleFirstInteraction = () => {
            this.requestMotionPermissions();
            document.removeEventListener('click', handleFirstInteraction);
            document.removeEventListener('touchstart', handleFirstInteraction);
        };

        // Tap/Click detection
        document.addEventListener('click', () => this.triggerFart('Tap detected!'));
        document.addEventListener('touchstart', () => this.triggerFart('Touch detected!'));
        
        document.addEventListener('click', handleFirstInteraction, { once: true });
        document.addEventListener('touchstart', handleFirstInteraction, { once: true });
        
        // Tab switching
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.triggerFart('Tab switch detected!');
            }
        });
        
        window.addEventListener('blur', () => this.triggerFart('Window blur detected!'));
        window.addEventListener('focus', () => this.triggerFart('Window focus detected!'));
        
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
        
        // Mouse movement (desktop only)
        let mouseMoveTimeout;
        let mouseMoveCount = 0;
        document.addEventListener('mousemove', () => {
            mouseMoveCount++;
            clearTimeout(mouseMoveTimeout);
            mouseMoveTimeout = setTimeout(() => {
                if (mouseMoveCount > 50) { // Lots of movement
                    this.triggerFart('Frantic mouse movement!');
                }
                mouseMoveCount = 0;
            }, 2000);
        });
        
        // Page load
        window.addEventListener('load', () => {
            setTimeout(() => this.triggerFart('Page loaded!'), 1000);
        });
        
        // Right click context menu
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.triggerFart('Right click detected!');
        });

        // Add sensor event listeners that don't need special permissions
        this.setupNonPermissionSensors();
    }

    requestMotionPermissions() {
        if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        console.log('Motion sensor permission granted.');
                        this.setupMotionSensors();
                    } else {
                        console.log('Motion sensor permission denied.');
                    }
                })
                .catch(console.error);
        } else {
            // For browsers that don't require explicit permission (like Android)
            this.setupMotionSensors();
        }
    }
    
    setupMotionSensors() {
        if ('DeviceMotionEvent' in window) {
            let lastX, lastY, lastZ;
            let lastAlpha, lastBeta, lastGamma;
            const motionThreshold = 15; // m/s^2
            const rotationThreshold = 250; // deg/s

            window.addEventListener('devicemotion', (event) => {
                const { acceleration } = event;
                const { rotationRate } = event;

                // Shake detection
                if (acceleration && acceleration.x !== null) {
                    if (lastX !== undefined) {
                        const deltaX = Math.abs(acceleration.x - lastX);
                        const deltaY = Math.abs(acceleration.y - lastY);
                        const deltaZ = Math.abs(acceleration.z - lastZ);
                        
                        if (deltaX + deltaY + deltaZ > motionThreshold) {
                            this.triggerFart('Device shaken!');
                        }
                    }
                    lastX = acceleration.x;
                    lastY = acceleration.y;
                    lastZ = acceleration.z;
                }

                // Twist detection
                if (rotationRate && rotationRate.alpha !== null) {
                    if (lastAlpha !== undefined) {
                         if (Math.abs(rotationRate.alpha - lastAlpha) > rotationThreshold ||
                             Math.abs(rotationRate.beta - lastBeta) > rotationThreshold ||
                             Math.abs(rotationRate.gamma - lastGamma) > rotationThreshold) {
                            this.triggerFart('Device twisted!');
                        }
                    }
                    lastAlpha = rotationRate.alpha;
                    lastBeta = rotationRate.beta;
                    lastGamma = rotationRate.gamma;
                }
            });
        } else {
            console.log('DeviceMotionEvent not supported.');
        }
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
            console.log('Proximity sensor not supported.');
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
        
        // Get random sound
        const randomIndex = Math.floor(Math.random() * this.sounds.length);
        const sound = this.sounds[randomIndex];
        
        // Reset and play
        sound.currentTime = 0;
        sound.play().catch(e => {
            console.log('Could not play sound:', e.message);
        });
    }
    
    updateDisplay() {
        this.elements.counter.textContent = this.fartCount;
        this.elements.counter.style.animation = 'none';
        setTimeout(() => {
            this.elements.counter.style.animation = 'pulse 0.5s ease-out';
        }, 10);
    }
    
    showVisualEffect() {
        // Visual fart emoji animation
        this.elements.visual.classList.remove('active');
        setTimeout(() => {
            this.elements.visual.classList.add('active');
        }, 10);
        
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