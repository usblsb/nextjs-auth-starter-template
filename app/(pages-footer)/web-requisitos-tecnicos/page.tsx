import { Metadata } from "next";
import Header from "../../_template/components/header";
import { Footer } from "../../_template/components/footer";

import "@/styles/pages-footer.css";
import { contenidoPagesFooter } from "./contenido";

export async function generateMetadata(): Promise<Metadata> {
	const title = "Requisitos Técnicos | Electrónica School";
	const description =
		"Conoce los requisitos técnicos necesarios para acceder a nuestros cursos online.";

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
