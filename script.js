class FartBopGame {
    constructor() {
        this.totalFarts = 0;
        this.score = 0;
        this.sounds = [];
        this.audioContext = null;
        this.lastFartTime = 0;
        this.minFartInterval = 200;
        this.isGameActive = false;
        this.currentCommand = null;
        this.timeLimit = 3000; // 3 seconds
        this.timer = null;
        
        // Motion sensor state
        this.startAlpha = null;
        this.startBeta = null;
        this.startGamma = null;
        this.isWaitingForTwist = false;
        this.isWaitingForRotate = false;
        this.maxAlphaDiff = 0; // Track max twist angle
        this.shakeMagnitude = 0;

        // Touch state
        this.touchStartX = 0;
        this.touchStartY = 0;

        this.tapTimeout = null;
        this.tapCount = 0;

        this.elements = {
            fartCounter: document.getElementById('fartCounter'), // No longer exists, but let's keep it for total farts logic if needed later
            visual: document.getElementById('fartVisual'),
            sensorDisplay: document.querySelector('.sensor-display'),
            permissionBanner: document.getElementById('permission-request'),
            permissionButton: document.getElementById('permission-button'),
            triggerList: document.getElementById('trigger-list'),
            // Game UI
            gameContainer: document.getElementById('game-container'),
            gameIntro: document.getElementById('game-intro'),
            gameUI: document.getElementById('game-ui'),
            gameOverScreen: document.getElementById('game-over-screen'),
            startGameBtn: document.getElementById('startGameBtn'),
            restartGameBtn: document.getElementById('restartGameBtn'),
            commandText: document.getElementById('command-text'),
            scoreDisplay: document.getElementById('score'),
            finalScoreDisplay: document.getElementById('final-score'),
            timerBar: document.getElementById('timer-bar'),
            visualFeedbackContainer: document.getElementById('visual-feedback-container'),
        };

        this.triggers = [
            { id: 'tap', name: '📱 Tap', instruction: 'Tap it!', enabled: true, isAvailable: true, soundIndex: 0 },
            { id: 'double_tap', name: '👆 Double Tap', instruction: 'Double Tap it!', enabled: true, isAvailable: true, soundIndex: 1 },
            { id: 'swipe_up', name: '⬆️ Swipe Up', instruction: 'Swipe Up!', enabled: true, isAvailable: true, soundIndex: 5 },
            { id: 'swipe_down', name: '⬇️ Swipe Down', instruction: 'Swipe Down!', enabled: true, isAvailable: true, soundIndex: 6 },
            { id: 'shake', name: '🤸 Shake', instruction: 'Shake it!', enabled: true, isAvailable: 'DeviceMotionEvent' in window, soundIndex: 2 },
            { id: 'twist', name: '🌀 Twist', instruction: 'Twist it!', enabled: true, isAvailable: 'DeviceOrientationEvent' in window, soundIndex: 3 },
            { id: 'rotate', name: '📐 Rotate', instruction: 'Rotate it!', enabled: true, isAvailable: 'DeviceOrientationEvent' in window, soundIndex: 4 },
        ];

        this.init();
    }

    async init() {
        await this.loadSounds();
        this.renderTriggers();
        this.setupEventListeners();
        if (this.triggers.some(t => t.id === 'shake' && t.isAvailable)) {
            this.checkMotionPermissions();
        }
    }

    async loadSounds() {
        const soundFiles = ['fart1.mp3', 'fart2.mp3', 'fart3.mp3', 'fart4.mp3', 'fart5.mp3', 'fart6.mp3', 'fart7.mp3'];
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        for (const soundFile of soundFiles) {
            try {
                const response = await fetch(soundFile);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                this.sounds.push(audioBuffer);
            } catch (error) {
                console.error(`Failed to load sound ${soundFile}:`, error);
            }
        }
    }

    setupEventListeners() {
        this.elements.startGameBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.startGame();
        });
        this.elements.restartGameBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.startGame();
        });

        // Universal listeners that delegate based on game state
        document.addEventListener('click', () => this.handleTap());
        
        // Swipe listeners
        document.addEventListener('touchstart', e => this.handleTouchStart(e), { passive: true });
        document.addEventListener('touchend', e => this.handleTouchEnd(e), { passive: true });

        if (this.triggers.some(t => ['twist', 'rotate'].includes(t.id) && t.isAvailable)) {
            window.addEventListener('deviceorientation', e => this.handleDeviceOrientation(e));
        }

        if (this.elements.permissionButton) {
            this.elements.permissionButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.requestMotionPermissions();
            });
        }
    }

    handleTouchStart(e) {
        this.touchStartX = e.changedTouches[0].screenX;
        this.touchStartY = e.changedTouches[0].screenY;
    }

    handleTouchEnd(e) {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        const deltaX = touchEndX - this.touchStartX;
        const deltaY = touchEndY - this.touchStartY;
        const swipeThreshold = 50; // pixels

        // Check for vertical swipe
        if (Math.abs(deltaY) > swipeThreshold && Math.abs(deltaY) > Math.abs(deltaX)) {
            if (deltaY < 0) { // Swipe Up
                this.handleAction('swipe_up');
            } else { // Swipe Down
                this.handleAction('swipe_down');
            }
        }
    }

    handleTap() {
        this.tapCount++;

        if (this.tapTimeout) {
            clearTimeout(this.tapTimeout);
        }

        this.tapTimeout = setTimeout(() => {
            if (this.tapCount === 1) {
                this.handleAction('tap');
            } else if (this.tapCount >= 2) {
                this.handleAction('double_tap');
            }
            this.tapCount = 0;
        }, 300); // 300ms window for double tap
    }

    handleAction(actionId) {
        if (this.isGameActive) {
            if (!this.currentCommand) {
                // If there's no active command, do nothing.
                // This prevents game over between commands or at the start.
                return;
            }

            if (this.currentCommand.id === actionId) {
                this.correctAction();
            } else if (actionId !== 'tap' && this.currentCommand.id === 'double_tap') {
                // Ignore single tap when waiting for double tap
            } else {
                this.gameOver();
            }
        } else {
            // Free fart mode
            this.triggerFart();
        }
    }

    renderTriggers() {
        this.elements.triggerList.innerHTML = '';
        this.triggers.forEach(trigger => {
            const li = document.createElement('li');
            li.className = 'trigger-item';
            li.dataset.triggerId = trigger.id;
            li.textContent = trigger.name;
            
            if (!trigger.isAvailable) {
                li.classList.add('disabled-sensor');
                trigger.enabled = false;
            } else {
                li.classList.toggle('enabled', trigger.enabled);
                li.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent document click listener from firing
                    trigger.enabled = !trigger.enabled;
                    li.classList.toggle('enabled', trigger.enabled);
                });
            }
            this.elements.triggerList.appendChild(li);
        });
    }

    checkMotionPermissions() {
        if (typeof DeviceMotionEvent.requestPermission === 'function' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            this.elements.permissionBanner.querySelector('p').textContent = `To detect shaking, twisting, and rotating, we need access to your device's motion sensors.`;
            this.elements.permissionBanner.style.display = 'block';
        } else {
            // For non-iOS 13+ browsers, permissions are not needed
            this.setupMotionSensors();
        }
    }

    requestMotionPermissions() {
        const motionPromise = typeof DeviceMotionEvent.requestPermission === 'function' 
            ? DeviceMotionEvent.requestPermission()
            : Promise.resolve('granted');
        
        const orientationPromise = typeof DeviceOrientationEvent.requestPermission === 'function'
            ? DeviceOrientationEvent.requestPermission()
            : Promise.resolve('granted');

        Promise.all([motionPromise, orientationPromise]).then(([motionState, orientationState]) => {
            if (motionState === 'granted' || orientationState === 'granted') {
                this.elements.permissionBanner.style.display = 'none';
                this.setupMotionSensors();
                if (orientationState !== 'granted') console.log('Twist and Rotate actions might not work without orientation permission.');
                if (motionState !== 'granted') console.log('Shake action might not work without motion permission.');
            } else {
                this.elements.permissionBanner.innerHTML = '<p>Motion/Orientation access denied. You can change this in your browser settings.</p>';
            }
        }).catch(console.error);
    }

    setupMotionSensors() {
        let lastMotionTime = 0;
        const motionDebounce = 100; // a small debounce to not overwhelm
        const motionThreshold = 15;
        const shakeThreshold = 25;

        window.addEventListener('devicemotion', e => {
            if (!e.acceleration) return;

            const now = Date.now();
            
            const { acceleration } = e;
            const magnitude = Math.sqrt(acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2);
            
            if (this.isGameActive && this.currentCommand && this.currentCommand.id === 'shake') {
                this.shakeMagnitude = Math.min(100, this.shakeMagnitude + magnitude * 0.8);
                this.updateVisualFeedback();
                
                if (this.shakeMagnitude > 99) {
                    this.handleAction('shake');
                    this.shakeMagnitude = 0;
                }
            } else {
                // Free-fart shake mode outside of a command
                if (now - lastMotionTime > 500 && magnitude > motionThreshold) {
                    this.handleAction('shake');
                    lastMotionTime = now;
                }
            }
        });
    }
    
    handleDeviceOrientation(event) {
        if (!this.isGameActive || event.alpha === null) {
            return;
        }

        if (this.isWaitingForTwist) {
            if (this.startAlpha === null) {
                this.startAlpha = event.alpha;
                return;
            }

            const currentAlpha = event.alpha;
            let diff = Math.abs(currentAlpha - this.startAlpha);
            if (diff > 180) {
                diff = 360 - diff; // Handle the 360-degree wrap-around
            }
            this.maxAlphaDiff = diff;
            this.updateVisualFeedback();

            // If the user has twisted far enough at any point, register the action
            // Using a tolerance (e.g., 170 degrees) makes it more forgiving.
            if (this.maxAlphaDiff >= 170) {
                this.handleAction('twist');
            }
        }

        if (this.isWaitingForRotate) {
            if (this.startBeta === null || this.startGamma === null) {
                this.startBeta = event.beta;
                this.startGamma = event.gamma;
                return;
            }

            const betaDiff = Math.abs(event.beta - this.startBeta);
            const gammaDiff = Math.abs(event.gamma - this.startGamma);

            this.updateVisualFeedback(Math.max(betaDiff, gammaDiff));

            if (betaDiff >= 90 || gammaDiff >= 90) {
                this.handleAction('rotate');
            }
        }
    }

    startGame() {
        const enabledTriggers = this.triggers.filter(t => t.enabled);
        if (enabledTriggers.length < 2) {
            alert("Please enable at least two triggers to start the game!");
            return;
        }

        this.score = 0;
        this.timeLimit = 3000;
        this.isGameActive = true;
        this.elements.scoreDisplay.textContent = this.score;
        
        this.elements.gameIntro.classList.add('hidden');
        this.elements.gameOverScreen.classList.add('hidden');
        this.elements.gameUI.classList.remove('hidden');

        setTimeout(() => this.nextCommand(), 1000);
    }
    
    nextCommand() {
        // Reset motion tracking for the new command
        this.isWaitingForTwist = false;
        this.isWaitingForRotate = false;
        this.startAlpha = null;
        this.startBeta = null;
        this.startGamma = null;
        this.maxAlphaDiff = 0; // Reset max twist for the new command
        this.shakeMagnitude = 0;

        const enabledTriggers = this.triggers.filter(t => t.enabled);
        
        // Prevent picking the same command twice in a row
        let nextPossibleTriggers = enabledTriggers;
        if (this.currentCommand) {
             nextPossibleTriggers = enabledTriggers.filter(t => t.id !== this.currentCommand.id);
             if (nextPossibleTriggers.length === 0) nextPossibleTriggers = enabledTriggers;
        }
       
        this.currentCommand = nextPossibleTriggers[Math.floor(Math.random() * nextPossibleTriggers.length)];
        
        if (this.currentCommand.id === 'twist') {
            this.isWaitingForTwist = true;
        }
        if (this.currentCommand.id === 'rotate') {
            this.isWaitingForRotate = true;
        }
        
        this.elements.commandText.textContent = this.currentCommand.instruction;
        this.updateVisualFeedback(0, true); // Initialize visual feedback for new command
        this.playFartSound(this.currentCommand.soundIndex); // Command sound
        this.startTimer();
    }
    
    startTimer() {
        clearTimeout(this.timer);
        this.elements.timerBar.style.transition = 'none';
        this.elements.timerBar.style.transform = 'scaleX(1)';
        
        requestAnimationFrame(() => {
            this.elements.timerBar.style.transition = `transform ${this.timeLimit}ms linear`;
            this.elements.timerBar.style.transform = 'scaleX(0)';
        });
        
        this.timer = setTimeout(() => this.gameOver(), this.timeLimit);
    }

    correctAction() {
        this.score++;
        this.elements.scoreDisplay.textContent = this.score;
        this.timeLimit = Math.max(800, this.timeLimit * 0.95); // Speed up
        this.playFartSound(this.currentCommand.soundIndex); // Reward fart
        this.showVisualEffect(); // visual effect only
        clearTimeout(this.timer);
        this.currentCommand = null;
        this.elements.commandText.textContent = 'Correct!';
        
        // Stop listening for motion
        this.isWaitingForTwist = false;
        this.isWaitingForRotate = false;
        this.startAlpha = null;
        this.startBeta = null;
        this.startGamma = null;
        this.maxAlphaDiff = 0;
        this.shakeMagnitude = 0;
        this.elements.visualFeedbackContainer.innerHTML = '✔️';

        setTimeout(() => this.nextCommand(), 500);
    }

    gameOver() {
        if (!this.isGameActive) return;
        this.isGameActive = false;
        clearTimeout(this.timer);
        this.currentCommand = null;
        this.isWaitingForTwist = false;
        this.isWaitingForRotate = false;
        this.startAlpha = null;
        this.startBeta = null;
        this.startGamma = null;
        this.maxAlphaDiff = 0;
        this.shakeMagnitude = 0;
        this.elements.visualFeedbackContainer.innerHTML = '';
        this.elements.finalScoreDisplay.textContent = this.score;

        this.elements.gameUI.classList.add('hidden');
        this.elements.gameOverScreen.classList.remove('hidden');
        this.triggerFart(); // Game over fart
    }
    
    triggerFart() {
        const now = Date.now();
        if (now - this.lastFartTime < this.minFartInterval) return;
        this.lastFartTime = now;
        this.totalFarts++;
        this.playFartSound(); // Plays a random sound
        this.showVisualEffect();
    }

    playFartSound(soundIndex = -1) {
        if (this.sounds.length === 0) return;
        if (this.audioContext.state === 'suspended') this.audioContext.resume();

        const source = this.audioContext.createBufferSource();
        
        let bufferIndex = soundIndex;
        if (bufferIndex === -1 || bufferIndex >= this.sounds.length) {
            bufferIndex = Math.floor(Math.random() * this.sounds.length);
        }

        source.buffer = this.sounds[bufferIndex];
        source.connect(this.audioContext.destination);
        source.start(0);
    }

    showVisualEffect() {
        this.elements.visual.classList.remove('active');
        requestAnimationFrame(() => this.elements.visual.classList.add('active'));
        setTimeout(() => this.elements.visual.classList.remove('active'), 600);
        
        this.elements.sensorDisplay.classList.add('triggered');
        setTimeout(() => this.elements.sensorDisplay.classList.remove('triggered'), 500);
    }

    updateVisualFeedback(value, isInitial = false) {
        if (!this.isGameActive || !this.currentCommand) {
            this.elements.visualFeedbackContainer.innerHTML = '';
            return;
        }
        
        let html = '';
        let color = '#f44336'; // Red
        const commandId = this.currentCommand.id;

        if (commandId === 'twist') {
            const degrees = isInitial ? 0 : Math.round(this.maxAlphaDiff);
            const progress = Math.min(1, degrees / 180);
            html = `${degrees}°`;
            color = this.calculateColor(progress);
        } else if (commandId === 'rotate') {
            const degrees = isInitial ? 0 : Math.round(value);
            const progress = Math.min(1, degrees / 90);
            html = `${degrees}°`;
            color = this.calculateColor(progress);
        } else if (commandId === 'shake') {
            const progress = Math.min(100, this.shakeMagnitude) / 100;
            html = `<div class="feedback-shake-bar-container"><div class="feedback-shake-bar" style="width: ${progress * 100}%; background-color: ${this.calculateColor(progress)};"></div></div>`;
        } else if (commandId === 'tap' || commandId === 'double_tap' || commandId === 'swipe_up' || commandId === 'swipe_down') {
            // For instant actions, we can just show an icon
            const iconMap = { tap: '👆', double_tap: '✌️', swipe_up: '⬆️', swipe_down: '⬇️' };
            html = `<span style="transform: scale(1.2);">${iconMap[commandId]}</span>`;
        }
        
        if (commandId === 'shake') {
             this.elements.visualFeedbackContainer.innerHTML = html;
        } else {
            this.elements.visualFeedbackContainer.innerHTML = html;
            this.elements.visualFeedbackContainer.style.color = color;
        }
    }

    calculateColor(progress) {
        // Linear interpolation from Red -> Yellow -> Green
        const red = [244, 67, 54];
        const yellow = [255, 235, 59];
        const green = [76, 175, 80];

        let r, g, b;

        if (progress < 0.5) {
            const p = progress * 2;
            r = Math.round(red[0] * (1 - p) + yellow[0] * p);
            g = Math.round(red[1] * (1 - p) + yellow[1] * p);
            b = Math.round(red[2] * (1 - p) + yellow[2] * p);
        } else {
            const p = (progress - 0.5) * 2;
            r = Math.round(yellow[0] * (1 - p) + green[0] * p);
            g = Math.round(yellow[1] * (1 - p) + green[1] * p);
            b = Math.round(yellow[2] * (1 - p) + green[2] * p);
        }
        return `rgb(${r}, ${g}, ${b})`;
    }
}

// Initialize the fart sensor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FartBopGame();
});