export default class AudioManager {
    constructor() {
        this.sounds = [];
        this.audioContext = null;
        this.lastFartTime = 0;
        this.minFartInterval = 200;
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

    playFartSound(soundIndex = -1) {
        const now = Date.now();
        if (now - this.lastFartTime < this.minFartInterval) return;
        this.lastFartTime = now;
        
        if (this.sounds.length === 0) return;
        if (this.audioContext.state === 'suspended') this.audioContext.resume();

        const source = this.audioContext.createBufferSource();
        
        let bufferIndex = soundIndex;
        if (bufferIndex < 0 || bufferIndex >= this.sounds.length) {
            bufferIndex = Math.floor(Math.random() * this.sounds.length);
        }

        source.buffer = this.sounds[bufferIndex];
        source.connect(this.audioContext.destination);
        source.start(0);
    }
}