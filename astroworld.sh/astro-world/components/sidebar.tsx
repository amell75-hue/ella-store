import Link from 'next/link';
import { useRouter } from 'next/router';
import { Home, Camera, Cloud, Satellite, Bus, Map, Settings } from 'lucide-react';

export default function Sidebar() {
  const router = useRouter();

  const menuItems = [
    { icon: Home, label: 'Início', href: '/' },
    { icon: Camera, label: 'Câmera IA', href: '/camera' },
    { icon: Cloud, label: 'Meteorologia', href: '/weather' },
    { icon: Satellite, label: 'Astronomia', href: '/space' },
    { icon: Bus, label: 'Transporte', href: '/transport' },
    { icon: Map, label: 'Mapas', href: '/maps' },
    { icon: Settings, label: 'Configurações', href: '/settings' },
  ];

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-[#1a1f3a] border-r border-gray-800">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-800">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              🌍 AstroWorld
            </h1>
          </div>

          {/* Menu */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = router.pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                      : 'text-gray-400 hover:bg-[#0a0e27] hover:text-white'
                  }`}
                  aria-label={item.label}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800">
            <p className="text-xs text-gray-500 text-center">
              AstroWorld v2.0<br />
              Acessível para todos
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1a1f3a] border-t border-gray-800 z-50">
        <div className="flex justify-around items-center h-16">
          {menuItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = router.pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full ${
                  isActive ? 'text-cyan-500' : 'text-gray-400'
                }`}
                aria-label={item.label}
              >
                <Icon size={24} />
                <span className="text-xs mt-1">{item.label.split(' ')[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
