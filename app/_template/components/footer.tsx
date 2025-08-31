import Link from "next/link";

export function Footer() {
	return (
		<footer className="bg-white w-full mx-auto pt-6 border-t border-[#EEEEF0] flex justify-between pb-24">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				<nav className="flex flex-wrap justify-center items-center gap-4 md:gap-6 lg:gap-8 mb-4">
					<Link
						href="/web-politica-privacidad"
						className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
						rel="noopener noreferrer nofollow"
					>
						Política de privacidad
					</Link>
					<Link
						href="/web-aviso-legal"
						className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
						rel="noopener noreferrer nofollow"
					>
						Aviso Legal
					</Link>
					<Link
						href="/web-condiciones-venta"
						className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
						rel="noopener noreferrer nofollow"
					>
						Condiciones de Venta y Uso
					</Link>
					<Link
						href="/web-politica-cookies"
						className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
						rel="noopener noreferrer nofollow"
					>
						Política de Cookies
					</Link>
					<Link
						href="/web-preguntas-frecuentes"
						className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
						rel="noopener noreferrer nofollow"
					>
						Faq
					</Link>
					<Link
						href="/web-requisitos-tecnicos"
						className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
						rel="noopener noreferrer nofollow"
					>
						Requisitos técnicos
					</Link>
					<span className="text-sm font-medium text-gray-700">Blog</span>
					<Link
						href="/web-contactar"
						className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
						rel="noopener noreferrer nofollow"
					>
						Contactar
					</Link>
					<Link
						href="/#ajustar-cookies"
						className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
						rel="noopener noreferrer nofollow"
					>
						Ajustar Cookies
					</Link>
				</nav>
				<div className="text-center">
					<p className="text-sm text-gray-600">
						© 2020 - 2026 Cursos para Aprender Electrónica y Robótica Educativa.
					</p>
				</div>
			</div>
		</footer>
	);
}
