import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const BASE = "https://www.guru-sishya.in";

export const metadata: Metadata = {
  title:
    "Cloud & DevOps Interview Questions (2026) — AWS, Docker, Kubernetes Guide | Guru Sishya",
  description:
    "20 most-asked cloud and DevOps interview questions with answers. Covers AWS (EC2, S3, Lambda, IAM, VPC), Docker, Kubernetes, CI/CD pipelines, Terraform, and Infrastructure as Code.",
  keywords: [
    "cloud interview questions",
    "devops interview questions",
    "AWS interview questions",
    "Docker interview questions",
    "Kubernetes interview questions",
    "CI/CD interview questions",
    "Terraform interview questions",
    "cloud computing interview",
    "infrastructure as code",
    "devops engineer interview",
  ],
  alternates: { canonical: `${BASE}/cloud-devops-interview` },
  openGraph: {
    title: "Cloud & DevOps Interview Questions (2026) | Guru Sishya",
    description:
      "Master 20 essential cloud & DevOps interview questions covering AWS, Docker, Kubernetes, CI/CD, and Terraform. Free lessons and practice.",
    url: `${BASE}/cloud-devops-interview`,
    type: "website",
    siteName: "Guru Sishya",
    images: [{ url: `${BASE}/api/og`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cloud & DevOps Interview Questions (2026) | Guru Sishya",
    description:
      "Master 20 essential cloud & DevOps questions covering AWS, Docker, Kubernetes, CI/CD, and Terraform.",
    images: [`${BASE}/api/og`],
  },
};

// ── Interview questions ──────────────────────────────────────────────────────

interface DevOpsQuestion {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const DEVOPS_QUESTIONS: DevOpsQuestion[] = [
  // AWS Services
  {
    id: 1,
    question: "What is the difference between EC2 and Lambda?",
    answer:
      "EC2 provides virtual servers where you manage the OS, scaling, and patching. Lambda is a serverless compute service that runs your code in response to events and automatically manages the underlying infrastructure. Lambda charges per invocation and execution time, while EC2 charges per hour or second of uptime regardless of utilization.",
    category: "AWS Services",
  },
  {
    id: 2,
    question: "Explain the different S3 storage classes and when to use each.",
    answer:
      "S3 Standard is for frequently accessed data. S3 Intelligent-Tiering automatically moves data between tiers. S3 Standard-IA and One Zone-IA are for infrequently accessed data. S3 Glacier and Glacier Deep Archive are for long-term archival with retrieval times from minutes to hours. Choose based on access frequency, retrieval time requirements, and cost constraints.",
    category: "AWS Services",
  },
  {
    id: 3,
    question: "What is IAM and how does it work in AWS?",
    answer:
      "IAM (Identity and Access Management) controls who can access AWS resources and what actions they can perform. It uses users, groups, roles, and policies. Policies are JSON documents that define permissions. Best practices include using least-privilege access, enabling MFA, using roles instead of long-lived access keys, and never using the root account for daily tasks.",
    category: "AWS Services",
  },
  {
    id: 4,
    question: "How does a VPC work and what are its key components?",
    answer:
      "A VPC (Virtual Private Cloud) is an isolated virtual network in AWS. Key components include subnets (public and private), route tables, internet gateways, NAT gateways, security groups (stateful firewalls), and network ACLs (stateless firewalls). Public subnets route to the internet gateway; private subnets use NAT gateways for outbound-only internet access.",
    category: "AWS Services",
  },
  // Docker
  {
    id: 5,
    question: "What is the difference between containers and virtual machines?",
    answer:
      "VMs virtualize hardware and run a full guest OS, consuming significant resources. Containers share the host OS kernel and isolate only the application and its dependencies, making them lightweight (MBs vs GBs), faster to start (seconds vs minutes), and more resource-efficient. Containers use Linux namespaces and cgroups for isolation.",
    category: "Docker",
  },
  {
    id: 6,
    question: "Explain the key instructions in a Dockerfile.",
    answer:
      "FROM sets the base image. WORKDIR sets the working directory. COPY/ADD copies files into the image. RUN executes commands during build. ENV sets environment variables. EXPOSE documents the port. CMD/ENTRYPOINT defines the default command. Each instruction creates a layer; minimizing layers and using multi-stage builds reduces image size.",
    category: "Docker",
  },
  {
    id: 7,
    question: "What are multi-stage builds and why are they important?",
    answer:
      "Multi-stage builds use multiple FROM statements in a single Dockerfile. You compile code in a build stage with all development dependencies, then copy only the compiled artifact into a minimal runtime image. This dramatically reduces final image size (e.g., from 1GB to 50MB), reduces attack surface, and keeps build tools out of production images.",
    category: "Docker",
  },
  {
    id: 8,
    question: "How does Docker networking work?",
    answer:
      "Docker provides several network drivers: bridge (default, isolated network on a single host), host (shares host network stack), overlay (multi-host networking for Swarm/Kubernetes), and none (no networking). Containers on the same bridge network can communicate by container name. Port mapping (-p) exposes container ports to the host.",
    category: "Docker",
  },
  // Kubernetes
  {
    id: 9,
    question: "What is a Pod in Kubernetes and why is it the smallest deployable unit?",
    answer:
      "A Pod is one or more containers that share the same network namespace, IP address, and storage volumes. It is the smallest deployable unit because Kubernetes schedules and manages Pods, not individual containers. Co-located containers in a Pod can communicate via localhost. Common patterns include sidecar containers for logging, proxying, or configuration.",
    category: "Kubernetes",
  },
  {
    id: 10,
    question: "Explain the difference between a Deployment, a StatefulSet, and a DaemonSet.",
    answer:
      "A Deployment manages stateless applications with rolling updates and rollbacks. A StatefulSet manages stateful applications with stable network identities, ordered deployment, and persistent storage per Pod. A DaemonSet ensures one Pod runs on every node (or a subset), useful for log collectors, monitoring agents, and node-level services.",
    category: "Kubernetes",
  },
  {
    id: 11,
    question: "How does Kubernetes service discovery work?",
    answer:
      "Kubernetes Services provide stable endpoints for Pods. ClusterIP exposes internally, NodePort exposes on each node, and LoadBalancer provisions an external load balancer. Services use label selectors to route traffic to matching Pods. CoreDNS provides DNS-based discovery so Pods can connect using service names (e.g., my-service.namespace.svc.cluster.local).",
    category: "Kubernetes",
  },
  {
    id: 12,
    question: "What is an Ingress controller and how does it differ from a Service?",
    answer:
      "A Service operates at L4 (TCP/UDP), while an Ingress operates at L7 (HTTP/HTTPS). Ingress provides path-based and host-based routing, SSL/TLS termination, and name-based virtual hosting through a single external IP. An Ingress controller (like NGINX or Traefik) implements the Ingress resource. This reduces cost by avoiding one LoadBalancer per service.",
    category: "Kubernetes",
  },
  // CI/CD
  {
    id: 13,
    question: "What is a CI/CD pipeline and what are its typical stages?",
    answer:
      "A CI/CD pipeline automates the build, test, and deployment process. Typical stages: source (code commit triggers pipeline), build (compile code, build Docker image), test (unit tests, integration tests, security scans), staging (deploy to pre-production), and production (deploy with approval gates). This reduces human error and enables rapid, reliable releases.",
    category: "CI/CD",
  },
  {
    id: 14,
    question: "Explain blue-green deployments vs. canary deployments.",
    answer:
      "Blue-green deployment maintains two identical environments. Traffic switches from blue (current) to green (new) all at once, with instant rollback by switching back. Canary deployment gradually shifts traffic (e.g., 5%, 25%, 50%, 100%) to the new version while monitoring metrics. Canary is lower risk but more complex; blue-green is simpler but requires double the infrastructure.",
    category: "CI/CD",
  },
  {
    id: 15,
    question: "How would you implement a rollback strategy in production?",
    answer:
      "Key strategies include: immutable deployments (deploy previous image version), feature flags (disable new features without redeploying), database migration rollbacks (backward-compatible migrations), and automated rollbacks triggered by health checks or error rate thresholds. Always ensure database schema changes are forward and backward compatible.",
    category: "CI/CD",
  },
  {
    id: 16,
    question: "What is GitOps and how does it differ from traditional CI/CD?",
    answer:
      "GitOps uses Git as the single source of truth for infrastructure and application configuration. An operator (like ArgoCD or Flux) continuously reconciles the cluster state with the Git repository. Unlike traditional CI/CD where the pipeline pushes changes, GitOps pulls changes. This provides audit trails, easy rollbacks (git revert), and declarative infrastructure.",
    category: "CI/CD",
  },
  // Infrastructure as Code
  {
    id: 17,
    question: "What is Infrastructure as Code and why is it important?",
    answer:
      "IaC manages infrastructure through code instead of manual processes. Benefits include version control, repeatability, consistency across environments, peer review via pull requests, and automated testing of infrastructure changes. It eliminates configuration drift and enables disaster recovery by rebuilding infrastructure from code.",
    category: "Infrastructure as Code",
  },
  {
    id: 18,
    question: "Compare Terraform and AWS CloudFormation.",
    answer:
      "Terraform is cloud-agnostic, uses HCL syntax, has a large provider ecosystem, and manages state files. CloudFormation is AWS-native, uses JSON/YAML, integrates deeply with AWS services, and manages state automatically. Terraform offers better multi-cloud support and a plan/apply workflow. CloudFormation has tighter AWS integration and no state file management overhead.",
    category: "Infrastructure as Code",
  },
  {
    id: 19,
    question: "What is Terraform state and how do you manage it in a team?",
    answer:
      "Terraform state tracks the mapping between your configuration and real-world resources. For teams, use remote backends (S3 + DynamoDB for locking, Terraform Cloud) to share state and prevent concurrent modifications. Never commit state files to Git (they may contain secrets). Use state locking to prevent corruption and workspaces to manage multiple environments.",
    category: "Infrastructure as Code",
  },
  {
    id: 20,
    question: "How do you handle secrets in a DevOps pipeline?",
    answer:
      "Never store secrets in code or environment variables in plain text. Use secret management tools like AWS Secrets Manager, HashiCorp Vault, or Azure Key Vault. In CI/CD, inject secrets at runtime using pipeline-native secret stores (GitHub Secrets, GitLab CI variables). For Kubernetes, use sealed-secrets or external-secrets-operator to sync secrets from a vault.",
    category: "Infrastructure as Code",
  },
];

const CATEGORIES = [
  "AWS Services",
  "Docker",
  "Kubernetes",
  "CI/CD",
  "Infrastructure as Code",
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CloudDevOpsInterviewPage() {
  // JSON-LD ItemList schema
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Cloud & DevOps Interview Questions (2026)",
    description:
      "20 most-asked cloud and DevOps interview questions covering AWS, Docker, Kubernetes, CI/CD, and Infrastructure as Code.",
    numberOfItems: DEVOPS_QUESTIONS.length,
    itemListElement: DEVOPS_QUESTIONS.map((q) => ({
      "@type": "ListItem",
      position: q.id,
      name: q.question,
      url: `${BASE}/cloud-devops-interview#${q.category.toLowerCase().replace(/[\s/&]+/g, "-")}`,
    })),
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SeoNavbar />
      <main className="flex-1">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
        <article className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-foreground font-medium">Cloud & DevOps Interview</li>
            </ol>
          </nav>

          {/* Hero */}
          <header className="mb-10">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
              Cloud & DevOps Interview Questions for 2026
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed mb-6">
              Cloud and DevOps skills are among the most in-demand competencies in software engineering today.
              Whether you are interviewing for a DevOps engineer, SRE, cloud architect, or backend engineer role,
              you will face questions on AWS services, containerization, orchestration, CI/CD pipelines, and
              Infrastructure as Code. This guide covers 20 essential questions with detailed answers to help you
              prepare with confidence.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/app/topics"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 bg-saffron hover:bg-saffron/90 text-white transition-colors"
              >
                Practice Cloud & DevOps Free &rarr;
              </Link>
              <Link
                href="/learn"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
              >
                Browse All Topics
              </Link>
            </div>
          </header>

          {/* Quick stats */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            <div className="p-4 rounded-xl border border-border/30 bg-card/50 text-center">
              <div className="text-2xl font-bold text-saffron">20</div>
              <div className="text-xs text-muted-foreground mt-1">Essential Questions</div>
            </div>
            <div className="p-4 rounded-xl border border-border/30 bg-card/50 text-center">
              <div className="text-2xl font-bold text-teal">5</div>
              <div className="text-xs text-muted-foreground mt-1">Topic Areas</div>
            </div>
            <div className="p-4 rounded-xl border border-border/30 bg-card/50 text-center">
              <div className="text-2xl font-bold text-gold">AWS</div>
              <div className="text-xs text-muted-foreground mt-1">Cloud Platform Focus</div>
            </div>
            <div className="p-4 rounded-xl border border-border/30 bg-card/50 text-center">
              <div className="text-2xl font-bold text-indigo-400">Free</div>
              <div className="text-xs text-muted-foreground mt-1">Full Practice Access</div>
            </div>
          </section>

          {/* Why Cloud & DevOps matters */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              Why Cloud & DevOps Skills Matter in Interviews
            </h2>
            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed space-y-4">
              <p>
                Cloud computing and DevOps have transformed how software is built, deployed, and operated. Companies
                expect engineers to understand cloud services, containerization, orchestration, and automated
                deployment pipelines &mdash; even for roles that are not explicitly labeled &quot;DevOps.&quot;
                According to industry surveys, over 90% of enterprises use at least one cloud provider, and
                Kubernetes adoption has surpassed 80% among organizations running containers in production.
              </p>
              <p>
                DevOps interviews test both theoretical knowledge and practical experience. Interviewers want to
                know that you can design reliable CI/CD pipelines, troubleshoot production incidents, manage
                infrastructure as code, and make informed decisions about cloud architecture. The questions in
                this guide cover the topics most frequently tested at companies like Amazon, Google, Microsoft,
                Netflix, and fast-growing startups.
              </p>
            </div>
          </section>

          {/* Table of contents */}
          <section className="mb-10 p-6 rounded-xl border border-border/30 bg-card/50">
            <h2 className="text-lg font-heading font-semibold text-foreground mb-3">
              Jump to Topic
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {CATEGORIES.map((cat) => {
                const count = DEVOPS_QUESTIONS.filter((q) => q.category === cat).length;
                return (
                  <a
                    key={cat}
                    href={`#${cat.toLowerCase().replace(/[\s/&]+/g, "-")}`}
                    className="text-sm text-muted-foreground hover:text-saffron transition-colors"
                  >
                    {cat} ({count})
                  </a>
                );
              })}
            </div>
          </section>

          {/* Questions by category */}
          {CATEGORIES.map((category) => {
            const questions = DEVOPS_QUESTIONS.filter((q) => q.category === category);
            const catSlug = category.toLowerCase().replace(/[\s/&]+/g, "-");
            return (
              <section key={category} id={catSlug} className="mb-10">
                <h2 className="text-xl sm:text-2xl font-heading font-semibold text-foreground mb-4">
                  {category} Questions
                </h2>
                <div className="space-y-4">
                  {questions.map((q) => (
                    <div
                      key={q.id}
                      className="p-5 rounded-xl border border-border/30 bg-card/50"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          #{q.id}
                        </span>
                        <h3 className="text-base font-semibold text-foreground">
                          {q.question}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {q.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          {/* Tips section */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              Tips for DevOps Interviews
            </h2>
            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed space-y-4">
              <h3 className="text-lg font-heading font-semibold text-foreground">
                1. Think in Systems, Not Tools
              </h3>
              <p>
                Interviewers care more about your understanding of concepts than specific tool knowledge. Explain
                <em>why</em> you would use a container orchestrator, not just <em>how</em> to write a Kubernetes
                manifest. Discuss trade-offs between managed services and self-hosted solutions. Show that you
                understand the problem each tool solves.
              </p>

              <h3 className="text-lg font-heading font-semibold text-foreground">
                2. Demonstrate Production Experience
              </h3>
              <p>
                Prepare stories about real incidents you have handled: a deployment that went wrong, a scaling
                challenge, or a security issue you resolved. Use the STAR format (Situation, Task, Action, Result)
                to structure your answers. Quantify the impact where possible (&quot;reduced deployment time from
                2 hours to 15 minutes&quot;).
              </p>

              <h3 className="text-lg font-heading font-semibold text-foreground">
                3. Know the Fundamentals Deeply
              </h3>
              <p>
                Understand networking (TCP/IP, DNS, HTTP, TLS), Linux fundamentals (processes, file systems,
                permissions), and distributed systems concepts (CAP theorem, consensus, eventual consistency).
                DevOps is applied systems engineering &mdash; shallow knowledge of many tools is less valuable
                than deep understanding of fundamentals.
              </p>

              <h3 className="text-lg font-heading font-semibold text-foreground">
                4. Practice Whiteboard Architecture
              </h3>
              <p>
                Many DevOps interviews include a design component: &quot;Design a CI/CD pipeline for a
                microservices architecture&quot; or &quot;How would you set up monitoring for 100
                services?&quot; Practice drawing architecture diagrams, explaining data flow, and discussing
                failure modes. Use Guru Sishya&apos;s Feynman mode to practice explaining your designs out loud.
              </p>

              <h3 className="text-lg font-heading font-semibold text-foreground">
                5. Stay Current with Industry Trends
              </h3>
              <p>
                The cloud and DevOps landscape evolves rapidly. Be familiar with current trends: platform
                engineering, internal developer platforms, FinOps, GitOps, service mesh, eBPF-based observability,
                and AI-assisted operations (AIOps). You do not need to be an expert in all of these, but showing
                awareness signals that you stay current.
              </p>
            </div>
          </section>

          {/* Platform topics */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              Related Topics on Guru Sishya
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { title: "AWS Cloud Services", href: "/app/topic/aws-cloud-services", desc: "EC2, S3, Lambda, IAM, VPC, and more" },
                { title: "Kubernetes & Docker", href: "/app/topic/kubernetes-docker", desc: "Container orchestration and management" },
                { title: "System Design", href: "/system-design-interview", desc: "Scalable architecture and design patterns" },
                { title: "DSA Interview Questions", href: "/dsa-interview-questions", desc: "50 essential coding interview questions" },
                { title: "Backend Engineering", href: "/backend-interview", desc: "APIs, microservices, and architecture" },
                { title: "Database Interview", href: "/database-interview", desc: "SQL, NoSQL, and database design" },
              ].map((topic) => (
                <Link
                  key={topic.title}
                  href={topic.href}
                  className="group p-4 rounded-lg border border-border/30 hover:border-saffron/40 bg-card/50 hover:bg-card/80 transition-all"
                >
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-saffron transition-colors">
                    {topic.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">{topic.desc}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="py-10 border-t border-border/30 text-center">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-3">
              Ready to Ace Your Cloud & DevOps Interview?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Practice with interactive lessons, quizzes, and a Feynman practice mode to explain
              concepts out loud &mdash; completely free, no signup required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/app/topics"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 bg-saffron hover:bg-saffron/90 text-white transition-colors"
              >
                Start Practicing Free &rarr;
              </Link>
              <Link
                href="/system-design-interview"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
              >
                System Design Interview Guide
              </Link>
            </div>
          </section>
        </article>
      </main>
      <SeoFooter />
    </div>
  );
}

// ── Shared Navbar & Footer ──────────────────────────────────────────────────

function SeoNavbar() {
  return (
    <nav
      aria-label="Main navigation"
      className="sticky top-0 z-50 bg-background/60 backdrop-blur-md border-b border-border/30"
    >
      <div className="flex h-14 items-center justify-between px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="Guru Sishya" className="size-8 rounded-lg" width={32} height={32} />
            <span className="font-heading text-lg font-bold text-saffron tracking-wider">GURU SISHYA</span>
          </Link>
          <div className="hidden sm:flex items-center gap-4">
            <Link href="/learn" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Topics</Link>
            <Link href="/dsa-interview-questions" className="text-sm text-muted-foreground hover:text-foreground transition-colors">DSA Questions</Link>
            <Link href="/system-design-interview" className="text-sm text-muted-foreground hover:text-foreground transition-colors">System Design</Link>
            <Link href="/cloud-devops-interview" className="text-sm text-foreground font-medium">Cloud & DevOps</Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden sm:inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
          <Link href="/app/topics" className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 bg-saffron hover:bg-saffron/90 text-white transition-colors">Start Free</Link>
        </div>
      </div>
    </nav>
  );
}

function SeoFooter() {
  return (
    <footer className="border-t border-border/30 bg-background/50 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Interview Prep</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/dsa-interview-questions" className="hover:text-foreground transition-colors">DSA Questions</Link></li>
              <li><Link href="/system-design-interview" className="hover:text-foreground transition-colors">System Design</Link></li>
              <li><Link href="/cloud-devops-interview" className="hover:text-foreground transition-colors">Cloud & DevOps</Link></li>
              <li><Link href="/database-interview" className="hover:text-foreground transition-colors">Database Interview</Link></li>
              <li><Link href="/backend-interview" className="hover:text-foreground transition-colors">Backend Interview</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/learn" className="hover:text-foreground transition-colors">All Topics</Link></li>
              <li><Link href="/app/topics" className="hover:text-foreground transition-colors">Start Learning</Link></li>
              <li><Link href="/leetcode-alternative" className="hover:text-foreground transition-colors">Why Guru Sishya</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Free Features</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>81 Topics</li>
              <li>1,730+ Quiz Questions</li>
              <li>Code Playground</li>
              <li>No Signup Required</li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border/20">
          <div className="flex items-center gap-2">
            <Image src="/logo-mark.png" alt="Guru Sishya" className="size-6 rounded" width={24} height={24} />
            <span className="text-sm text-muted-foreground">Guru Sishya &mdash; Free Interview Prep for Engineers</span>
          </div>
          <span className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Guru Sishya. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
