export default function Footer() {
  return (
    <footer className="border-t bg-gray-50 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">AstroWorld</h3>
            <p className="text-gray-600">
              Plataforma acessível e inclusiva para todos.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Links Rápidos</h4>
            <ul className="space-y-2 text-gray-600">
              <li>Início</li>
              <li>Sobre</li>
              <li>Recursos</li>
              <li>Contato</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Contato</h4>
            <p className="text-gray-600">
              Email: contato@astroworld.com
            </p>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-8 text-center text-gray-600">
          <p>&copy; 2026 AstroWorld. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
