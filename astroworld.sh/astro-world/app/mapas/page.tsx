import { useState } from 'react';
import Layout from '../components/Layout';
import { MapPin, Navigation, AlertTriangle } from 'lucide-react';

export default function MapsPage() {
  const [location, setLocation] = useState({ lat: 38.7223, lon: -9.1393 });

  return (
    <Layout>
      <div className="space-y-6 pb-20 lg:pb-6">
        <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30 rounded-2xl p-6">
          <h1 className="text-3xl font-bold mb-2">🗺️ Mapas Acessíveis</h1>
          <p className="text-gray-400">Navegação com voz e rotas otimizadas</p>
        </div>

        <div className="bg-[#1a1f3a] border border-gray-800 rounded-2xl p-6">
          <div className="aspect-video bg-gradient-to-br from-blue-900 to-indigo-900 rounded-xl flex items-center justify-center mb-4">
            <div className="text-center">
              <MapPin size={64} className="text-blue-500 mx-auto mb-4" />
              <p className="text-gray-300 text-xl">Mapa Interativo</p>
              <p className="text-gray-500">Lisboa, Portugal</p>
            </div>
          </div>
          
          <button className="w-full p-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-xl hover:shadow-xl transition-all flex items-center justify-center gap-2">
            <Navigation size={24} />
            <span>Iniciar Navegação</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#1a1f3a] border border-gray-800 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
              <MapPin className="text-blue-500" size={28} />
              Localização Atual
            </h3>
            <div className="space-y-3">
              <div className="bg-[#0a0e27] rounded-lg p-4">
                <p className="text-gray-400 text-sm">Latitude</p>
                <p className="text-2xl font-bold text-blue-500">{location.lat.toFixed(4)}°</p>
              </div>
              <div className="bg-[#0a0e27] rounded-lg p-4">
                <p className="text-gray-400 text-sm">Longitude</p>
                <p className="text-2xl font-bold text-blue-500">{location.lon.toFixed(4)}°</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1f3a] border border-gray-800 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
              <AlertTriangle className="text-yellow-500" size={28} />
              Alertas de Rota
            </h3>
            <div className="space-y-3">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-500 font-semibold">⚠️ Obras na via</p>
                <p className="text-gray-400 text-sm mt-1">Rua Augusta - 200m à frente</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-500 font-semibold">✓ Via segura</p>
                <p className="text-gray-400 text-sm mt-1">Calçadas acessíveis</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-2">ℹ️ Recursos</h3>
          <ul className="text-gray-400 space-y-2">
            <li>• Navegação passo a passo com voz</li>
            <li>• Rotas otimizadas para acessibilidade</li>
            <li>• Alertas de obstáculos e perigos</li>
            <li>• Informações de pontos de interesse</li>
            <li>• Funciona offline com mapas baixados</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
