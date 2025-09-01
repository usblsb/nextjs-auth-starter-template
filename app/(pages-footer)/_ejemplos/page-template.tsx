import { Metadata } from "next";
import Header from "../../components/layouts/header";
import Footer from "../../components/layouts/footer";
import "@/styles/pages-footer.css";
import { contenidoPagesFooter } from "./contenido";

export async function generateMetadata(): Promise<Metadata> {
	const title = "[TÍTULO DE LA PÁGINA]";
	const description = "[DESCRIPCIÓN DE LA PÁGINA]";

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			type: "website",
		},
		robots: {
			index: false,
			follow: false,
			noarchive: true,
			nocache: true,
			nosnippet: true,
			noimageindex: true,
			notranslate: true,
		},
	};
}

export default function PaginaFooter() {
	return (
		<div className="flex flex-col min-h-screen">
			<Header />
			<main className="flex-1">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="lg:grid lg:grid-cols-12 lg:gap-8">
						<div className="lg:col-span-12">
							<div className="mt-8 max-w-4xl mx-auto text-left space-y-6">
								{contenidoPagesFooter}
							</div>
						</div>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	);
}

/*
INSTRUCCIONES PARA EL LLM:

1. Reemplazar [TÍTULO DE LA PÁGINA] con el título específico
2. Reemplazar [DESCRIPCIÓN DE LA PÁGINA] con la descripción específica
3. Importar el contenido desde un archivo separado (contenido.tsx)
4. Mantener la estructura de layout con Header y Footer
5. Conservar las clases CSS y la estructura responsive
6. Asegurar que los metadatos tengan robots noindex/nofollow
7. El archivo de contenido debe exportar una constante llamada 'contenidoPagesFooter'
*/
