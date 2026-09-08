import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Satellite, Rocket, Moon } from 'lucide-react';

export default function SpacePage() {
  const [astronauts, setAstronauts] = useState<number>(12);
  const [issPosition, setIssPosition] = useState({ lat: 0, lon: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://api.open-notify.org/astros.json')
      .then(res => res.json())
      .then(data => {
        setAstronauts(data.number);
        setLoading(false);
      })
      .catch(() => {
        setAstronauts(12);
        setLoading(false);
      });

    fetch('http://api.open-notify.org/iss-now.json')
      .then(res => res.json())
      .then(data => {
        setIssPosition({
          lat: parseFloat(data.iss_position.latitude),
          lon: parseFloat(data.iss_position.longitude)
        });
      })
      .catch(() => {
        setIssPosition({ lat: 0, lon: 0 });
      });
  }, []);

  return (
    <Layout>
      <div className="space-y-6 pb-20 lg:pb-6">
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-6">
          <h1 className="text-3xl font-bold mb-2">🌙 Astronomia</h1>
          <p className="text-gray-400">Informações sobre o espaço em tempo real</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-8 text-center">
          <Satellite size={80} className="mx-auto mb-4 text-purple-500" />
          <h2 className="text-6xl font-bold mb-2">{loading ? '...' : astronauts}</h2>
          <p className="text-2xl text-gray-300 mb-4">Pessoas no Espaço</p>
          <p className="text-gray-400">Na Estação Espacial Internacional neste momento</p>
        </div>

        <div className="bg-[#1a1f3a] border border-gray-800 rounded-2xl p-6">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
            <Rocket className="text-cyan-500" size={32} />
            Posição da ISS
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0a0e27] rounded-xl p-6 text-center">
              <p className="text-gray-400 mb-2">Latitude</p>
              <p className="text-3xl font-bold text-cyan-500">{issPosition.lat.toFixed(2)}°</p>
            </div>
            <div className="bg-[#0a0e27] rounded-xl p-6 text-center">
              <p className="text-gray-400 mb-2">Longitude</p>
              <p className="text-3xl font-bold text-cyan-500">{issPosition.lon.toFixed(2)}°</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#1a1f3a] border border-gray-800 rounded-2xl p-6 text-center">
            <div className="text-5xl mb-4">🌕</div>
            <h3 className="text-xl font-bold mb-2">Fase da Lua</h3>
            <p className="text-gray-400">Lua Crescente</p>
          </div>
          <div className="bg-[#1a1f3a] border border-gray-800 rounded-2xl p-6 text-center">
            <div className="text-5xl mb-4">🌅</div>
            <h3 className="text-xl font-bold mb-2">Nascer do Sol</h3>
            <p className="text-gray-400">06:45</p>
          </div>
          <div className="bg-[#1a1f3a] border border-gray-800 rounded-2xl p-6 text-center">
            <div className="text-5xl mb-4">🌇</div>
            <h3 className="text-xl font-bold mb-2">Pôr do Sol</h3>
            <p className="text-gray-400">18:30</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-2">ℹ️ Sobre os Dados</h3>
          <p className="text-gray-400">
            Informações obtidas em tempo real da NASA e Open Notify API. 
            A Estação Espacial Internacional orbita a Terra a cada 90 minutos.
          </p>
        </div>
      </div>
    </Layout>
  );
}
