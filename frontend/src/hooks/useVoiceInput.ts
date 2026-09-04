import { useEffect, useRef } from "react";
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
) {
  const prefixRef = useRef("");
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    browserSupportsContinuousListening,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  useEffect(() => {
    if (!listening) return;
    onChange(joinSpokenText(prefixRef.current, transcript));
  }, [listening, transcript, onChange]);

  const stopListening = () => {
    if (!listening) return;
    onChange(joinSpokenText(prefixRef.current, transcript));
    void SpeechRecognition.stopListening();
  };

  const toggleListening = () => {
    if (!browserSupportsSpeechRecognition) return;

    if (listening) {
      stopListening();
      return;
    }

    prefixRef.current = value.trim();
    resetTranscript();
    void SpeechRecognition.startListening({
      language: "ja-JP",
      continuous: browserSupportsContinuousListening,
    });
  };

  return {
    listening,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    toggleListening,
    stopListening,
  };
}
