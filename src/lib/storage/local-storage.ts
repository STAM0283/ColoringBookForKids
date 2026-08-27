import crypto from "node:crypto";
import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileTypeFromBuffer } from "file-type";
import { MAX_VIDEO_SIZE_BYTES, MAX_VIDEO_SIZE_LABEL } from "@/lib/media-limits";

export type MediaKind = "IMAGE" | "PDF" | "VIDEO";
const rules = {
  IMAGE: { max: 15 * 1024 ** 2, mimes: ["image/jpeg", "image/png", "image/webp", "image/avif"] },
  PDF: { max: 50 * 1024 ** 2, mimes: ["application/pdf"] },
  VIDEO: { max: MAX_VIDEO_SIZE_BYTES, mimes: ["video/mp4"] },
};

export interface StorageService {
  uploadFile(file: File, kind: MediaKind): Promise<{ path: string; filename: string; size: number; mimeType: string }>;
  deleteFile(path: string): Promise<void>;
  validateFile(file: File, kind: MediaKind): Promise<void>;
  generateSafeFilename(original: string): string;
}

export class LocalStorageService implements StorageService {
  private readonly root = path.resolve(/*turbopackIgnore: true*/ process.env.MEDIA_ROOT ?? "./data/media");

  private resolve(relative: string) {
    const target = path.resolve(this.root, relative);
    if (target !== this.root && !target.startsWith(this.root + path.sep)) throw new Error("Chemin de média invalide");
    return target;
  }

  generateSafeFilename(original: string) {
    const extension = path.extname(original).toLowerCase().replace(/[^.a-z0-9]/g, "");
    return `${crypto.randomUUID()}${extension}`;
  }

  async validateFile(file: File, kind: MediaKind) {
    const rule = rules[kind];
    if (file.size > rule.max) throw new Error(kind === "VIDEO" ? `La vidéo dépasse la limite de ${MAX_VIDEO_SIZE_LABEL}.` : "Fichier trop volumineux");
    const head = Buffer.from(await file.slice(0, Math.min(file.size, 4100)).arrayBuffer());
    const detected = await fileTypeFromBuffer(head);
    if (!detected || !rule.mimes.includes(detected.mime)) throw new Error("Type de fichier invalide");
  }

  async uploadFile(file: File, kind: MediaKind) {
    await this.validateFile(file, kind);
    const folder = kind === "IMAGE" ? "images" : kind === "PDF" ? "pdf" : "videos";
    const filename = this.generateSafeFilename(file.name);
    const relative = path.join(folder, filename);
    const absolute = this.resolve(relative);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await pipeline(Readable.fromWeb(file.stream() as never), createWriteStream(absolute, { flags: "wx" }));
    return { path: relative.replaceAll("\\", "/"), filename, size: file.size, mimeType: file.type };
  }

  async deleteFile(filePath: string) { await fs.unlink(this.resolve(filePath)); }
}

export const storageService = new LocalStorageService();
