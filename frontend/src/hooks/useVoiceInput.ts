import { useCallback, useEffect, useRef } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

function joinSpokenText(prefix: string, spoken: string) {
  if (!prefix) return spoken;
  if (!spoken) return prefix;
  return `${prefix} ${spoken}`;
}

export function useVoiceInput(
  value: string,
  onChange: (value: string) => void,
  enabled = true,
) {
  const prefixRef = useRef("");
  const sessionActiveRef = useRef(false);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    browserSupportsContinuousListening,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  useEffect(() => {
    if (!sessionActiveRef.current) return;
    if (!listening && !transcript) return;
    onChange(joinSpokenText(prefixRef.current, transcript));
  }, [listening, transcript, onChange]);

  const stopListening = useCallback(() => {
    if (!sessionActiveRef.current && !listening) return;
    if (transcript) {
      onChange(joinSpokenText(prefixRef.current, transcript));
    }
    void SpeechRecognition.stopListening();
  }, [listening, onChange, transcript]);

  const endSession = useCallback(() => {
    sessionActiveRef.current = false;
    resetTranscript();
  }, [resetTranscript]);

  const toggleListening = useCallback(() => {
    if (!browserSupportsSpeechRecognition) return;

    if (listening) {
      stopListening();
      return;
    }

    prefixRef.current = value.trim();
    sessionActiveRef.current = true;
    resetTranscript();
    void SpeechRecognition.startListening({
      language: "ja-JP",
      continuous: browserSupportsContinuousListening,
    });
  }, [
    browserSupportsContinuousListening,
    browserSupportsSpeechRecognition,
    listening,
    resetTranscript,
    stopListening,
    value,
  ]);

  useEffect(() => {
    if (!enabled) {
      stopListening();
    }
  }, [enabled, stopListening]);

  useEffect(() => {
    return () => {
      sessionActiveRef.current = false;
      void SpeechRecognition.abortListening();
    };
  }, []);

  return {
    listening,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    toggleListening,
    stopListening,
    endSession,
  };
}
