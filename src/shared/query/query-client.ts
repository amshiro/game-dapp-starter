import { environmentManager, QueryClient } from "@tanstack/react-query";

export function createQueryClient(): QueryClient {
  return new QueryClient();
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  // Never retain a server cache across renders or requests.
  if (environmentManager.isServer()) return createQueryClient();

  // Survives ordinary rerenders and retries of a suspended initial render.
  browserQueryClient ??= createQueryClient();
  return browserQueryClient;
}
