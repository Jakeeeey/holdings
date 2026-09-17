import { NextRequest, NextResponse } from "next/server";
import { fetchDashboardGroups } from "@/lib/dashboard-groups";

export const runtime = "nodejs";

async function getGroupConfig(groupId: string) {
  try {
    const groups = await fetchDashboardGroups();
    return (
      groups.find(
        (g: { id: string | number; [key: string]: unknown }) =>
          String(g.id) === groupId,
      ) || groups[0]
    );
  } catch (e) {
    console.error("Failed to fetch dashboard api groups", e);
  }
  return null;
}

function withCors(res: NextResponse, req: NextRequest) {
  const origin = req.headers.get("origin") || "*";
  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Vary", "Origin");
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  );
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

function pickForwardHeaders(req: NextRequest, authHeaderOverride?: string) {
  const headers = new Headers();
  const ct = req.headers.get("content-type");
  if (ct) headers.set("content-type", ct);

  if (authHeaderOverride) {
    headers.set("authorization", authHeaderOverride);
  } else {
    const auth = req.headers.get("authorization");
    if (auth) headers.set("authorization", auth);
  }
  return headers;
}

// In-memory token cache and rate-limit backoff tracker
const tokenCache = new Map<string, { token: string; expiresAt: number }>();
const inFlightLogins = new Map<string, Promise<string | null>>();
let rateLimitUntil = 0;

// Lightweight in-memory response cache for GET requests (15s TTL)
interface CachedResponse {
  data: ArrayBuffer;
  status: number;
  headers: Record<string, string>;
  expiresAt: number;
}
const responseCache = new Map<string, CachedResponse>();

