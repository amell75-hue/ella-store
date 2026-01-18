import { useState } from 'react';
import Layout from '../components/Layout';
import { Settings, Volume2, Bell, Eye, Globe } from 'lucide-react';

export default function SettingsPage() {
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [notifications, setNotifications] = useState(true);
  const [highContrast, setHighContrast] = useState(false);

  return (
    <Layout>
      <div className="space-y-6 pb-20 lg:pb-6">
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-6">
          <h1 className="text-3xl font-bold mb-2">⚙️ Configurações</h1>
          <p className="text-gray-400">Personalize sua experiência</p>
        </div>

        <div className="bg-[#1a1f3a] border border-gray-800 rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
            <Volume2 className="text-cyan-500" size={28} />
            Voz
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 block mb-2">Velocidade da Voz: {voiceSpeed.toFixed(1)}x</label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={voiceSpeed}
                onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#1a1f3a] border border-gray-800 rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
            <Bell className="text-yellow-500" size={28} />
            Notificações
          </h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-300">Alertas de Ônibus</span>
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="w-6 h-6"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-300">Alertas Meteorológicos</span>
              <input type="checkbox" defaultChecked className="w-6 h-6" />
            </label>
          </div>
        </div>

        <div className="bg-[#1a1f3a] border border-gray-800 rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
            <Eye className="text-green-500" size={28} />
            Acessibilidade
          </h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-300">Alto Contraste</span>
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                className="w-6 h-6"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-300">Texto Grande</span>
              <input type="checkbox" className="w-6 h-6" />
            </label>
          </div>
        </div>

        <div className="bg-[#1a1f3a] border border-gray-800 rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
            <Globe className="text-blue-500" size={28} />
            Idioma
          </h3>
          <select className="w-full p-3 bg-[#0a0e27] border border-gray-700 rounded-lg text-white">
            <option>Português (PT)</option>
            <option>Português (BR)</option>
            <option>English</option>
            <option>Español</option>
          </select>
        </div>

        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-2">ℹ️ Sobre</h3>
          <p className="text-gray-400">
            AstroWorld v2.0<br />
            Plataforma acessível para meteorologia, astronomia e navegação<br />
            © 2026 - Todos os direitos reservados
          </p>
        </div>
      </div>
    </Layout>
  );
}
