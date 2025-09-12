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