async function performLogin(group: {
  username?: string;
  password_hash?: string;
  springboot: string;
  directus?: string;
  directus_token?: string;
}): Promise<string | null> {
  if (!group.username || !group.password_hash) return null;

  const cacheKey = `${group.springboot}:${group.username}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  // Deduplicate simultaneous login attempts
  if (inFlightLogins.has(cacheKey)) {
    return inFlightLogins.get(cacheKey)!;
  }

  if (Date.now() < rateLimitUntil) {
    return null;
  }

  const loginPromise = (async () => {
    try {
      let passwordToUse = group.password_hash;
      if (passwordToUse && passwordToUse.startsWith("$2")) {
        try {
          const directusBase =
            group.directus ||
            process.env.NEXT_PUBLIC_API_BASE_URL ||
            "http://goatedcodoer:8091";
          const directusToken =
            group.directus_token || process.env.DIRECTUS_STATIC_TOKEN;
          const uRes = await fetch(
            `${directusBase.replace(/\/$/, "")}/items/user?filter[user_email][_eq]=${encodeURIComponent(group.username || "")}&fields=user_password`,
            {
              headers: directusToken
                ? { Authorization: `Bearer ${directusToken}` }
                : {},
              cache: "no-store",
            },
          );
          if (uRes.ok) {
            const uJson = await uRes.json();
            if (uJson.data?.[0]?.user_password) {
              passwordToUse = uJson.data[0].user_password;
            }
          }
        } catch (uErr) {
          console.warn("Could not resolve plain password from Directus:", uErr);
        }
        if (
          passwordToUse &&
          passwordToUse.startsWith("$2") &&
          group.username === "dev@men2corp.com"
        ) {
          passwordToUse = "Vertex81617";
        }
      }

      const loginUrl = `${group.springboot.replace(/\/$/, "")}/auth/login`;
      const loginRes = await fetch(loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: group.username,
          hashPassword: passwordToUse || "",
        }),
        cache: "no-store",
      });

      if (loginRes.status === 429) {
        console.warn(
          `[Spring Boot] Rate limited (429) on ${loginUrl}. Short cooldown 10s.`,
        );
        rateLimitUntil = Date.now() + 10_000;
        return null;
      }

      if (loginRes.ok) {
        const tokenData = await loginRes.json();
        const token =
          typeof tokenData === "string"
            ? tokenData
            : tokenData.token || tokenData.accessToken;
        if (token) {
          // Cache for 1 hour
          tokenCache.set(cacheKey, {
            token,
            expiresAt: Date.now() + 60 * 60 * 1000,
          });
          return token;
        }
      }
    } catch (e) {
      console.error("Spring Boot login error", e);
    } finally {
      inFlightLogins.delete(cacheKey);
    }
    return null;
  })();

  inFlightLogins.set(cacheKey, loginPromise);
  return loginPromise;
}

async function proxy(
  req: NextRequest,
  paramsPromise: Promise<{ groupId: string; path: string[] }>,
) {
  const { groupId, path: pathArray } = await paramsPromise;
  const group = await getGroupConfig(groupId);

  if (!group || !group.springboot) {
    return NextResponse.json(
      { error: "Group SpringBoot config not found" },
      { status: 404 },
    );
  }

  const subpath = pathArray.join("/");
  const upstream = group.springboot.replace(/\/+$/, "");
  const url = new URL(`${upstream}/${subpath}`);

  // Forward all query parameters
  req.nextUrl.searchParams.forEach((v, k) => url.searchParams.append(k, v));

  const method = req.method;
  const reqUrlString = url.toString();

  // Check in-memory response cache for GET requests
  if (method === "GET") {
    const cachedResp = responseCache.get(reqUrlString);
    if (cachedResp && cachedResp.expiresAt > Date.now()) {
      return new NextResponse(cachedResp.data.slice(0), {
        status: cachedResp.status,
        headers: cachedResp.headers,
      });
    }
  }

  const bodyBuffer = ["GET", "HEAD"].includes(method)
    ? undefined
    : await req.arrayBuffer();

  async function attemptUpstream(token: string) {
    const authHeader = `Bearer ${token}`;
    return await fetch(reqUrlString, {
      method,
      headers: pickForwardHeaders(req, authHeader),
      body: bodyBuffer ? bodyBuffer.slice(0) : undefined,
      cache: "no-store",
    });
  }

  const cacheKey = `${group.springboot}:${group.username}`;
  let token: string | null = null;

  // 1. Check existing cached token
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    token = cached.token;
  }

  // 2. If no valid token in cache, perform single login
  if (!token && group.username && group.password_hash) {
    token = await performLogin(group as Parameters<typeof performLogin>[0]);
  }

  // 3. Fallback to static springboot_token or vos_access_token cookie
  if (!token) {
    token =
      group.springboot_token ||
      req.cookies.get("vos_access_token")?.value ||
      null;
  }

  let upstreamRes: Response | null = null;

  if (token) {
    upstreamRes = await attemptUpstream(token);
  }

  // If token failed with 401, invalidate and re-login once
  if (upstreamRes && upstreamRes.status === 401 && group.username && group.password_hash) {
    tokenCache.delete(cacheKey);
    const freshToken = await performLogin(group as Parameters<typeof performLogin>[0]);
    if (freshToken) {
      upstreamRes = await attemptUpstream(freshToken);
    }
  }

  // If still no response or unauthorized
  if (!upstreamRes) {
    return NextResponse.json(
      { error: "Authentication failed to upstream service" },
      { status: 401 },
    );
  }

  const data = await upstreamRes.arrayBuffer();
  const headers = new Headers(upstreamRes.headers);
  headers.delete("content-encoding");
  headers.delete("content-length");

  const responseHeaders = {
    "content-type": headers.get("content-type") || "application/json",
    ...Object.fromEntries(headers),
  };

  // Cache successful GET responses for 15s to protect upstream
  if (method === "GET" && upstreamRes.ok) {
    responseCache.set(reqUrlString, {
      data,
      status: upstreamRes.status,
      headers: responseHeaders,
      expiresAt: Date.now() + 15_000,
    });
  }

  return new NextResponse(data, {
    status: upstreamRes.status,
    headers: responseHeaders,
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string; path: string[] }> },
) {
  return proxy(req, params);
}
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string; path: string[] }> },
) {
  return proxy(req, params);
}
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string; path: string[] }> },
) {
  return proxy(req, params);
}
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string; path: string[] }> },
) {
  return proxy(req, params);
}
export async function OPTIONS(req: NextRequest) {
  const res = new NextResponse(null, { status: 204 });
  return withCors(res, req);
}
