import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const skipDirs = new Set([".git", ".playwright-mcp", "logs"]);

async function collectHtmlFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue;
      files.push(...await collectHtmlFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(fullPath);
    }
  }

  return files;
}

const htmlFiles = await collectHtmlFiles(root);

const maxTitle = 60;
const maxDescription = 155;
const maxParagraph = 360;

function collectMatches(text, regex) {
  return [...text.matchAll(regex)];
}

function stripTags(value) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scorePage({ title, description, h1Count, textBlocks, words, hasCanonical, imageCount, hasAltImages, noindex }) {
  const issues = [];

  if (!title) issues.push("Missing title");
  else if (title.length > maxTitle) issues.push(`Title too long (${title.length})`);

  if (!noindex && !description) issues.push("Missing meta description");
  else if (!noindex && description.length > maxDescription) issues.push(`Description too long (${description.length})`);

  if (h1Count === 0) issues.push("Missing H1");
  if (h1Count > 1) issues.push(`Multiple H1s (${h1Count})`);

  const longBlocks = textBlocks.filter((block) => block.length > maxParagraph);
  if (longBlocks.length > 0) issues.push(`${longBlocks.length} long text block(s)`);

  if (!noindex && !hasCanonical) issues.push("No canonical tag");
  if (imageCount > 0 && !hasAltImages) issues.push("No image alt text found");
  if (words < 70) issues.push("Thin page copy");

  const seo = [
    title && title.length <= maxTitle ? "title ok" : "title fix",
    noindex || (description && description.length <= maxDescription) ? "description ok" : "description fix",
    h1Count === 1 ? "h1 ok" : "h1 fix",
    hasCanonical ? "canonical ok" : "canonical fix",
  ];

  return { issues, seo };
}

const report = [];
let exitCode = 0;

for (const file of htmlFiles) {
  const raw = await fs.readFile(file, "utf8");
  const noindex = /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(raw);
  const title = (raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").trim();
  const description = (raw.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1] || "").trim();
  const h1Count = collectMatches(raw, /<h1\b/gi).length;
  const hasCanonical = /<link\s+rel="canonical"/i.test(raw);
  const imageTags = collectMatches(raw, /<img\b[^>]*>/gi).map((match) => match[0]);
  const hasAltImages = imageTags.every((tag) => /\balt\s*=\s*["'][^"']*["']/i.test(tag));
  const blocks = collectMatches(raw, /<p\b[^>]*>([\s\S]*?)<\/p>/gi).map((match) => stripTags(match[1]));
  const words = stripTags(raw).split(/\s+/).filter(Boolean).length;

  const { issues } = scorePage({ title, description, h1Count, textBlocks: blocks, words, hasCanonical, imageCount: imageTags.length, hasAltImages, noindex });
  const severity = issues.length ? "needs work" : "ok";
  if (issues.length) exitCode = 1;

  report.push({
    file: path.relative(root, file),
    flags: noindex ? ["noindex"] : [],
    severity,
    issues,
  });
}

console.log(`Content audit (${report.length} page${report.length === 1 ? "" : "s"})`);
for (const item of report) {
  const issueText = item.issues.length ? item.issues.join("; ") : "clean";
  const flagText = item.flags.length ? ` [${item.flags.join(", ")}]` : "";
  console.log(`- ${item.file}${flagText}: ${item.severity} (${issueText})`);
}

process.exitCode = exitCode;
