"use client";

import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);

  useEffect(() => {
    const setupMicrophone = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const audioContext = new AudioCtx();
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        source.connect(analyser);

        const updateVolume = () => {
          analyser.getByteTimeDomainData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const value = dataArray[i] - 128;
            sum += value * value;
          }

          const rms = Math.sqrt(sum / dataArray.length);
          const normalizedVolume = Math.min(rms / 64, 1);

          if (videoRef.current) {
            videoRef.current.volume = normalizedVolume;
          }

          setVolumeLevel(normalizedVolume);
          requestAnimationFrame(updateVolume);
        };

        updateVolume();
      } catch (err) {
        console.error("Mic access denied or error occurred:", err);
      }
    };

    setupMicrophone();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col items-center justify-center px-6 py-12">
      <h1 className="text-4xl md:text-5xl text-center mb-8 tracking-tight">
        ScreamCast
      </h1>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-full max-w-3xl mb-10">
        <video
          ref={videoRef}
          src="/sample.mp4"
          width={720}
          controls
          autoPlay
          muted={false}
          className="rounded-lg w-full"
        />
      </div>

      <div className="flex items-center gap-4 mb-6">
        <Mic
          size={40}
          className={`text-red-500 transition-transform duration-300 ${
            volumeLevel > 0.5 ? "scale-125 animate-pulse" : "scale-100"
          }`}
        />
        <p className="text-xl font-mono text-gray-700 tracking-wide">
          {Math.round(volumeLevel * 100)}%
        </p>
      </div>

      <p className="text-center text-gray-500 max-w-md text-lg">
        Allow mic access and scream — the louder you go, the louder the video
        plays.
      </p>
    </main>
  );
}
