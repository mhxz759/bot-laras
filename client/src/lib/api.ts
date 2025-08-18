import { AuthService } from "./auth";

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<any> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...AuthService.getAuthHeaders(),
  };

  const config: RequestInit = {
    method,
    headers,
    credentials: "include",
  };

  if (data && method !== "GET") {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(url, config);

  // Handle 401 - redirect to login
  if (response.status === 401) {
    AuthService.logout();
    window.location.href = "/login";
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  if (!response.ok) {
    let errorMessage = "Erro interno do servidor";
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // Use status text if JSON parsing fails
      errorMessage = response.statusText || errorMessage;
    }
    
    throw new Error(`${response.status}: ${errorMessage}`);
  }

  // Handle empty responses
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  }
  
  return response.text();
}
