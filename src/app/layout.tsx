import "~/styles/globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";

import type { Metadata } from "next";
import { Noto_Sans, Nunito_Sans } from "next/font/google";

import { Toaster } from "~/components/ui/toast";

import { TRPCReactProvider } from "~/trpc/react";

const nunitoSans = Nunito_Sans({
	subsets: ["latin"],
	variable: "--font-nunito-sans",
});
const notoSans = Noto_Sans({
	subsets: ["latin"],
	variable: "--font-noto-sans",
});

export const metadata: Metadata = {
	title: "Tubby Boy Studios",
	description: "Independent game studio",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className={`${nunitoSans.variable} ${notoSans.variable}`}>
			<body className="antialiased">
				<ClerkProvider>
					<TRPCReactProvider>{children}</TRPCReactProvider>
					{process.env.NODE_ENV === "production" && <Analytics />}
				</ClerkProvider>
				<Toaster />
			</body>
		</html>
	);
}
