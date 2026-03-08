import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync, statSync } from "node:fs";

export const runtime = "nodejs";

const MIME_TYPES: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
};

export async function GET(
    request: Request,
    { params }: { params: Promise<{ filename: string }> }
) {
    const { filename } = await params;

    if (!filename || typeof filename !== "string") {
        return new NextResponse("Not Found", { status: 404 });
    }

    // Security check: Prevent path traversal attacks
    const safeFilename = filename.replace(/\.\./g, "").replace(/\//g, "");
    if (!safeFilename) {
        return new NextResponse("Not Found", { status: 404 });
    }

    const filePath = join(process.cwd(), "public", "uploads", safeFilename);

    if (!existsSync(filePath)) {
        return new NextResponse("Not Found", { status: 404 });
    }

    try {
        const stats = statSync(filePath);
        if (!stats.isFile()) {
            return new NextResponse("Not Found", { status: 404 });
        }

        const buffer = await readFile(filePath);
        const ext = safeFilename.split(".").pop()?.toLowerCase() || "";
        const contentType = MIME_TYPES[ext] || "application/octet-stream";

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        console.error("Error serving uploaded file:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
