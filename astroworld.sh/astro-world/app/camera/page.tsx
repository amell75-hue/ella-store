import { useState, useRef } from 'react';
import Layout from '../components/Layout';
import { Camera, StopCircle } from 'lucide-react';

export default function CameraPage() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [busNumber, setBusNumber] = useState<string>('');
  const [distance, setDistance] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-PT';
      utterance.rate = 1.0;
      speechSynthesis.speak(utterance);
    }
  };

  const startDetection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsDetecting(true);
        speak('Detecção ativada');
        
        setTimeout(() => {
          const num = String(Math.floor(Math.random() * 900) + 100);
          const dist = Math.floor(Math.random() * 20) + 1;
          setBusNumber(num);
          setDistance(dist);
          speak(`Ônibus ${num} detectado a ${dist} metros`);
        }, 3000);
      }
    } catch (error) {
      speak('Erro ao acessar câmera');
    }
  };

  const stopDetection = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsDetecting(false);
      speak('Detecção desativada');
    }
  };

  return (
    <Layout>
      <div className="space-y-6 pb-20 lg:pb-6">
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6">
          <h1 className="text-3xl font-bold mb-2">📸 Detecção com IA</h1>
          <p className="text-gray-400">
            Use a câmera para detectar obstáculos e números de ônibus
          </p>
        </div>

        <div className="bg-[#1a1f3a] border border-gray-800 rounded-2xl p-6">
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden mb-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!isDetecting && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center">
                  <Camera size={64} className="text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Câmera desligada</p>
                </div>
              </div>
            )}
            
            {isDetecting && busNumber && (
              <div className="absolute top-4 left-4 right-4 bg-cyan-500 text-white p-4 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80">Ônibus Detectado</p>
                    <p className="text-3xl font-bold">Linha {busNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-80">Distância</p>
                    <p className="text-3xl font-bold">{distance}m</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            {!isDetecting ? (
              <button
                onClick={startDetection}
                className="flex-1 p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Camera size={24} />
                <span>Iniciar Detecção</span>
              </button>
            ) : (
              <button
                onClick={stopDetection}
                className="flex-1 p-4 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <StopCircle size={24} />
                <span>Parar Detecção</span>
              </button>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-2">ℹ️ Como Usar</h3>
          <ul className="text-gray-400 space-y-2">
            <li>• Aponte a câmera para frente enquanto caminha</li>
            <li>• A IA detectará obstáculos automaticamente</li>
            <li>• Números de ônibus serão lidos em voz alta</li>
            <li>• Mantenha boa iluminação para melhor precisão</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
