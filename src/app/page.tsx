"use server";

import Link from "next/link";
import { HydrateClient } from "~/trpc/server";
import { ContactForm } from "./_components/ContactForm";

export default async function Home() {
	return (
		<HydrateClient>
			<main className="min-h-screen bg-background text-foreground">
				<section className="relative flex min-h-svh flex-col overflow-hidden border-border/60 border-b px-6 py-6 lg:px-10">
					<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_42%,color-mix(in_oklab,var(--accent)_12%,transparent),transparent_25%)]" />
					<header className="relative z-10 flex items-center justify-between">
						<Link
							href="/"
							className="font-semibold text-foreground text-sm uppercase tracking-[0.2em]"
						>
							Tubby Boy Studios
						</Link>
						<nav className="flex items-center gap-3 text-muted-foreground text-xs uppercase tracking-[0.16em] sm:gap-6">
							<Link
								href="#contact"
								className="transition-colors hover:text-foreground"
							>
								Contact
							</Link>
						</nav>
					</header>
					<div className="relative z-10 flex flex-1 flex-col justify-center pt-24 pb-16">
						<p className="mb-8 text-(--studio-accent) text-xs uppercase tracking-[0.2em]">
							Independent game studio
						</p>
						<h1 className="max-w-6xl font-semibold text-[clamp(3.5rem,8vw,8rem)] text-foreground leading-[0.92] tracking-[-0.06em]">
							Creating Fun{" "}
							<span className="text-(--studio-accent)">Adventures</span> for All
						</h1>
						<div className="mt-12 flex items-end justify-between gap-8">
							<p className="max-w-md text-lg text-muted-foreground leading-8">
								Maybe a little blurb would look good here?
							</p>
						</div>
					</div>
					<div className="relative z-10 flex justify-between border-border/60 border-t pt-4 text-muted-foreground text-xs">
						<span>01</span>
						<span>Press play on the unknown</span>
						<span>Scroll to explore ↓</span>
					</div>
				</section>

				<section
					id="contact"
					className="mx-auto grid w-full max-w-7xl gap-14 px-6 py-24 lg:grid-cols-[0.85fr_1.15fr] lg:px-10 lg:py-36"
				>
					<div>
						<p className="mb-6 text-(--studio-accent) text-xs uppercase tracking-[0.2em]">
							02 / Contact
						</p>
						<h2 className="max-w-lg font-semibold text-5xl leading-[1.02] tracking-[-0.04em] sm:text-6xl">
							Drop us a <span className="text-(--studio-accent)">line</span>!
						</h2>
						<p className="mt-8 max-w-md text-lg text-muted-foreground leading-8">
							Have a project, a publishing question, or just a good idea?
							We&apos;d love to hear it.
						</p>
					</div>
					<ContactForm />
				</section>
			</main>
		</HydrateClient>
	);
}
