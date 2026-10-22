const COOKIE_USUARIO = "sophia_user_id";

export function urlDoBack(caminho = "") {
  const base = (
    process.env.SOPHIA_BACK_URL ??
    process.env.NEXT_PUBLIC_SOPHIA_TRANSCRICAO ??
    "http://localhost:8000"
  ).replace(/\/$/, "");
  return `${base}${caminho.startsWith("/") ? caminho : `/${caminho}`}`;
}

export function opcoesCookieUsuario() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export { COOKIE_USUARIO };
