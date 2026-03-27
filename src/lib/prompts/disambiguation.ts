export const DISAMBIGUATION: Record<string, string> = {
  kafka: "Apache Kafka (distributed event streaming platform)",
  spring: "Spring Framework / Spring Boot (Java application framework)",
  docker: "Docker (containerization platform)",
  redis: "Redis (in-memory data store / cache)",
  node: "Node.js (JavaScript runtime)",
  lambda: "AWS Lambda (serverless compute) or lambda expressions",
  elastic: "Elasticsearch (search and analytics engine)",
  rabbit: "RabbitMQ (message broker)",
  oracle: "Oracle Database or Oracle Cloud",
  swift: "Swift programming language (Apple) or OpenStack Swift",
  rust: "Rust programming language",
  go: "Go / Golang programming language",
  flask: "Flask (Python web framework)",
  django: "Django (Python web framework)",
  rails: "Ruby on Rails (web framework)",
  spark: "Apache Spark (big data processing)",
  hive: "Apache Hive (data warehouse)",
  storm: "Apache Storm (real-time computation)",
  flink: "Apache Flink (stream processing)",
  camel: "Apache Camel (integration framework)",
  maven: "Apache Maven (build tool)",
  ant: "Apache Ant (build tool)",
  gradle: "Gradle (build automation)",
  jenkins: "Jenkins (CI/CD server)",
  puppet: "Puppet (configuration management)",
  chef: "Chef (infrastructure automation)",
  salt: "SaltStack (configuration management)",
  terraform: "Terraform (infrastructure as code)",
  vault: "HashiCorp Vault (secrets management)",
  consul: "HashiCorp Consul (service mesh)",
};

export function getDisambiguationContext(message: string): string {
  const lower = message.toLowerCase();
  const matches: string[] = [];
  for (const [term, meaning] of Object.entries(DISAMBIGUATION)) {
    if (lower.includes(term)) {
      matches.push(`"${term}" refers to ${meaning}`);
    }
  }
  if (matches.length === 0) return "";
  return `\nContext clarification: ${matches.join("; ")}.`;
}
