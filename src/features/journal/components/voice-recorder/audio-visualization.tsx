import React, { useRef, useEffect } from 'react';

/**
 * Audio Visualization Component
 * 
 * Renders a frequency-based audio visualization canvas using Web Audio API.
 * Displays vertical bars representing audio frequency data in real-time.
 * 
 * Uses a SEPARATE AudioContext from MediaRecorder to avoid conflicts.
 * Visualization is for UI feedback only and doesn't affect audio recording.
 * 
 * @component
 * @param {Object} props
 * @param {MediaStream} props.stream - Active audio stream from getUserMedia
 * @param {boolean} props.isRecording - Whether recording is currently active
 * @returns {JSX.Element} Canvas element with frequency visualization
 * 
 * @example
 * <AudioVisualization stream={audioStream} isRecording={true} />
 */
export const AudioVisualization: React.FC<{
  stream: MediaStream | null;
  isRecording: boolean;
}> = ({ stream, isRecording }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream || !isRecording) {
      // Stop visualization
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      return;
    }

    // Initialize visualization
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!analyserRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          ctx.fillStyle = `hsl(${(i / bufferLength) * 360}, 100%, 50%)`;
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }

        animationFrameRef.current = requestAnimationFrame(draw);
      };

      draw();
      console.log('[AudioVisualization] Started');
    } catch (err) {
      console.error('[AudioVisualization] Failed to start:', err);
    }

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [stream, isRecording]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={100}
      className={`absolute bottom-0 left-0 w-full opacity-20 pointer-events-none transition-opacity duration-500 ${
        isRecording ? 'opacity-30' : 'opacity-0'
      }`}
    />
  );
};
