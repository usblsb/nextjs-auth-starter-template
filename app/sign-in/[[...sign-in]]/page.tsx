import { SignIn } from "@clerk/nextjs";
import { Metadata } from "next";
import Header from "../../components/layouts/header";
import { Footer } from "../../_template/components/footer";

export async function generateMetadata(): Promise<Metadata> {
	const title = "Iniciar Sesión | Electrónica School";
	const description =
		"Inicia sesión en tu cuenta de Electrónica School para acceder a todos los cursos.";

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

export default function Page() {
	return (
		<>
			<div className="flex flex-col min-h-screen">
				<Header />
				<main className="flex-1">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="lg:grid lg:grid-cols-12 lg:gap-8">
							<div className="lg:col-span-12">
								<div className="mt-8 max-w-4xl mx-auto text-center space-y-6">
									<div className="flex justify-center py-12">
										<SignIn />
									</div>
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
