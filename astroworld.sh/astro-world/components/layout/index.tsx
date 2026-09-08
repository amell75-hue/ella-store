import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Cloud, Satellite, Bus, Camera, MapPin, Zap } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [astronauts, setAstronauts] = useState<number>(12);
  const [weather, setWeather] = useState({
    temp: 22,
    condition: 'Ensolarado',
    humidity: 65,
    wind: 12,
    city: 'Lisboa'
  });
  const [loading, setLoading] = useState(true);

  // Buscar astronautas no espaço
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
  }, []);

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in pb-20 lg:pb-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/30 rounded-2xl p-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            Bem-vindo ao AstroWorld 🌍
          </h1>
          <p className="text-gray-400 text-lg md:text-xl">
            Seu assistente pessoal para meteorologia, astronomia e navegação acessível
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <span className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-full text-sm font-medium">
              ✓ Acessível
            </span>
            <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
              ✓ Gratuito
            </span>
            <span className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium">
              ✓ Tempo Real
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Weather Card */}
          <Link href="/weather">
            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <Cloud size={40} className="text-orange-500" />
                <span className="text-5xl font-bold">{weather.temp}°C</span>
              </div>
              <h3 className="text-xl font-semibold mb-1">Clima Atual</h3>
              <p className="text-gray-400 mb-2">{weather.condition}</p>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>💧 {weather.humidity}%</span>
                <span>💨 {weather.wind}km/h</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">📍 {weather.city}</p>
            </div>
          </Link>

          {/* Space Card */}
          <Link href="/space">
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <Satellite size={40} className="text-purple-500" />
                <span className="text-5xl font-bold">{loading ? '...' : astronauts}</span>
              </div>
              <h3 className="text-xl font-semibold mb-1">No Espaço</h3>
              <p className="text-gray-400 mb-2">Pessoas agora</p>
              <p className="text-sm text-gray-500 mt-2">🛰️ Estação Espacial Internacional</p>
            </div>
          </Link>

          {/* Transport Card */}
          <Link href="/transport">
            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <Bus size={40} className="text-cyan-500" />
                <span className="text-5xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-1">Próximos</h3>
              <p className="text-gray-400 mb-2">Ônibus chegando</p>
              <p className="text-sm text-gray-500 mt-2">🚌 Linha 705 - 5 min</p>
            </div>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Camera Detection */}
          <Link href="/camera">
            <div className="bg-[#1a1f3a] border border-gray-800 rounded-2xl p-6 hover:border-green-500/50 transition-all cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg shadow-green-500/30">
                  <Camera size={28} className="text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Detecção com IA</h3>
                  <p className="text-gray-400">Identifique obstáculos e ônibus</p>
                </div>
              </div>
              <ul className="text-gray-300 space-y-3">
                <li className="flex items-center gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Detecta obstáculos até 20m</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Lê números de ônibus em tempo real</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Reconhece cores e objetos</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Narração por voz automática</span>
                </li>
              </ul>
            </div>
          </Link>

          {/* Maps */}
          <Link href="/maps">
            <div className="bg-[#1a1f3a] border border-gray-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg shadow-blue-500/30">
                  <MapPin size={28} className="text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Mapas Acessíveis</h3>
                  <p className="text-gray-400">Navegação com voz</p>
                </div>
              </div>
              <ul className="text-gray-300 space-y-3">
                <li className="flex items-center gap-3">
                  <span className="text-blue-500 text-xl">✓</span>
                  <span>GPS em tempo real</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-blue-500 text-xl">✓</span>
                  <span>Rotas acessíveis otimizadas</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-blue-500 text-xl">✓</span>
                  <span>Alertas de perigos no caminho</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-blue-500 text-xl">✓</span>
                  <span>Navegação passo a passo</span>
                </li>
              </ul>
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#1a1f3a] border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="text-yellow-500" size={28} />
            <h3 className="text-2xl font-bold">Ações Rápidas</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/camera">
              <button className="w-full p-6 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl text-white font-semibold hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-105 transition-all text-lg">
                📸 Câmera IA
              </button>
            </Link>
            <Link href="/weather">
              <button className="w-full p-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl text-white font-semibold hover:shadow-xl hover:shadow-orange-500/30 hover:scale-105 transition-all text-lg">
                🌡️ Ver Clima
              </button>
            </Link>
            <Link href="/space">
              <button className="w-full p-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl text-white font-semibold hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 transition-all text-lg">
                🌙 Espaço
              </button>
            </Link>
            <Link href="/transport">
              <button className="w-full p-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl text-white font-semibold hover:shadow-xl hover:shadow-green-500/30 hover:scale-105 transition-all text-lg">
                🚌 Ônibus
              </button>
            </Link>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-3">ℹ️ Sobre o AstroWorld</h3>
          <p className="text-gray-400 leading-relaxed">
            Plataforma gratuita desenvolvida para auxiliar pessoas com deficiência visual 
            a navegar com segurança, acessar informações meteorológicas e astronômicas, 
            e utilizar transporte público com autonomia. Toda a interface é otimizada para 
            leitores de tela e navegação por voz.
          </p>
        </div>
      </div>
    </Layout>
  );
}
