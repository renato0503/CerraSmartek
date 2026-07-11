import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Image
              src="/images/prevoya_logo.png"
              alt="Prévoya"
              width={180}
              height={45}
              className="mb-4 h-10 w-auto brightness-0 invert"
            />
            <p className="text-sm leading-relaxed text-gray-400">
              Inteligência de localização para o seu negócio decolar. Análise de concorrência, demografia e viabilidade em minutos.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Produto</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/#como-funciona" className="text-sm text-gray-400 transition-colors hover:text-white">
                  Como Funciona
                </Link>
              </li>
              <li>
                <Link href="/#planos" className="text-sm text-gray-400 transition-colors hover:text-white">
                  Planos
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="text-sm text-gray-400 transition-colors hover:text-white">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/wizard" className="text-sm text-gray-400 transition-colors hover:text-white">
                  Criar Relatório
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Contato</h3>
            <ul className="space-y-2.5">
              <li>
                <a href="mailto:contato@prevoya.com.br" className="text-sm text-gray-400 transition-colors hover:text-white">
                  contato@prevoya.com.br
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/5565963744450"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 transition-colors hover:text-white"
                >
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Legal</h3>
            <ul className="space-y-2.5">
              <li>
                <span className="text-sm text-gray-400">Termos de Uso</span>
              </li>
              <li>
                <span className="text-sm text-gray-400">Política de Privacidade</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-800 pt-8">
          <p className="text-center text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Prévoya. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
