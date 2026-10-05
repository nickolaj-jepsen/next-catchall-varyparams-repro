import Link from "next/link";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav>
          {/* A full prefetch of the catch-all's index page is what poisons the cache. */}
          <Link href="/" prefetch={true} id="link-index">
            Index (prefetch=true)
          </Link>{" "}
          <Link href="/b" id="link-b">
            /b (default prefetch)
          </Link>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
