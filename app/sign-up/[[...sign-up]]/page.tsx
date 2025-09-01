import { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import Header from "../../_template/components/header";
import { Footer } from "../../_template/components/footer";

export async function generateMetadata(): Promise<Metadata> {
	const title = "Registro | Academia de Electrónica";
	const description =
		"Crea tu cuenta en Academia de Electrónica y accede a los mejores cursos técnicos de electrónica online.";

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

export default function SignUpPage() {
	return (
		<>
			<div className="flex flex-col min-h-screen">
				<Header />
				<main className="flex-1">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="lg:grid lg:grid-cols-12 lg:gap-8">
							<div className="lg:col-span-12">
								<div className="mt-8 max-w-4xl mx-auto text-center space-y-6">
									<SignUp />
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
