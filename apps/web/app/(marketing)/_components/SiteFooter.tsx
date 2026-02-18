"use client";

import Link from "next/link";
import { Twitter, Github, Linkedin, Disc } from "lucide-react";

export function SiteFooter() {
	return (
		<footer className="py-12 border-t border-border bg-muted/20">
			<div className="container mx-auto px-4 max-w-7xl">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
					<div className="col-span-2 md:col-span-1">
						<div className="flex items-center gap-2 mb-4">
							<div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs font-bold">
								H
							</div>
							<span className="font-bold text-lg">HypeMind</span>
						</div>
						<p className="text-sm text-muted-foreground mb-4">
							The operating system for high-performing teams and individuals.
						</p>
						<div className="flex gap-4">
							<Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
								<Twitter className="w-5 h-5" />
							</Link>
							<Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
								<Github className="w-5 h-5" />
							</Link>
							<Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
								<Disc className="w-5 h-5" />
							</Link>
						</div>
					</div>

					<div>
						<h4 className="font-semibold mb-4">Product</h4>
						<ul className="space-y-2 text-sm text-muted-foreground">
							<li><Link href="#" className="hover:text-foreground">Features</Link></li>
							<li><Link href="#" className="hover:text-foreground">Integrations</Link></li>
							<li><Link href="#" className="hover:text-foreground">Pricing</Link></li>
							<li><Link href="#" className="hover:text-foreground">Changelog</Link></li>
							<li><Link href="#" className="hover:text-foreground">Docs</Link></li>
						</ul>
					</div>

					<div>
						<h4 className="font-semibold mb-4">Company</h4>
						<ul className="space-y-2 text-sm text-muted-foreground">
							<li><Link href="#" className="hover:text-foreground">About</Link></li>
							<li><Link href="#" className="hover:text-foreground">Blog</Link></li>
							<li><Link href="#" className="hover:text-foreground">Careers</Link></li>
							<li><Link href="#" className="hover:text-foreground">Customers</Link></li>
							<li><Link href="#" className="hover:text-foreground">Contact</Link></li>
						</ul>
					</div>

					<div>
						<h4 className="font-semibold mb-4">Legal</h4>
						<ul className="space-y-2 text-sm text-muted-foreground">
							<li><Link href="#" className="hover:text-foreground">Privacy</Link></li>
							<li><Link href="#" className="hover:text-foreground">Terms</Link></li>
							<li><Link href="#" className="hover:text-foreground">Security</Link></li>
						</ul>
					</div>
				</div>

				<div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
					<p className="text-sm text-muted-foreground">
						© {new Date().getFullYear()} HypeMind Inc. All rights reserved.
					</p>
					<div className="flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-green-500" />
						<span className="text-sm font-medium text-muted-foreground">All systems operational</span>
					</div>
				</div>
			</div>
		</footer>
	);
}
