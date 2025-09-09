import { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import Header from "../../components/layouts/header";
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

export default function SignUpPage() {
	return (
		<>
			<div className="flex flex-col min-h-screen">
				<Header />
				<main className="flex-1">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="lg:grid lg:grid-cols-12 lg:gap-8">
							<div className="lg:col-span-12">
								<div className="flex justify-center py-12">
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
