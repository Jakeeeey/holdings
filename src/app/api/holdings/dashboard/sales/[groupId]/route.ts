import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Helper to get group config
async function getGroupConfig(groupId: string) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    try {
        const res = await fetch(`${baseUrl}/api/holdings/dashboard-api-groups`);
        if (res.ok) {
            const groups = await res.json();
            return groups.find((g: any) => String(g.id) === groupId) || groups[0];
        }
    } catch (e) {
        console.error("Failed to fetch dashboard api groups", e);
    }
    return null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
    const { groupId } = await params;
    const group = await getGroupConfig(groupId);

    if (!group || !group.springboot) {
        return NextResponse.json({ error: "Group SpringBoot config not found" }, { status: 404 });
    }

    // Try multiple token sources
    let token = group.springboot_token || group.directus_token; 
    
    // Fetch the actual sales performance data
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const targetUrl = new URL(`${group.springboot.replace(/\/$/, "")}/api/view-sales-performance/all`);
    if (startDate) targetUrl.searchParams.append("startDate", startDate);
    if (endDate) targetUrl.searchParams.append("endDate", endDate);

    // 1. Try with directus_token or springboot_token first
    let springRes;
    if (token) {
        springRes = await fetch(targetUrl.toString(), {
            headers: { "Authorization": `Bearer ${token}` },
            cache: "no-store",
        });
        if (springRes.ok) {
            return NextResponse.json(await springRes.json());
        }
    }

    // 2. If token fails or is absent, attempt to login to Spring Boot
    if (group.username && group.password_hash) {
        try {
            const loginUrl = `${group.springboot.replace(/\/$/, "")}/auth/login`;
            // Try with 'password' field first, which is standard
            let loginRes = await fetch(loginUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    email: group.username, 
                    password: group.password_hash 
                }),
                cache: "no-store"
            });

            // If it fails, try 'hashPassword' field just in case
            if (!loginRes.ok) {
                loginRes = await fetch(loginUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        email: group.username, 
                        hashPassword: group.password_hash 
                    }),
                    cache: "no-store"
                });
            }

            if (loginRes.ok) {
                const tokenData = await loginRes.json();
                token = typeof tokenData === "string" ? tokenData : (tokenData.token || tokenData.accessToken);
                
                if (token) {
                    springRes = await fetch(targetUrl.toString(), {
                        headers: { "Authorization": `Bearer ${token}` },
                        cache: "no-store",
                    });
                    
                    if (springRes.ok) {
                        return NextResponse.json(await springRes.json());
                    }
                }
            } else {
                console.error("Spring Boot login failed with status", loginRes.status);
            }
        } catch (e) {
            console.error("Spring Boot authentication error:", e);
        }
    }

    // 3. Last fallback: try the user's vos_access_token (BIA legacy fallback)
    const vosToken = req.cookies.get("vos_access_token")?.value;
    if (vosToken) {
        springRes = await fetch(targetUrl.toString(), {
            headers: { "Authorization": `Bearer ${vosToken}` },
            cache: "no-store",
        });
        if (springRes.ok) {
            return NextResponse.json(await springRes.json());
        }
    }

    return NextResponse.json({ error: "All authentication methods failed" }, { status: 401 });
}
