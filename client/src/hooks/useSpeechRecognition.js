import { useState, useEffect, useRef } from 'react';

const useSpeechRecognition = (language = 'en-US') => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);

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
        if (event.error === 'no-speech') {
          console.log('No speech detected, continuing...');
          // Don't stop on no-speech, just continue
          return;
        }
        if (event.error === 'aborted') {
          console.log('Recognition aborted');
          return;
        }
        // Only stop on actual errors
        setIsListening(false);
        isListeningRef.current = false;
      };
      
      // Handle end
      recognitionRef.current.onend = () => {
        console.log('Recognition ended, isListening:', isListeningRef.current);
        if (isListeningRef.current) {
          // Restart if still supposed to be listening
          console.log('Restarting recognition...');
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.error('Error restarting recognition:', error);
            setIsListening(false);
            isListeningRef.current = false;
          }
        }
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setInterimTranscript('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
        isListeningRef.current = true;
        console.log('🎤 Started listening...');
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      isListeningRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimTranscript('');
      console.log('🛑 Stopped listening');
    }
  };

  const resetTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  };
};

export default useSpeechRecognition;
