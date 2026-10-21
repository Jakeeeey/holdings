import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || "";

const normalizeUrl = (url?: string | null): string => {
  if (!url) return "";
  const trimmed = url.trim();
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const companyIdStr = formData.get("company_id") as string | null;

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    const companyId = companyIdStr ? Number(companyIdStr) : null;
    let targetDirectusUrl = normalizeUrl(API_BASE_URL);
    let targetToken = DIRECTUS_TOKEN;
    let isCompanyStorage = false;

    // Check if target company has configured directus and token
    if (companyId) {
      try {
        const masterUrl = `${normalizeUrl(API_BASE_URL)}/items/company_list/${companyId}`;
        const compRes = await fetch(masterUrl, {
          headers: {
            "Content-Type": "application/json",
            ...(DIRECTUS_TOKEN ? { Authorization: `Bearer ${DIRECTUS_TOKEN}` } : {}),
          },
          cache: "no-store",
        });

        if (compRes.ok) {
          const compJson = await compRes.json();
          const compData = compJson.data;
          if (compData?.directus && compData?.directus_token) {
            targetDirectusUrl = normalizeUrl(compData.directus);
            targetToken = compData.directus_token;
            isCompanyStorage = true;
          }
        }
      } catch (err) {
        console.warn("Could not retrieve company directus credentials for upload, using master fallback:", err);
      }
    }

    // Prepare upload payload for target Directus
    const backendFormData = new FormData();
    backendFormData.append("file", file);

    let uploadRes = await fetch(`${targetDirectusUrl}/files`, {
      method: "POST",
      headers: {
        ...(targetToken ? { Authorization: `Bearer ${targetToken}` } : {}),
      },
      body: backendFormData,
    });

    // If company storage failed, gracefully fallback to master storage
    if (!uploadRes.ok && isCompanyStorage) {
      console.warn(`Company Directus upload failed (${uploadRes.status}). Falling back to Master Directus.`);
      targetDirectusUrl = normalizeUrl(API_BASE_URL);
      targetToken = DIRECTUS_TOKEN;
      isCompanyStorage = false;

      uploadRes = await fetch(`${targetDirectusUrl}/files`, {
        method: "POST",
        headers: {
          ...(targetToken ? { Authorization: `Bearer ${targetToken}` } : {}),
        },
        body: backendFormData,
      });
    }

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      return NextResponse.json(
        { success: false, message: `Upload failed: ${errorText.slice(0, 100)}` },
        { status: 500 }
      );
    }

    const data = await uploadRes.json();
    const fileId = data?.data?.id;

    return NextResponse.json({
      success: true,
      data: data.data,
      file_url: fileId, // Save pure Directus UUID only
      storage: isCompanyStorage ? "company" : "master",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
