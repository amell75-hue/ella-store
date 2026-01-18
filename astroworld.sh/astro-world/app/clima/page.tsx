import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Cloud, CloudRain, Wind, Droplets, Sun } from 'lucide-react';

export default function WeatherPage() {
  const [currentWeather, setCurrentWeather] = useState({
    temp: 22,
    condition: 'Parcialmente nublado',
    humidity: 65,
    wind: 12,
    pressure: 1013,
    visibility: 10,
    feelsLike: 24,
    uv: 5
  });

  const [forecast, setForecast] = useState([
    { day: 'Seg', temp: 23, icon: '☀️', condition: 'Ensolarado' },
    { day: 'Ter', temp: 21, icon: '⛅', condition: 'Parcial' },
    { day: 'Qua', temp: 19, icon: '🌧️', condition: 'Chuva' },
    { day: 'Qui', temp: 20, icon: '⛅', condition: 'Parcial' },
    { day: 'Sex', temp: 24, icon: '☀️', condition: 'Ensolarado' },
    { day: 'Sáb', temp: 25, icon: '☀️', condition: 'Ensolarado' },
    { day: 'Dom', temp: 22, icon: '⛅', condition: 'Parcial' }
  ]);

  return (
    <Layout>
      <div className="space-y-6 pb-20 lg:pb-6">
        <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-2xl p-6">
          <h1 className="text-3xl font-bold mb-2">🌡️ Meteorologia</h1>
          <p className="text-gray-400">Previsão completa e alertas meteorológicos</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="text-8xl mb-4">☀️</div>
            <h2 className="text-6xl font-bold mb-2">{currentWeather.temp}°C</h2>
            <p className="text-2xl text-gray-300">{currentWeather.condition}</p>
            <p className="text-gray-400 mt-2">Sensação térmica: {currentWeather.feelsLike}°C</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black/20 rounded-xl p-4 text-center">
              <Droplets className="mx-auto mb-2 text-blue-400" size={24} />
              <p className="text-sm text-gray-400">Umidade</p>
              <p className="text-2xl font-bold">{currentWeather.humidity}%</p>
            </div>
            <div className="bg-black/20 rounded-xl p-4 text-center">
              <Wind className="mx-auto mb-2 text-cyan-400" size={24} />
              <p className="text-sm text-gray-400">Vento</p>
              <p className="text-2xl font-bold">{currentWeather.wind} km/h</p>
            </div>
            <div className="bg-black/20 rounded-xl p-4 text-center">
              <Cloud className="mx-auto mb-2 text-gray-400" size={24} />
              <p className="text-sm text-gray-400">Pressão</p>
              <p className="text-2xl font-bold">{currentWeather.pressure} hPa</p>
            </div>
            <div className="bg-black/20 rounded-xl p-4 text-center">
              <Sun className="mx-auto mb-2 text-yellow-400" size={24} />
              <p className="text-sm text-gray-400">UV</p>
              <p className="text-2xl font-bold">{currentWeather.uv}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1f3a] border border-gray-800 rounded-2xl p-6">
          <h3 className="text-2xl font-bold mb-6">Previsão 7 Dias</h3>
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
            {forecast.map((day, index) => (
              <div
                key={index}
                className="bg-[#0a0e27] rounded-xl p-4 text-center hover:bg-[#1a1f3a] transition-colors"
              >
                <p className="font-semibold mb-2">{day.day}</p>
                <div className="text-4xl my-3">{day.icon}</div>
                <p className="text-
