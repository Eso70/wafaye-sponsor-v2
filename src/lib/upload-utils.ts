import { unlink } from "node:fs/promises";
import { join } from "node:path";

/**
 * Delete an uploaded image file from disk if it's in the uploads folder.
 * Fails silently (e.g. file not found) - does not throw.
 */
export async function deleteUploadIfExists(imagePath: string): Promise<void> {
  if (!imagePath || !imagePath.startsWith("/uploads/")) return;
  const filename = imagePath.replace(/^\/uploads\//, "").replace(/\.\./g, "");
  if (!filename || filename.includes("/")) return;
  try {
    const filePath = join(process.cwd(), "public", "uploads", filename);
    await unlink(filePath);
  } catch {
    // File may not exist, or permission error - ignore
  }
}
