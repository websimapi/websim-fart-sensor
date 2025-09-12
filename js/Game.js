import UIManager from './ui';
import InputManager from './input';
import AudioManager from './audio';

export default class Game {
    constructor() {
        this.score = 0;
        this.isGameActive = false;
        this.currentCommand = null;
        this.timeLimit = 3000; // 3 seconds
        this.timer = null;

        this.triggers = [
            { id: 'tap', name: '📱 Tap', instruction: 'Tap it!', enabled: true, isAvailable: true, soundIndex: 0 },
            { id: 'double_tap', name: '👆 Double Tap', instruction: 'Double Tap it!', enabled: true, isAvailable: true, soundIndex: 1 },
            { id: 'swipe_up', name: '⬆️ Swipe Up', instruction: 'Swipe Up!', enabled: true, isAvailable: true, soundIndex: 5 },
            { id: 'swipe_down', name: '⬇️ Swipe Down', instruction: 'Swipe Down!', enabled: true, isAvailable: true, soundIndex: 6 },
            { id: 'shake', name: '🤸 Shake', instruction: 'Shake it!', enabled: true, isAvailable: 'DeviceMotionEvent' in window, soundIndex: 2 },
            { id: 'twist', name: '🌀 Twist', instruction: 'Twist it!', enabled: true, isAvailable: 'DeviceOrientationEvent' in window, soundIndex: 3 },
            { id: 'rotate', name: '📐 Rotate', instruction: 'Rotate it!', enabled: true, isAvailable: 'DeviceOrientationEvent' in window, soundIndex: 4 },
        ];

        this.ui = new UIManager();
        this.audio = new AudioManager();
        this.input = new InputManager();

        this.init();
    }

    init() {
        this.audio.loadSounds(); // Start loading sounds in the background
        this.ui.renderTriggers(this.triggers, (triggerId, isEnabled) => {
            const trigger = this.triggers.find(t => t.id === triggerId);
            if (trigger) {
                trigger.enabled = isEnabled;
            }
        });
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.ui.elements.startGameBtn.addEventListener('click', () => this.startGame());
        this.ui.elements.restartGameBtn.addEventListener('click', () => this.startGame());

        this.input.on('action', actionId => this.handleAction(actionId));
        this.input.on('updateVisuals', data => this.ui.updateVisualFeedback(this.currentCommand, data));
    }

    handleAction(actionId) {
        if (this.isGameActive) {
            if (!this.currentCommand) return;

            if (this.currentCommand.id === actionId) {
                this.correctAction();
            } else if (actionId === 'tap' && this.currentCommand.id === 'double_tap') {
                // Ignore single tap when waiting for double tap
            } else {
                this.gameOver();
            }
        } else {
            // Free fart mode
            this.triggerFart();
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
        this.ui.updateScore(this.score);
        this.ui.showScreen('game');

        setTimeout(() => this.nextCommand(), 1000);
    }

    nextCommand() {
        this.input.reset();

        const enabledTriggers = this.triggers.filter(t => t.enabled);
        
        let nextPossibleTriggers = enabledTriggers;
        if (this.currentCommand) {
             nextPossibleTriggers = enabledTriggers.filter(t => t.id !== this.currentCommand.id);
             if (nextPossibleTriggers.length === 0) nextPossibleTriggers = enabledTriggers;
        }
       
        this.currentCommand = nextPossibleTriggers[Math.floor(Math.random() * nextPossibleTriggers.length)];
        
        this.input.setWaitingFor(this.currentCommand.id);
        
        this.ui.showCommand(this.currentCommand.instruction);
        this.ui.updateVisualFeedback(this.currentCommand, { value: 0, isInitial: true });
        this.audio.playFartSound(this.currentCommand.soundIndex);
        this.startTimer();
    }

    startTimer() {
        clearTimeout(this.timer);
        this.ui.startTimer(this.timeLimit);
        this.timer = setTimeout(() => this.gameOver(), this.timeLimit);
    }

    correctAction() {
        this.score++;
        this.ui.updateScore(this.score);
        this.timeLimit = Math.max(800, this.timeLimit * 0.95);
        this.audio.playFartSound(this.currentCommand.soundIndex);
        this.ui.showVisualEffect();
        clearTimeout(this.timer);
        this.currentCommand = null;
        this.input.reset();

        this.ui.showCommand('Correct!');
        this.ui.updateVisualFeedback(null, { value: '✔️' });

        setTimeout(() => this.nextCommand(), 500);
    }

    gameOver() {
        if (!this.isGameActive) return;
        this.isGameActive = false;
        clearTimeout(this.timer);
        this.currentCommand = null;
        this.input.reset();
        
        this.ui.updateVisualFeedback(null, {}); // Clear feedback
        this.ui.updateFinalScore(this.score);
        this.ui.showScreen('gameOver');
        this.triggerFart();
    }
    
    triggerFart() {
        this.audio.playFartSound();
        this.ui.showVisualEffect();
    }
}