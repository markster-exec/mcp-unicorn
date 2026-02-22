import type { Request, Response } from "express";
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import fs from "node:fs";
import path from "node:path";
import { WorkOS } from "@workos-inc/node";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./server.js";
import {
  createMarksterContext,
  shouldUseMockMode,
} from "./src/markster/client.js";

function boolFromEnv(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "1" ||
    normalized === "true" ||
    normalized === "yes" ||
    normalized === "on"
  );
}

function loadDotEnv(filePath = path.join(process.cwd(), ".env")): void {
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch {
    return;
  }

  for (const rawLine of raw.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsAt = line.indexOf("=");
    if (equalsAt <= 0) {
      continue;
    }

    const key = line.slice(0, equalsAt).trim();
    let value = line.slice(equalsAt + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function trimEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function stripTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

function detectBaseUrl(req: Request): string {
  const configured = trimEnv(process.env.MCP_PUBLIC_BASE_URL);
  if (configured) {
    return stripTrailingSlashes(configured);
  }

  const forwardedProto = req.header("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = req.header("x-forwarded-host")?.split(",")[0]?.trim();
  const protocol = forwardedProto || req.protocol || "https";
  const host = forwardedHost || req.get("host") || "localhost:3000";
  return `${protocol}://${host}`;
}

function tokenFromAuthHeader(
  authHeader: string | undefined,
): string | undefined {
  if (!authHeader) return undefined;
  const [scheme, token] = authHeader.split(/\s+/, 2);
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") return undefined;
  return token.trim() || undefined;
}

function safeHeaderValue(value: string): string {
  return value.replace(/"/g, "");
}

function buildAuthorizeHeader(params: {
  realm: string;
  metadataUrl: string;
  error?: string;
  description?: string;
}): string {
  const parts = [
    `Bearer realm="${safeHeaderValue(params.realm)}"`,
    `resource_metadata="${safeHeaderValue(params.metadataUrl)}"`,
  ];
  if (params.error) {
    parts.push(`error="${safeHeaderValue(params.error)}"`);
  }
  if (params.description) {
    parts.push(`error_description="${safeHeaderValue(params.description)}"`);
  }
  return parts.join(", ");
}

type LogoCacheEntry = {
  body: Buffer;
  contentType: string;
  expiresAt: number;
};

const LOGO_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const logoCache = new Map<string, LogoCacheEntry>();

function normalizeLogoDomain(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  const withoutProtocol = trimmed.replace(/^https?:\/\//, "");
  const hostOnly = withoutProtocol.split("/")[0]?.replace(/^www\./, "") ?? "";
  if (!hostOnly) return null;
  if (!/^[a-z0-9.-]+$/.test(hostOnly)) return null;
  return hostOnly;
}

function firstLettersFromDomain(domain: string): string {
  const base = domain.split(".")[0] ?? domain;
  if (!base) return "LG";
  const parts = base.split("-").filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

function buildFallbackLogoSvg(domain: string): Buffer {
  const initials = firstLettersFromDomain(domain);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
<rect width="192" height="192" rx="24" fill="#0a1210"/>
<rect x="8" y="8" width="176" height="176" rx="18" fill="none" stroke="#22422d" stroke-width="4"/>
<text x="96" y="110" text-anchor="middle" fill="#01ff00" font-size="54" font-family="Inter, Arial, sans-serif" font-weight="700">${initials}</text>
</svg>`;
  return Buffer.from(svg, "utf8");
}

function extractContentType(headers: Headers): string | null {
  const value = headers.get("content-type");
  if (!value) return null;
  const contentType = value.split(";")[0]?.trim().toLowerCase();
  if (!contentType) return null;
  if (!contentType.startsWith("image/")) return null;
  return contentType;
}

async function fetchLogoAsset(
  domain: string,
): Promise<{ body: Buffer; contentType: string } | null> {
  const candidates = [
    `https://logo.clearbit.com/${encodeURIComponent(domain)}`,
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
      domain,
    )}&sz=256`,
  ];

  for (const candidate of candidates) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(candidate, {
        signal: controller.signal,
        headers: {
          "user-agent": "markster-mcp-logo-proxy/1.0",
          accept: "image/*",
        },
      });
      if (!response.ok) continue;
      const contentType = extractContentType(response.headers);
      if (!contentType) continue;
      const arrayBuffer = await response.arrayBuffer();
      const body = Buffer.from(arrayBuffer);
      if (body.length === 0) continue;
      return { body, contentType };
    } catch {
      // Try next source.
    } finally {
      clearTimeout(timeout);
    }
  }
  return null;
}

async function main(): Promise<void> {
  loadDotEnv();
  // Also load .env.local for optional local credentials.
  loadDotEnv(path.join(process.cwd(), ".env.local"));

  const authFeatureFlag = boolFromEnv(process.env.WORKOS_AUTH_ENABLED);
  const oauthDiscoveryEnabled = boolFromEnv(
    process.env.WORKOS_OAUTH_DISCOVERY_ENABLED,
  );
  const authRequiredForMcpAuth = boolFromEnv(process.env.WORKOS_AUTH_REQUIRED);
  const authReportOnly = boolFromEnv(process.env.WORKOS_AUTH_REPORT_ONLY);
  const authVerifyJwt = boolFromEnv(process.env.WORKOS_AUTH_VERIFY_JWT);
  const workosApiKey = process.env.WORKOS_API_KEY?.trim();
  const workosClientId = process.env.WORKOS_CLIENT_ID?.trim();
  const workosRedirectUri = process.env.WORKOS_REDIRECT_URI?.trim();
  const workosCookiePassword = process.env.WORKOS_COOKIE_PASSWORD?.trim();
  const workosAuthEnabled =
    authFeatureFlag &&
    Boolean(workosClientId && workosRedirectUri && workosCookiePassword);

  if (authFeatureFlag && !workosAuthEnabled) {
    console.warn(
      "WorkOS auth disabled: missing one or more required env vars (WORKOS_CLIENT_ID, WORKOS_REDIRECT_URI, WORKOS_COOKIE_PASSWORD).",
    );
  }

  const workos =
    workosAuthEnabled && workosClientId
      ? workosApiKey
        ? new WorkOS(workosApiKey, { clientId: workosClientId })
        : new WorkOS({ clientId: workosClientId })
      : null;
  const oauthIssuer = stripTrailingSlashes(
    trimEnv(process.env.WORKOS_OAUTH_ISSUER) ||
      workos?.baseURL ||
      "https://api.workos.com",
  );
  const oauthAudience =
    trimEnv(process.env.WORKOS_OAUTH_AUDIENCE) || workosClientId;
  const oauthScopes = (
    trimEnv(process.env.WORKOS_OAUTH_SCOPES) || "openid profile email offline"
  )
    .split(/\s+/)
    .filter(Boolean);
  const oauthJwksUri =
    trimEnv(process.env.WORKOS_JWKS_URI) ||
    (workosClientId
      ? `${oauthIssuer}/sso/jwks/${encodeURIComponent(workosClientId)}`
      : undefined);
  const jwks =
    authVerifyJwt && oauthJwksUri
      ? createRemoteJWKSet(new URL(oauthJwksUri))
      : null;

  const app = createMcpExpressApp({ host: "0.0.0.0" });
  const port = Number(process.env.PORT ?? 3000);
  const requestLoggingEnabled =
    boolFromEnv(process.env.MARKSTER_HTTP_REQUEST_LOGGING) ||
    boolFromEnv(process.env.MARKSTER_TOOL_CALL_LOGGING);
  const mockMode = shouldUseMockMode();
  let marksterMode = "mock";
  let marksterBaseUrl = "disabled";

  if (mockMode) {
    marksterMode = "mock";
  } else {
    const marksterContext = createMarksterContext();
    marksterBaseUrl = marksterContext.baseUrl;
    marksterMode = "live";
    console.log("Markster API bound to customer token for LIVE mode.");
  }

  app.use(cors());
  app.use(cookieParser());
  if (requestLoggingEnabled) {
    app.use((req, res, next) => {
      const startedAt = Date.now();
      console.info(`[http] start method=${req.method} path=${req.originalUrl}`);
      res.on("finish", () => {
        const durationMs = Date.now() - startedAt;
        console.info(
          `[http] done method=${req.method} path=${req.originalUrl} status=${res.statusCode} duration_ms=${durationMs}`,
        );
      });
      next();
    });
  }
  app.use(
    "/assets/headshots/thumbs",
    express.static(path.join(process.cwd(), "data/generated-headshots/thumbs")),
  );
  app.use(
    "/assets/headshots",
    express.static(path.join(process.cwd(), "data/generated-headshots")),
  );
  app.get("/assets/company-logos/:domain", async (req, res) => {
    const domain = normalizeLogoDomain(String(req.params.domain ?? ""));
    if (!domain) {
      res.status(400).json({ error: "Invalid domain" });
      return;
    }

    const cached = logoCache.get(domain);
    if (cached && cached.expiresAt > Date.now()) {
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader("Content-Type", cached.contentType);
      res.send(cached.body);
      return;
    }

    const fetched = await fetchLogoAsset(domain);
    if (fetched) {
      logoCache.set(domain, {
        body: fetched.body,
        contentType: fetched.contentType,
        expiresAt: Date.now() + LOGO_CACHE_TTL_MS,
      });
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader("Content-Type", fetched.contentType);
      res.send(fetched.body);
      return;
    }

    const fallbackSvg = buildFallbackLogoSvg(domain);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.send(fallbackSvg);
  });

  const buildProtectedResourceMetadata = (
    req: Request,
    resourcePath: "/mcp-auth" | "/mcp",
  ) => {
    const baseUrl = detectBaseUrl(req);
    return {
      resource: `${baseUrl}${resourcePath}`,
      authorization_servers: [oauthIssuer],
      bearer_methods_supported: ["header"],
      scopes_supported: oauthScopes,
    };
  };

  const buildAuthorizationServerMetadata = () => ({
    issuer: oauthIssuer,
    authorization_endpoint: `${oauthIssuer}/user_management/authorize`,
    token_endpoint: `${oauthIssuer}/user_management/authenticate`,
    jwks_uri: oauthJwksUri,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: [
      "client_secret_post",
      "none",
      "client_secret_basic",
    ],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: oauthScopes,
  });

  const buildOpenIdMetadata = () => ({
    ...buildAuthorizationServerMetadata(),
    userinfo_endpoint: `${oauthIssuer}/user_management/userinfo`,
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
  });

  const sendAuthDisabled = (res: Response) => {
    res.status(404).json({ error: "WorkOS auth is disabled" });
  };

  const sendUnauthorized = (req: Request, res: Response, reason: string) => {
    const baseUrl = detectBaseUrl(req);
    const metadataUrl = `${baseUrl}/.well-known/oauth-protected-resource/mcp-auth`;
    res.setHeader(
      "WWW-Authenticate",
      buildAuthorizeHeader({
        realm: "dealpulse-mcp",
        metadataUrl,
        error: "invalid_token",
        description: reason,
      }),
    );
    res.status(401).json({
      error: "unauthorized",
      reason,
      metadata: metadataUrl,
    });
  };

  const validateBearerToken = async (token: string) => {
    if (!authVerifyJwt) return { ok: true as const };
    if (!jwks || !oauthAudience) {
      return {
        ok: false as const,
        reason: "JWT verification is enabled but verifier is not configured.",
      };
    }

    try {
      await jwtVerify(token, jwks, {
        audience: oauthAudience,
      });
      return { ok: true as const };
    } catch (error) {
      return {
        ok: false as const,
        reason:
          error instanceof Error && error.message
            ? error.message
            : "Token verification failed",
      };
    }
  };

  const handleMcpRequest = async (req: Request, res: Response) => {
    const server = await createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on("close", async () => {
      await transport.close().catch(() => undefined);
      await server.close().catch(() => undefined);
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("MCP request failed", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  };

  if (oauthDiscoveryEnabled) {
    app.get("/.well-known/oauth-protected-resource", (req, res) => {
      res.json(buildProtectedResourceMetadata(req, "/mcp-auth"));
    });
    app.get("/.well-known/oauth-protected-resource/:resource", (req, res) => {
      const resourcePath = req.params.resource === "mcp" ? "/mcp" : "/mcp-auth";
      res.json(buildProtectedResourceMetadata(req, resourcePath));
    });
    app.get("/.well-known/oauth-authorization-server", (_req, res) => {
      res.json(buildAuthorizationServerMetadata());
    });
    app.get(
      "/.well-known/oauth-authorization-server/:resource",
      (_req, res) => {
        res.json(buildAuthorizationServerMetadata());
      },
    );
    app.get("/mcp/.well-known/oauth-authorization-server", (_req, res) => {
      res.json(buildAuthorizationServerMetadata());
    });
    app.get("/mcp-auth/.well-known/oauth-authorization-server", (_req, res) => {
      res.json(buildAuthorizationServerMetadata());
    });
    app.get("/.well-known/openid-configuration", (_req, res) => {
      res.json(buildOpenIdMetadata());
    });
    app.get("/.well-known/openid-configuration/:resource", (_req, res) => {
      res.json(buildOpenIdMetadata());
    });
    app.get("/mcp/.well-known/openid-configuration", (_req, res) => {
      res.json(buildOpenIdMetadata());
    });
    app.get("/mcp-auth/.well-known/openid-configuration", (_req, res) => {
      res.json(buildOpenIdMetadata());
    });
  }

  // ===========================================
  // WorkOS AuthKit Authentication Routes
  // ===========================================

  // Login route - redirects to AuthKit
  app.get("/auth/login", (_, res) => {
    if (
      !workosAuthEnabled ||
      !workos ||
      !workosRedirectUri ||
      !workosClientId
    ) {
      sendAuthDisabled(res);
      return;
    }

    const authorizationUrl = workos.userManagement.getAuthorizationUrl({
      provider: "authkit",
      redirectUri: workosRedirectUri,
      clientId: workosClientId,
    });
    res.redirect(authorizationUrl);
  });

  // Callback route - exchanges code for user session
  app.get("/auth/callback", async (req, res) => {
    if (
      !workosAuthEnabled ||
      !workos ||
      !workosClientId ||
      !workosCookiePassword
    ) {
      sendAuthDisabled(res);
      return;
    }

    const code = req.query.code as string | undefined;

    if (!code) {
      res.status(400).json({ error: "Missing authorization code" });
      return;
    }

    try {
      const authenticateResponse =
        await workos.userManagement.authenticateWithCode({
          code,
          clientId: workosClientId,
          session: {
            sealSession: true,
            cookiePassword: workosCookiePassword,
          },
        });

      // Set the sealed session cookie
      res.cookie("wos-session", authenticateResponse.sealedSession, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.redirect("/");
    } catch (error) {
      console.error("WorkOS authentication failed:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Logout route - clears session and redirects to WorkOS logout
  app.get("/auth/logout", async (req, res) => {
    if (!workosAuthEnabled || !workos || !workosCookiePassword) {
      sendAuthDisabled(res);
      return;
    }

    const sessionCookie = req.cookies["wos-session"] as string | undefined;

    if (sessionCookie) {
      try {
        const session = workos.userManagement.loadSealedSession({
          sessionData: sessionCookie,
          cookiePassword: workosCookiePassword,
        });
        const logoutUrl = await session.getLogoutUrl();
        res.clearCookie("wos-session");
        res.redirect(logoutUrl);
        return;
      } catch (error) {
        console.error("Error during logout:", error);
      }
    }

    res.clearCookie("wos-session");
    res.redirect("/");
  });

  // ===========================================
  // Home route with authentication state
  // ===========================================

  app.get("/", async (req, res) => {
    const sessionCookie = req.cookies["wos-session"] as string | undefined;
    let user = null;

    if (workosAuthEnabled && workos && workosCookiePassword && sessionCookie) {
      try {
        const session = workos.userManagement.loadSealedSession({
          sessionData: sessionCookie,
          cookiePassword: workosCookiePassword,
        });
        const authResult = await session.authenticate();
        if (authResult.authenticated) {
          user = authResult.user;
        }
      } catch (error) {
        // Session invalid or expired, continue as unauthenticated
        console.error("Session validation failed:", error);
      }
    }

    // Return JSON with auth state for API usage
    res.json({
      name: "Markster Business OS MCP",
      status: "running",
      health: "ok",
      mode: marksterMode,
      markster_api: marksterBaseUrl,
      auth_enabled: workosAuthEnabled,
      authenticated: workosAuthEnabled && !!user,
      user: user
        ? {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          }
        : null,
    });
  });

  app.all("/mcp", async (req: Request, res: Response) => {
    await handleMcpRequest(req, res);
  });

  app.all("/mcp-auth", async (req: Request, res: Response) => {
    if (!workosAuthEnabled || !workos) {
      sendAuthDisabled(res);
      return;
    }

    const token = tokenFromAuthHeader(req.header("authorization"));

    if (!token) {
      if (authRequiredForMcpAuth && !authReportOnly) {
        sendUnauthorized(req, res, "Missing Bearer token");
        return;
      }
      console.warn("[auth] /mcp-auth request missing Bearer token");
      await handleMcpRequest(req, res);
      return;
    }

    const validation = await validateBearerToken(token);
    if (!validation.ok) {
      if (authRequiredForMcpAuth && !authReportOnly) {
        sendUnauthorized(req, res, validation.reason);
        return;
      }
      console.warn(
        `[auth] /mcp-auth token validation failed in report-only mode: ${validation.reason}`,
      );
    }

    await handleMcpRequest(req, res);
  });

  const httpServer = app.listen(port, "0.0.0.0", () => {
    console.log(
      `Markster Business OS MCP running at http://localhost:${port}/mcp`,
    );
  });

  const shutdown = () => {
    console.log("Shutting down Markster Business OS MCP");
    httpServer.close(() => process.exit(0));
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
