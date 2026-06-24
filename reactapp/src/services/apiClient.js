import { clearSession, readSession } from "./authStorage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

export class ApiClientError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

async function parseResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

async function request(path, options = {}) {
  const session = readSession();
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (session?.accessToken && !headers.has("Authorization")) {
    headers.set(
      "Authorization",
      `${session.tokenType ?? "Bearer"} ${session.accessToken}`,
    );
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const responseBody = await parseResponse(response);

  if (!response.ok) {
    if (response.status === 401) {
      clearSession();
    }

    const message =
      responseBody?.message ??
      `API request failed with status ${response.status}`;

    throw new ApiClientError(
      message,
      response.status,
      responseBody,
    );
  }

  return responseBody;
}

export const apiClient = {
  get(path, options) {
    return request(path, options);
  },

  post(path, body, options = {}) {
    return request(path, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  put(path, body, options = {}) {
    return request(path, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  delete(path, options = {}) {
    return request(path, {
      ...options,
      method: "DELETE",
    });
  },
};

export { API_BASE_URL };
