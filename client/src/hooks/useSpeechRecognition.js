import { useState, useEffect, useRef } from 'react';

const useSpeechRecognition = (language = 'en-US') => {
  const [isMicActive, setIsMicActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef(null);
  const isRecognitionRunningRef = useRef(false);
  const micStreamRef = useRef(null);

  useEffect(() => {
    // Check if browser supports Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      // Configure recognition
      recognitionRef.current.continuous = true; // Keep listening
      recognitionRef.current.interimResults = true; // Show interim results
      recognitionRef.current.lang = language; // Set language
      
      // Handle results
      recognitionRef.current.onresult = (event) => {
        let interimText = '';
        let finalText = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText += result[0].transcript + ' ';
          } else {
            interimText += result[0].transcript;
          }
        }
        
        if (finalText) {
          setTranscript(prev => prev + finalText);
        }
        setInterimTranscript(interimText);
      };
      
      // Handle errors
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech' || event.error === 'aborted') {
          return;
        }
        // Only stop on actual errors
        isRecognitionRunningRef.current = false;
        setIsMicActive(false);
      };
      
      // Handle end
      recognitionRef.current.onend = () => {
        console.log('Recognition ended, should still run:', isRecognitionRunningRef.current);
        if (isRecognitionRunningRef.current) {
          // Restart if we still have active sources
          console.log('Restarting recognition...');
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.error('Error restarting recognition:', error);
          }
        }
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [language]);

  // Start/stop microphone
  const toggleMicrophone = async () => {
    if (isMicActive) {
      stopMicrophone();
    } else {
      await startMicrophone();
    }
  };

  const startMicrophone = async () => {
    try {
      console.log('🎤 Starting microphone...');
      
      // Get microphone stream
      micStreamRef.current = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      setIsMicActive(true);
      await ensureRecognitionRunning();
      
      console.log('✅ Microphone active');
    } catch (error) {
      console.error('Error starting microphone:', error);
      alert('Nie udało się uruchomić mikrofonu: ' + error.message);
    }
  };

  const stopMicrophone = () => {
    console.log('🛑 Stopping microphone...');
    
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    
    setIsMicActive(false);
    
    if (isRecognitionRunningRef.current) {
      isRecognitionRunningRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setInterimTranscript('');
      console.log('🛑 Speech recognition stopped');
    }
    
    console.log('✅ Microphone stopped');
  };



  // Ensure speech recognition is running when we have active sources
  const ensureRecognitionRunning = async () => {
    if (!recognitionRef.current || isRecognitionRunningRef.current) return;

    try {
      recognitionRef.current.start();
      isRecognitionRunningRef.current = true;
      console.log('🎙️ Speech recognition started');
    } catch (error) {
      console.error('Error starting recognition:', error);
    }
  };

  const stopAll = () => {
    stopMicrophone();
    setInterimTranscript('');
  };

  const resetTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  return {
    isMicActive,
    isListening: isMicActive,
    transcript,
    interimTranscript,
    isSupported,
    toggleMicrophone,
    stopAll,
    resetTranscript
  };
};

export default useSpeechRecognition;
