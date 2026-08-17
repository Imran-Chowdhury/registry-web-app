import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { crc32 } from 'node:zlib';

/**
 * Coursework fixtures for the seed.
 *
 * The seeded submissions carry real bytes rather than dangling database rows: the
 * download route validates and streams an actual file, and the upload validator accepts
 * a type by its magic bytes, so seed data that is only metadata would leave both
 * unexercised and every download in the demo a 404.
 *
 * Kept out of `seed.ts` because a PDF writer and a ZIP writer are mechanical detail that
 * would bury the registry data they exist to support.
 *
 * The storage layout is duplicated from `src/lib/storage.ts` rather than imported —
 * that module is `server-only`, which throws outside the Next.js server runtime. The
 * shape is one line (`{attempt}-{hash}{ext}` under `{assessmentId}/{studentId}`) and is
 * asserted by the download route working against seeded rows.
 */

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');

export type FileKind = 'pdf' | 'docx';

export const MIME_TYPES: Record<FileKind, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/** Drops every seeded file. Called before writing, so re-seeding leaves no orphans. */
export async function clearUploads(): Promise<void> {
  await rm(UPLOAD_ROOT, { recursive: true, force: true });
}

/** Writes one submission and returns the columns the database row needs. */
export async function writeSubmissionFile(input: {
  assessmentId: string;
  studentId: string;
  attempt: number;
  fileName: string;
  kind: FileKind;
  title: string;
}): Promise<{ filePath: string; fileSize: number; mimeType: string }> {
  const { assessmentId, studentId, attempt, fileName, kind, title } = input;

  const bytes = kind === 'pdf' ? pdfBytes(title) : docxBytes(title);
  const directory = path.join(UPLOAD_ROOT, assessmentId, studentId);
  await mkdir(directory, { recursive: true });

  const extension = path.extname(fileName).toLowerCase();
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
  const absolutePath = path.join(directory, `${attempt}-${hash}${extension}`);
  await writeFile(absolutePath, bytes);

  return {
    filePath: path.relative(UPLOAD_ROOT, absolutePath).split(path.sep).join('/'),
    fileSize: bytes.byteLength,
    mimeType: MIME_TYPES[kind],
  };
}

/**
 * A single-page PDF, written by hand.
 *
 * Byte offsets in the cross-reference table are computed as the objects are appended,
 * because a PDF with a wrong xref opens in some readers and not others — and a reviewer
 * clicking a download deserves a file that opens.
 */
function pdfBytes(title: string): Buffer {
  const escaped = title.replace(/[\\()]/g, (character) => `\\${character}`);
  const content = `BT /F1 16 Tf 72 760 Td (${escaped}) Tj ET\n`;

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ' +
      '/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${content.length} >>\nstream\n${content}endstream`,
  ];

  let body = '%PDF-1.4\n';
  const offsets: number[] = [];

  objects.forEach((object, index) => {
    offsets.push(body.length);
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = body.length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    xref += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }

  const trailer =
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n` +
    `startxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(body + xref + trailer, 'latin1');
}

/**
 * A minimal Office Open XML package — a real ZIP, not four bytes that pass the check.
 *
 * The upload validator identifies DOCX by the ZIP signature, so a stub would satisfy it
 * while producing a file Word refuses to open. Three parts is the smallest package that
 * is genuinely a document: the content types map, the package relationships, and the
 * document body.
 */
function docxBytes(title: string): Buffer {
  const escaped = title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return zip([
    {
      name: '[Content_Types].xml',
      content:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
        '</Types>',
    },
    {
      name: '_rels/.rels',
      content:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Target="word/document.xml" ' +
        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"/>' +
        '</Relationships>',
    },
    {
      name: 'word/document.xml',
      content:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
        `<w:body><w:p><w:r><w:t>${escaped}</w:t></w:r></w:p></w:body>` +
        '</w:document>',
    },
  ]);
}

/**
 * A ZIP archive with stored (uncompressed) entries.
 *
 * Uncompressed on purpose: the deflate path would add a second failure mode for files
 * measured in hundreds of bytes, and every reader accepts stored entries.
 */
function zip(entries: { name: string; content: string }[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8');
    const data = Buffer.from(entry.content, 'utf8');
    const checksum = crc32(data);

    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0); // local file header signature — "PK\x03\x04"
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0, 6); // flags
    local.writeUInt16LE(0, 8); // method: stored
    local.writeUInt16LE(0, 10); // modification time
    local.writeUInt16LE(0x21, 12); // modification date — 1 January 1996, fixed for determinism
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(data.length, 18); // compressed size
    local.writeUInt32LE(data.length, 22); // uncompressed size
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28); // extra field length
    name.copy(local, 30);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0); // central directory header signature
    central.writeUInt16LE(20, 4); // version made by
    central.writeUInt16LE(20, 6); // version needed
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0x21, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30); // extra field length
    central.writeUInt16LE(0, 32); // comment length
    central.writeUInt16LE(0, 34); // disk number
    central.writeUInt16LE(0, 36); // internal attributes
    central.writeUInt32LE(0, 38); // external attributes
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);

    locals.push(local, data);
    centrals.push(central);
    offset += local.length + data.length;
  }

  const centralSize = centrals.reduce((total, buffer) => total + buffer.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); // end of central directory signature
  end.writeUInt16LE(0, 4); // disk number
  end.writeUInt16LE(0, 6); // disk with central directory
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([...locals, ...centrals, end]);
}
