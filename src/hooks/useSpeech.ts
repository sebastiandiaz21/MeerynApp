
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechOptions {
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export function useSpeech(options?: UseSpeechOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const optionsRef = useRef(options);

  const [supported, setSupported] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const speechSynthesisSupported = 'speechSynthesis' in window;
    const recognitionSupported = SpeechRecognitionAPI != null;

    if (!speechSynthesisSupported || !recognitionSupported) {
      console.warn('SpeechSynthesis or SpeechRecognition API not fully supported in this browser.');
    }
    return speechSynthesisSupported && recognitionSupported;
  });

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const cleanupRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort(); // Ensure it's stopped
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onstart = null;
      recognitionRef.current.onend = null;
    }
  }, []);

  useEffect(() => {
    if (!supported) {
      if (recognitionRef.current) { // Only cleanup if it was initialized
        cleanupRecognition();
        recognitionRef.current = null; // Ensure it's null if not supported
      }
      return;
    }

    if (!recognitionRef.current) {
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognitionAPI) {
        setSupported(false);
        recognitionRef.current = null;
        return;
      }
      recognitionRef.current = new SpeechRecognitionAPI();
    }
    
    const rec = recognitionRef.current;
    rec.continuous = false;
    rec.lang = 'en-US'; 
    rec.interimResults = false;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      if (optionsRef.current?.onResult) {
        optionsRef.current.onResult(transcript);
      }
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        console.warn('Speech recognition warning:', event.error);
      } else {
        console.error('Speech recognition error:', event.error);
      }
      if (optionsRef.current?.onError) {
        optionsRef.current.onError(event.error);
      }
      // Ensure isListening is false on error, as onend might not be called.
      setIsListening(false); 
    };

    rec.onstart = () => {
      setIsListening(true);
      if (optionsRef.current?.onStart) {
        optionsRef.current.onStart();
      }
    };

    rec.onend = () => {
      setIsListening(false);
      if (optionsRef.current?.onEnd) {
        optionsRef.current.onEnd();
      }
    };
    
    return () => {
      if (rec) {
        rec.abort(); // Abort any pending recognition on effect cleanup if the component unmounts.
        // No need to call cleanupRecognition() here as the listeners are reassigned or instance is nulled if supported changes.
      }
    };
  }, [supported, cleanupRecognition]);


  const speak = useCallback((text: string, onEndCallback?: () => void) => {
    if (!supported || !('speechSynthesis' in window)) {
      if (onEndCallback) onEndCallback(); // Call onEndCallback even if not supported, so UI can proceed
      return;
    }

    // Cancel any ongoing or pending speech.
    // This also helps if the onend event of a previous utterance was missed.
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; 
    utterance.rate = 0.9;
    utterance.pitch = 1;

    // Set our speaking state to true *before* speaking.
    setIsSpeaking(true);

    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error", event);
      setIsSpeaking(false);
      if (optionsRef.current?.onError) optionsRef.current.onError("Speech synthesis error: " + event.error);
      if (onEndCallback) onEndCallback(); // Ensure callback fires even on error so UI isn't stuck
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Error calling window.speechSynthesis.speak:", e);
      setIsSpeaking(false); // Reset state on immediate error
      if (optionsRef.current?.onError) {
        const message = e instanceof Error ? e.message : String(e);
        optionsRef.current.onError("Error initiating speech: " + message);
      }
      if (onEndCallback) onEndCallback(); // Ensure callback fires so UI isn't stuck
    }
  }, [supported, optionsRef]); // Removed isSpeaking from dependencies, added optionsRef


  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening && !isSpeaking) { // also check !isSpeaking (synthesis)
      try {
        // Ensure speech synthesis is not active before starting recognition
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          // Give a brief moment for cancel to take effect if needed, though usually not
        }
        setIsListening(false); // Ensure recognition state is reset if it was stuck
        recognitionRef.current.start();
      } catch (error: any) {
        console.error("Error starting recognition:", error);
        if (optionsRef.current?.onError) optionsRef.current.onError('Failed to start recognition: ' + error.message);
        setIsListening(false);
      }
    }
  }, [isListening, isSpeaking, optionsRef]); // Added isSpeaking and optionsRef

  const stopListening = useCallback((force = false) => {
    if (recognitionRef.current && isListening) {
      try {
        if (force) {
          recognitionRef.current.abort();
        } else {
          recognitionRef.current.stop();
        }
        // Note: onend will set isListening to false.
      } catch (error: any) {
        console.error("Error stopping recognition:", error);
        if (optionsRef.current?.onError) optionsRef.current.onError('Failed to stop recognition: ' + error.message);
        setIsListening(false); // Force state update on error
      }
    }
  }, [isListening, optionsRef]); // Added optionsRef

  // Effect to ensure isListening is false if recognition instance is removed (e.g., support changes)
  useEffect(() => {
    if (!recognitionRef.current && isListening) {
      setIsListening(false);
    }
  }, [isListening]);
  
  // Effect to ensure isSpeaking is false if speech synthesis becomes unavailable
  useEffect(() => {
    if (!supported && isSpeaking) {
        setIsSpeaking(false);
    }
  }, [supported, isSpeaking]);


  return {
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    supported,
  };
}
