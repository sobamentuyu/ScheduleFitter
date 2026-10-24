declare module 'react-speech-recognition' {
	export type SpeechRecognitionStartOptions = {
		continuous?: boolean;
		language?: string;
	};

	export function useSpeechRecognition(): {
		transcript: string;
		interimTranscript: string;
		finalTranscript: string;
		listening: boolean;
		resetTranscript: () => void;
		browserSupportsSpeechRecognition: boolean;
		browserSupportsContinuousListening: boolean;
		isMicrophoneAvailable: boolean;
	};

	const SpeechRecognition: {
		startListening: (
			options?: SpeechRecognitionStartOptions,
		) => Promise<void>;
		stopListening: () => Promise<void>;
		abortListening: () => Promise<void>;
		browserSupportsSpeechRecognition: () => boolean;
	};

	export default SpeechRecognition;
}
