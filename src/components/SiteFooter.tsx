import Link from "next/link";

export function SiteFooter() {
    return (
        <footer className="border-t">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-12">
                <p>© {new Date().getFullYear()} Resumely</p>
                <nav aria-label="Footer" className="flex flex-wrap gap-4">
                    <Link href="/jobs" className="hover:text-foreground">
                        Browse jobs
                    </Link>
                    <Link href="/sign-up" className="hover:text-foreground">
                        Get matched
                    </Link>
                    <Link href="/sign-in" className="hover:text-foreground">
                        Sign in
                    </Link>
                </nav>
            </div>
        </footer>
    );
}
