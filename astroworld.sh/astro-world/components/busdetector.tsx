import { useState, useEffect } from 'react';

interface BusDetectorProps {
  isActive: boolean;
  onBusDetected: (busNumber: string, distance: number) => void;
}

export default function BusDetector({ isActive, onBusDetected }: BusDetectorProps) {
  useEffect(() => {
    if (!isActive) return;

    // Simulação de detecção - substituir por OCR real depois
    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        const busNumber = String(Math.floor(Math.random() * 900) + 100);
        const distance = Math.floor(Math.random() * 20) + 1;
        onBusDetected(busNumber, distance);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isActive, onBusDetected]);

  return null;
}

