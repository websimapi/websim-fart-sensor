export default class InputManager {
    constructor() {
        this.eventListeners = {};
        
        // Motion sensor state
        this.startAlpha = null;
        this.startBeta = null;
        this.startGamma = null;
        this.isWaitingForTwist = false;
        this.isWaitingForRotate = false;
        this.maxAlphaDiff = 0;
        this.shakeMagnitude = 0;

        // Touch state
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.tapTimeout = null;
        this.tapCount = 0;

        this.permissionBanner = document.getElementById('permission-request');
        this.permissionButton = document.getElementById('permission-button');

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkMotionPermissions();
    }

    on(eventName, callback) {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        this.eventListeners[eventName].push(callback);
    }

    emit(eventName, data) {
        if (this.eventListeners[eventName]) {
            this.eventListeners[eventName].forEach(callback => callback(data));
        }
    }

    setWaitingFor(commandId) {
        if (commandId === 'twist') this.isWaitingForTwist = true;
        if (commandId === 'rotate') this.isWaitingForRotate = true;
    }

    reset() {
        this.isWaitingForTwist = false;
        this.isWaitingForRotate = false;
        this.startAlpha = null;
        this.startBeta = null;
        this.startGamma = null;
        this.maxAlphaDiff = 0;
        this.shakeMagnitude = 0;
    }

    setupEventListeners() {
        document.addEventListener('click', () => this.handleTap());
        document.addEventListener('touchstart', e => this.handleTouchStart(e), { passive: true });
        document.addEventListener('touchend', e => this.handleTouchEnd(e), { passive: true });
        window.addEventListener('deviceorientation', e => this.handleDeviceOrientation(e));
        window.addEventListener('devicemotion', e => this.handleDeviceMotion(e));

        if (this.permissionButton) {
            this.permissionButton.addEventListener('click', (e) => {
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
        const deltaY = e.changedTouches[0].screenY - this.touchStartY;
        const deltaX = e.changedTouches[0].screenX - this.touchStartX;
        const swipeThreshold = 50;

        if (Math.abs(deltaY) > swipeThreshold && Math.abs(deltaY) > Math.abs(deltaX)) {
            this.emit('action', deltaY < 0 ? 'swipe_up' : 'swipe_down');
        }
    }

    handleTap() {
        this.tapCount++;
        if (this.tapTimeout) clearTimeout(this.tapTimeout);

        this.tapTimeout = setTimeout(() => {
            if (this.tapCount === 1) this.emit('action', 'tap');
            else if (this.tapCount >= 2) this.emit('action', 'double_tap');
            this.tapCount = 0;
        }, 300);
    }

    handleDeviceMotion(e) {
        if (!e.acceleration || !this.isWaitingFor('shake')) return;
        
        const { x, y, z } = e.acceleration;
        const magnitude = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
        
        this.shakeMagnitude = Math.min(100, this.shakeMagnitude + magnitude * 0.8);
        this.emit('updateVisuals', { value: this.shakeMagnitude });
        
        if (this.shakeMagnitude > 99) {
            this.emit('action', 'shake');
            this.shakeMagnitude = 0;
        }
    }
    
    handleDeviceOrientation(event) {
        if (event.alpha === null) return;

        if (this.isWaitingForTwist) {
            if (this.startAlpha === null) this.startAlpha = event.alpha;
            let diff = Math.abs(event.alpha - this.startAlpha);
            if (diff > 180) diff = 360 - diff;
            this.maxAlphaDiff = diff;
            this.emit('updateVisuals', { value: this.maxAlphaDiff });
            if (this.maxAlphaDiff >= 170) this.emit('action', 'twist');
        }

        if (this.isWaitingForRotate) {
            if (this.startBeta === null) {
                this.startBeta = event.beta;
                this.startGamma = event.gamma;
            }
            const betaDiff = Math.abs(event.beta - this.startBeta);
            const gammaDiff = Math.abs(event.gamma - this.startGamma);
            this.emit('updateVisuals', { value: Math.max(betaDiff, gammaDiff) });
            if (betaDiff >= 90 || gammaDiff >= 90) this.emit('action', 'rotate');
        }
    }

    isWaitingFor(action) {
        if (action === 'shake') return this.shakeMagnitude !== undefined;
        return this.isWaitingForTwist || this.isWaitingForRotate;
    }

    checkMotionPermissions() {
        const motion = typeof DeviceMotionEvent.requestPermission === 'function';
        const orientation = typeof DeviceOrientationEvent.requestPermission === 'function';
        if (motion || orientation) {
            this.permissionBanner.style.display = 'block';
        }
    }

    requestMotionPermissions() {
        const motionPromise = typeof DeviceMotionEvent.requestPermission === 'function' 
            ? DeviceMotionEvent.requestPermission() : Promise.resolve('granted');
        const orientationPromise = typeof DeviceOrientationEvent.requestPermission === 'function'
            ? DeviceOrientationEvent.requestPermission() : Promise.resolve('granted');

        Promise.all([motionPromise, orientationPromise]).then(([motion, orientation]) => {
            if (motion === 'granted' || orientation === 'granted') {
                this.permissionBanner.style.display = 'none';
            } else {
                this.permissionBanner.innerHTML = '<p>Motion access denied. You can change this in your browser settings.</p>';
            }
        }).catch(console.error);
    }
}