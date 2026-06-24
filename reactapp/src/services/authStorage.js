const AUTH_SESSION_KEY = "restaurant-reservation-auth";

function isStorageAvailable() {
  return typeof window !== "undefined" && window.localStorage;
}

export function saveSession(session) {
  if (!isStorageAvailable()) {
    return;
  }

  window.localStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify(session),
  );
}

export function readSession() {
  if (!isStorageAvailable()) {
    return null;
  }

  const storedSession = window.localStorage.getItem(AUTH_SESSION_KEY);

  if (!storedSession) {
    return null;
  }

  try {
    const session = JSON.parse(storedSession);

    if (
      !session?.accessToken ||
      !session?.user ||
      !session?.expiresAt
    ) {
      clearSession();
      return null;
    }

    if (Date.now() >= session.expiresAt) {
      clearSession();
      return null;
    }

    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  if (!isStorageAvailable()) {
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_KEY);
}

export { AUTH_SESSION_KEY };
