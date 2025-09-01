import { Metadata } from "next";
import Header from "./_template/components/header";
import { Footer } from "./_template/components/footer";

export async function generateMetadata(): Promise<Metadata> {
	const title = "Academia de Electrónica | Electrónica School";
	const description =
		"Los mejores cursos técnicos necesarios para aprender Electrónica online.";

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			type: "website",
		},
		robots: {
			index: true,
			follow: true,
			noarchive: true,
			nocache: true,
			nosnippet: false,
			noimageindex: false,
			notranslate: true,
		},
	};
}

export default function Home() {
	return (
		<>
			<div className="flex flex-col min-h-screen">
				<Header />
				<main className="flex-1">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="lg:grid lg:grid-cols-12 lg:gap-8">
							<div className="lg:col-span-12">
								<div className="mt-8 max-w-4xl mx-auto text-left space-y-6">
									{/* Este es el lugar donde se muestra el contenido */}
								</div>
							</div>
						</div>
					</div>
				</main>
				<Footer />
			</div>
		</>
	);
}
