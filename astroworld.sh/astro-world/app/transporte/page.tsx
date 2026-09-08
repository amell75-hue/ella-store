import { useState } from 'react';
import Layout from '../components/Layout';
import { Bus, Clock, MapPin } from 'lucide-react';

export default function TransportPage() {
  const [buses, setBuses] = useState([
    { line: '705', destination: 'Centro', time: 5, distance: '200m' },
    { line: '302', destination: 'Aeroporto', time: 8, distance: '350m' },
    { line: '150', destination: 'Shopping', time: 12, distance: '500m' },
    { line: '801', destination: 'Universidade', time: 15, distance: '800m' }
  ]);

  return (
    <Layout>
      <div className="space-y-6 pb-20 lg:pb-6">
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-6">
          <h1 className="text-3xl font-bold mb-2">🚌 Transporte Público</h1>
          <p className="text-gray-400">Ônibus próximos e horários em tempo real</p>
        </div>

        <div className="space-y-4">
          {buses.map((bus, index) => (
            <div
              key={index}
              className="bg-[#1a1f3a] border border-gray-800 rounded-2xl p-6 hover:border-cyan-500/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl">
                    <Bus size={32} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-cyan-500">Linha {bus.line}</h3>
                    <p className="text-gray-400 flex items-center gap-2 mt-1">
                      <MapPin size={16} />
                      {bus.destination}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-5xl font-bold text-green-500">{bus.time} min</p>
                  <p className="text-gray-400 flex items-center justify-end gap-2 mt-1">
                    <Clock size={16} />
                    {bus.distance}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-2">ℹ️ Como Funciona</h3>
          <ul className="text-gray-400 space-y-2">
            <li>• Informações atualizadas a cada 30 segundos</li>
            <li>• Use a câmera para ler números de ônibus</li>
            <li>• Receba alertas quando seu ônibus estiver próximo</li>
            <li>• Configure suas linhas favoritas nas configurações</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
