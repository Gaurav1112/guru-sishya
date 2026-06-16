// Server-side auth stub — login is disabled

interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    image: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function auth(_locals?: any): Promise<AuthSession | null> {
  return null;
}
