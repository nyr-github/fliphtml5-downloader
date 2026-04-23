import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--color-secondary)] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Developer Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Developer</h3>
            <p className="text-gray-300">
              This project is developed by{" "}
              <a
                href="https://aivaded.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors"
              >
                aivaded.com
              </a>
            </p>
          </div>

          {/* Quick Navigation */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/qa"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/all-apps"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  All Apps
                </Link>
              </li>
            </ul>
          </div>

          {/* Copyright Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Copyright</h3>
            <p className="text-gray-300">
              © {currentYear} aivaded.com. All rights reserved.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Reproduction or use of this project code without permission is
              prohibited.
            </p>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-300">
          <p>
            © {currentYear}{" "}
            <a
              href="https://aivaded.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              aivaded.com
            </a>
            . All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
