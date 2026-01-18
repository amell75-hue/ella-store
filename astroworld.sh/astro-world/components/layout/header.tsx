import Link from 'next/link'
import { Menu } from 'lucide-react'

export default function Header() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            AstroWorld
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="hover:text-blue-600 transition">
              Início
            </Link>
            <Link href="/sobre" className="hover:text-blue-600 transition">
              Sobre
            </Link>
            <Link href="/recursos" className="hover:text-blue-600 transition">
              Recursos
            </Link>
            <Link href="/contato" className="hover:text-blue-600 transition">
              Contato
            </Link>
          </nav>

          <button className="md:hidden">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  )
}
