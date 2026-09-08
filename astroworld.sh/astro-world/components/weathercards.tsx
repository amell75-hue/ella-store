interface WeatherCardProps {
  temp: number;
  condition: string;
  humidity: number;
  wind: number;
  city: string;
}

export default function WeatherCard({ temp, condition, humidity, wind, city }: WeatherCardProps) {
  return (
    <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl p-6">
      <div className="text-center mb-4">
        <div className="text-6xl mb-2">☀️</div>
        <h3 className="text-4xl font-bold">{temp}°C</h3>
        <p className="text-gray-300 mt-1">{condition}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-black/20 rounded-lg p-3 text-center">
          <p className="text-gray-400">Umidade</p>
          <p className="text-xl font-bold">{humidity}%</p>
        </div>
        <div className="bg-black/20 rounded-lg p-3 text-center">
          <p className="text-gray-400">Vento</p>
          <p className="text-xl font-bold">{wind} km/h</p>
        </div>
      </div>
      
      <p className="text-center text-gray-400 mt-4">📍 {city}</p>
    </div>
  );
}
