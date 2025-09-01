import { SignOutButton } from "@clerk/nextjs";
import { Metadata } from "next";
import Header from "../../_template/components/header";
import { Footer } from "../../_template/components/footer";

export async function generateMetadata(): Promise<Metadata> {
	const title = "Cerrar Sesión | Electrónica School";
	const description = "Cerrar sesión de tu cuenta de Electrónica School.";

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
										<SignOutButton>
											<button className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium transition-colors duration-200">
												Cerrar Sesión
											</button>
										</SignOutButton>
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
