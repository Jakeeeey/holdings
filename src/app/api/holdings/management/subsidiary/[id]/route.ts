import { NextRequest, NextResponse } from "next/server";
import { fetchSubsidiaryById, updateSubsidiary, deleteSubsidiary } from "@/modules/holdings/management/subsidiary-management/services/subsidiary.service";
import { SubsidiarySchema } from "@/modules/holdings/management/subsidiary-management/types/subsidiary.schema";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const subsidiary = await fetchSubsidiaryById(Number(resolvedParams.id));
    return NextResponse.json({ success: true, data: subsidiary });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    
    // Validate partial data
    const validatedData = SubsidiarySchema.partial().parse(body);

    const result = await updateSubsidiary(Number(resolvedParams.id), validatedData);
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "name" in error && error.name === "ZodError") {
      return NextResponse.json({ success: false, message: "Validation error", errors: (error as Record<string, unknown>).errors }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const result = await deleteSubsidiary(Number(resolvedParams.id));
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
