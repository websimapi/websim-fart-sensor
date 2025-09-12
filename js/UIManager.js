export default class UIManager {
    constructor() {
        this.elements = {
            visual: document.getElementById('fartVisual'),
            sensorDisplay: document.querySelector('.sensor-display'),
            triggerList: document.getElementById('trigger-list'),
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
    }

    renderTriggers(triggers, onToggle) {
        this.elements.triggerList.innerHTML = '';
        triggers.forEach(trigger => {
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
                    e.stopPropagation();
                    const isEnabled = !trigger.enabled;
                    li.classList.toggle('enabled', isEnabled);
                    onToggle(trigger.id, isEnabled);
                });
            }
            this.elements.triggerList.appendChild(li);
        });
    }

    updateScore(score) {
        this.elements.scoreDisplay.textContent = score;
    }

    updateFinalScore(score) {
        this.elements.finalScoreDisplay.textContent = score;
    }

    showScreen(screenName) {
        this.elements.gameIntro.classList.add('hidden');
        this.elements.gameUI.classList.add('hidden');
        this.elements.gameOverScreen.classList.add('hidden');

        if (screenName === 'intro') {
            this.elements.gameIntro.classList.remove('hidden');
        } else if (screenName === 'game') {
            this.elements.gameUI.classList.remove('hidden');
        } else if (screenName === 'gameOver') {
            this.elements.gameOverScreen.classList.remove('hidden');
        }
    }

    showCommand(text) {
        this.elements.commandText.textContent = text;
    }

    startTimer(timeLimit) {
        this.elements.timerBar.style.transition = 'none';
        this.elements.timerBar.style.transform = 'scaleX(1)';
        
        requestAnimationFrame(() => {
            this.elements.timerBar.style.transition = `transform ${timeLimit}ms linear`;
            this.elements.timerBar.style.transform = 'scaleX(0)';
        });
    }

    showVisualEffect() {
        this.elements.visual.classList.remove('active');
        requestAnimationFrame(() => this.elements.visual.classList.add('active'));
        setTimeout(() => this.elements.visual.classList.remove('active'), 600);
        
        this.elements.sensorDisplay.classList.add('triggered');
        setTimeout(() => this.elements.sensorDisplay.classList.remove('triggered'), 500);
    }

    updateVisualFeedback(command, data) {
        if (!command) {
            this.elements.visualFeedbackContainer.innerHTML = data.value || '';
            return;
        }
        
        let html = '';
        let color = '#f44336'; // Red
        const commandId = command.id;
        const { value, isInitial } = data;

        if (commandId === 'twist') {
            const degrees = isInitial ? 0 : Math.round(value);
            const progress = Math.min(1, degrees / 180);
            html = `${degrees}°`;
            color = this.calculateColor(progress);
        } else if (commandId === 'rotate') {
            const degrees = isInitial ? 0 : Math.round(value);
            const progress = Math.min(1, degrees / 90);
            html = `${degrees}°`;
            color = this.calculateColor(progress);
        } else if (commandId === 'shake') {
            const progress = Math.min(100, value) / 100;
            html = `<div class="feedback-shake-bar-container"><div class="feedback-shake-bar" style="width: ${progress * 100}%; background-color: ${this.calculateColor(progress)};"></div></div>`;
        } else if (['tap', 'double_tap', 'swipe_up', 'swipe_down'].includes(commandId)) {
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
        const red = [244, 67, 54], yellow = [255, 235, 59], green = [76, 175, 80];
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