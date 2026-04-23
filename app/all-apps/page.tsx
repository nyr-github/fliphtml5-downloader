import Link from "next/link";
import { Metadata } from "next";

interface Project {
  id: string;
  name: string;
  description: string;
  coreFeatures: string[];
  appUrl: string;
  iconUrl: string;
}

interface ProjectsData {
  "zh-CN": Project[];
  en: Project[];
}

// Generate page metadata (SEO-friendly)
export const metadata: Metadata = {
  title: "AIVaded Product Family - Explore More Tools and Applications",
  description:
    "Explore more excellent tools and applications developed by the AIVaded team, including NextPage and more.",
  keywords: ["AIVaded", "Products", "Tools", "Applications", "NextPage"],
};

// Server-side data fetching (static generation, SEO-friendly)
async function getProjects(lang: "zh-CN" | "en" = "en"): Promise<Project[]> {
  try {
    const response = await fetch("https://www.aivaded.com/api/projects", {
      next: { revalidate: 3600 }, // Revalidate every 1 hour (ISR)
    });

    if (!response.ok) {
      throw new Error("Failed to fetch projects");
    }

    const data: ProjectsData = await response.json();

    // Select data based on language, fallback to English
    return data[lang] || data["en"] || [];
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

export default async function AllAppsPage() {
  // Server-side fetch English data (can implement multi-language via route prefix)
  const projects = await getProjects("en");

  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-[var(--color-text)] mb-4">
              AIVaded Product Family
            </h1>
            <p className="text-lg text-[var(--color-text-secondary)]">
              No projects available at the moment. Please try again later.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center text-[var(--color-primary)] hover:text-[var(--color-primary-light)] font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[var(--color-text)] mb-4">
            AIVaded Product Family
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)]">
            Explore more tools and applications we&apos;ve developed
          </p>
        </div>

        {/* Project List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <a
              key={project.id}
              href={project.appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-[var(--color-surface)] rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-[var(--color-border)] hover:border-[var(--color-primary)]/30"
            >
              <div className="p-6">
                {/* Icon and Name */}
                <div className="flex items-start space-x-4 mb-4">
                  <img
                    src={project.iconUrl}
                    alt={project.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--color-text)] mb-1">
                      {project.name}
                    </h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {project.description}
                    </p>
                  </div>
                </div>

                {/* Core Features */}
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Core Features
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {project.coreFeatures.map((feature, index) => (
                      <span
                        key={index}
                        className="inline-block px-3 py-1 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Visit Link */}
                <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                  <span className="text-[var(--color-primary)] hover:text-[var(--color-primary-light)] font-medium text-sm">
                    Visit App →
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Back Link */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-[var(--color-primary)] hover:text-[var(--color-primary-light)] font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
