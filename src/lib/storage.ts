import 'server-only';

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { ValidationError } from './errors';
import { formatBytes } from './file-size';

/**
 * Local-disk storage adapter.
 *
 * Files live outside the repo tree under ./uploads and are served only through a route
 * handler that checks the viewer — the directory is never exposed statically. Moving to
 * S3 or Vercel Blob replaces the two functions below and nothing else.
 */

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');

/**
 * Accepted types, each with the magic bytes that actually identify it. Checking the
 * extension alone is trivially defeated by renaming, and the browser-supplied MIME type
 * is client input like any other.
 */
const ACCEPTED = [
  {
    mimeType: 'application/pdf',
    extension: '.pdf',
    label: 'PDF',
    // "%PDF"
    magic: [0x25, 0x50, 0x44, 0x46],
  },
  {
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extension: '.docx',
    label: 'DOCX',
    // DOCX is a ZIP container, so its first four bytes are the ZIP signature.
    magic: [0x50, 0x4b, 0x03, 0x04],
  },
] as const;

export const ACCEPTED_LABEL = ACCEPTED.map((type) => type.label).join(' or ');
export const ACCEPTED_EXTENSIONS = ACCEPTED.map((type) => type.extension).join(',');

export type StoredFile = {
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
};

/**
 * Validates and writes an upload. Every rejection names the actual problem, because
 * "upload failed" tells a student nothing they can act on.
 */
export async function storeSubmissionFile(input: {
  file: File;
  assessmentId: string;
  studentId: string;
  attempt: number;
}): Promise<StoredFile> {
  const { file, assessmentId, studentId, attempt } = input;

  if (file.size === 0) {
    throw new ValidationError('That file is empty.');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new ValidationError(
      `That file is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_FILE_BYTES)}.`,
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const type = ACCEPTED.find((candidate) => matchesMagic(bytes, candidate.magic));

  if (!type) {
    throw new ValidationError(
      `That file is not a ${ACCEPTED_LABEL}. Check the file and try again.`,
    );
  }

  // A .pdf whose contents are a ZIP is a mistake worth naming rather than accepting.
  const declaredExtension = path.extname(file.name).toLowerCase();
  if (declaredExtension && declaredExtension !== type.extension) {
    throw new ValidationError(
      `That file is named ${declaredExtension} but its contents are ${type.label}.`,
    );
  }

  const directory = path.join(UPLOAD_ROOT, assessmentId, studentId);
  await mkdir(directory, { recursive: true });

  // The stored name is generated; the original is kept in the database for display.
  const storedName = `${attempt}-${hashOf(bytes)}${type.extension}`;
  const absolutePath = path.join(directory, storedName);
  await writeFile(absolutePath, bytes);

  return {
    fileName: sanitiseDisplayName(file.name) || `submission${type.extension}`,
    // Relative, so the record survives the project moving directories.
    filePath: path.relative(UPLOAD_ROOT, absolutePath).split(path.sep).join('/'),
    fileSize: bytes.byteLength,
    mimeType: type.mimeType,
  };
}

/** Reads a stored file back. The caller checks the viewer before calling this. */
export async function readSubmissionFile(filePath: string): Promise<Buffer> {
  const absolutePath = path.join(UPLOAD_ROOT, filePath);

  // Refuses anything resolving outside the upload root, whatever the stored value
  // claims — a traversal guard that does not depend on the database being clean.
  const relative = path.relative(UPLOAD_ROOT, absolutePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new ValidationError('That file path is not valid.');
  }

  return readFile(absolutePath);
}

function matchesMagic(bytes: Buffer, magic: readonly number[]): boolean {
  if (bytes.length < magic.length) return false;
  return magic.every((byte, index) => bytes[index] === byte);
}

const ILLEGAL_NAME_CHARS = new Set(['<', '>', ':', '"', '/', '|', '?', '*', String.fromCharCode(92)]);

/**
 * Strips path separators and control characters from the name kept for display.
 *
 * Written as an explicit filter rather than a regex character class: the ranges involved
 * are easy to get subtly wrong, and a mistake here silently mangles every filename.
 */
function sanitiseDisplayName(name: string): string {
  const base = path.basename(name);
  let cleaned = '';

  for (const character of base) {
    const code = character.codePointAt(0) ?? 0;
    const isControl = code < 0x20 || code === 0x7f;
    if (!isControl && !ILLEGAL_NAME_CHARS.has(character)) {
      cleaned += character;
    }
  }

  return cleaned.trim().slice(0, 120);
}

function hashOf(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex').slice(0, 12);
}
