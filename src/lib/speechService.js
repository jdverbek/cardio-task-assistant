// Speech Recognition Service with OpenAI Whisper and Audio Storage
class SpeechService {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.stream = null;
    this.apiKey = null;
    this.onTranscriptionUpdate = null;
    this.onRecordingStateChange = null;
    this.onError = null;
  }

  // Initialize the service with API key
  initialize(apiKey) {
    this.apiKey = apiKey;
  }

  // Set callback functions
  setCallbacks({ onTranscriptionUpdate, onRecordingStateChange, onError }) {
    this.onTranscriptionUpdate = onTranscriptionUpdate;
    this.onRecordingStateChange = onRecordingStateChange;
    this.onError = onError;
  }

  // Check if browser supports audio recording
  isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  // Start recording audio
  async startRecording() {
    if (!this.isSupported()) {
      this.handleError('Audio opname wordt niet ondersteund door deze browser');
      return false;
    }

    if (!this.apiKey) {
      this.handleError('OpenAI API key is niet geconfigureerd');
      return false;
    }

    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];

      // Handle data available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Handle recording stop
      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        await this.processAudio(audioBlob);
      };

      // Start recording
      this.mediaRecorder.start();
      this.isRecording = true;
      
      if (this.onRecordingStateChange) {
        this.onRecordingStateChange(true);
      }

      return true;
    } catch (error) {
      this.handleError(`Fout bij starten opname: ${error.message}`);
      return false;
    }
  }

  // Stop recording audio
  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      
      // Stop all tracks to release microphone
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }

      if (this.onRecordingStateChange) {
        this.onRecordingStateChange(false);
      }
    }
  }

  // Process audio and get transcription
  async processAudio(audioBlob) {
    try {
      // Store audio for playback
      const audioUrl = URL.createObjectURL(audioBlob);
      const audioData = {
        blob: audioBlob,
        url: audioUrl,
        timestamp: new Date().toISOString(),
        size: audioBlob.size
      };

      // Convert to format suitable for Whisper API
      const formData = new FormData();
      
      // Convert webm to wav for better compatibility
      const wavBlob = await this.convertToWav(audioBlob);
      formData.append('file', wavBlob, 'audio.wav');
      formData.append('model', 'whisper-1');
      formData.append('language', 'nl'); // Dutch language
      formData.append('response_format', 'json');

      // Send to OpenAI Whisper API
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`API fout: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const transcription = result.text || '';

      // Return both transcription and audio data
      const speechResult = {
        transcription: transcription.trim(),
        audio: audioData,
        confidence: result.confidence || null,
        language: result.language || 'nl'
      };

      if (this.onTranscriptionUpdate) {
        this.onTranscriptionUpdate(speechResult);
      }

      return speechResult;

    } catch (error) {
      this.handleError(`Fout bij transcriptie: ${error.message}`);
      return null;
    }
  }

  // Convert WebM to WAV format
  async convertToWav(webmBlob) {
    return new Promise((resolve, reject) => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const fileReader = new FileReader();

      fileReader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          // Convert to WAV
          const wavBuffer = this.audioBufferToWav(audioBuffer);
          const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
          
          resolve(wavBlob);
        } catch (error) {
          // If conversion fails, return original blob
          resolve(webmBlob);
        }
      };

      fileReader.onerror = () => resolve(webmBlob);
      fileReader.readAsArrayBuffer(webmBlob);
    });
  }

  // Convert AudioBuffer to WAV format
  audioBufferToWav(buffer) {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);

    // Convert audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return arrayBuffer;
  }

  // Handle errors
  handleError(message) {
    console.error('SpeechService Error:', message);
    if (this.onError) {
      this.onError(message);
    }
  }

  // Clean up resources
  cleanup() {
    if (this.isRecording) {
      this.stopRecording();
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  // Get recording status
  getRecordingStatus() {
    return {
      isRecording: this.isRecording,
      isSupported: this.isSupported(),
      hasApiKey: !!this.apiKey
    };
  }
}

// Create singleton instance
export const speechService = new SpeechService();

// Audio playback utilities
export class AudioPlayer {
  constructor() {
    this.currentAudio = null;
    this.isPlaying = false;
    this.onPlayStateChange = null;
  }

  setCallback(onPlayStateChange) {
    this.onPlayStateChange = onPlayStateChange;
  }

  async play(audioUrl) {
    try {
      // Stop current audio if playing
      this.stop();

      this.currentAudio = new Audio(audioUrl);
      
      this.currentAudio.onplay = () => {
        this.isPlaying = true;
        if (this.onPlayStateChange) {
          this.onPlayStateChange(true);
        }
      };

      this.currentAudio.onended = () => {
        this.isPlaying = false;
        if (this.onPlayStateChange) {
          this.onPlayStateChange(false);
        }
      };

      this.currentAudio.onerror = () => {
        this.isPlaying = false;
        if (this.onPlayStateChange) {
          this.onPlayStateChange(false);
        }
      };

      await this.currentAudio.play();
      return true;
    } catch (error) {
      console.error('Audio playback error:', error);
      return false;
    }
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.isPlaying = false;
      if (this.onPlayStateChange) {
        this.onPlayStateChange(false);
      }
    }
  }

  getPlaybackStatus() {
    return {
      isPlaying: this.isPlaying,
      currentTime: this.currentAudio ? this.currentAudio.currentTime : 0,
      duration: this.currentAudio ? this.currentAudio.duration : 0
    };
  }
}

export const audioPlayer = new AudioPlayer();

export default speechService;

