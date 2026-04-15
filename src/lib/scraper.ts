import axios from "axios";
import * as cheerio from "cheerio";
import { createHash } from "crypto";
import pLimit from "p-limit";
import type { ScrapeResult } from "./types";

type SourceType = ScrapeResult["sourceType"];

const TIMEOUT = parseInt(process.env.SCRAPING_TIMEOUT_MS || "10000", 10);
const MAX_CHARS = parseInt(process.env.MAX_CONTENT_CHARS || "8000", 10);
const CONCURRENCY = parseInt(process.env.MAX_SCRAPE_CONCURRENCY || "3", 10);

const STRIP_SELECTORS = [
  "script","style","nav","footer","header","aside","iframe",
  "[role='banner']","[role='navigation']","[role='complementary']",
  "[class*='cookie']","[class*='popup']","[class*='modal']",
  "[class*='sidebar']","[class*='ad-']","[id*='ad-']",
  ".social-share",".related-posts",".newsletter-signup",
].join(",");

const SELECTORS: Record<SourceType, string[]> = {
  blog: ["article", ".post-content", ".blog-post", ".entry-content", "[class*='blog-body']", "main"],
  announcement: [".press-release", ".newsroom-body", ".announcement-content", "main article", "[role='main']", "main"],
  article: ["article", "[itemprop='articleBody']", ".article-body", ".story-body", ".article-content", "main"],
  unknown: ["main", "[role='main']", "body"],
};

function classifySourceType(url: string, $: cheerio.CheerioAPI): SourceType {
  const path = new URL(url).pathname.toLowerCase();
  if (
    path.includes("/blog") || path.includes("/post") ||
    $(".blog-post, .blog-content, .post-content").length
  ) return "blog";
  if (
    path.includes("/news") || path.includes("/press") ||
    path.includes("/newsroom") || path.includes("/announcement") ||
    $("[class*='press-release'], [class*='newsroom']").length
  ) return "announcement";
  if (
    $("article, [itemprop='articleBody']").length ||
    path.includes("/article")
  ) return "article";
  return "unknown";
}

function extractContent($: cheerio.CheerioAPI, sourceType: SourceType): string {
  $(STRIP_SELECTORS).remove();
  const selectors = SELECTORS[sourceType];
  for (const sel of selectors) {
    const el = $(sel).first();
    if (el.length) {
      const text = el.text().replace(/\s+/g, " ").trim();
      if (text.length >= 200) return text.slice(0, MAX_CHARS);
    }
  }
  // Final fallback to body
  const body = $("body").text().replace(/\s+/g, " ").trim();
  return body.slice(0, MAX_CHARS);
}

async function scrapeOne(url: string): Promise<ScrapeResult> {
  const scrapedAt = new Date().toISOString();
  try {
    const { data } = await axios.get<string>(url, {
      timeout: TIMEOUT,
      headers: { "User-Agent": "MarketIntelBot/1.0" },
      maxRedirects: 3,
      responseType: "text",
    });
    const $ = cheerio.load(data);
    const sourceType = classifySourceType(url, $);
    const title = $("title").text().trim() || $("h1").first().text().trim() || url;
    const content = extractContent($, sourceType);

    if (content.length < 200) {
      return { url, title, content: "", scrapedAt, sourceType, error: "insufficient content" };
    }
    return { url, title, content, scrapedAt, sourceType };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { url, title: url, content: "", scrapedAt, sourceType: "unknown", error: message };
  }
}

export async function scrapeUrls(urls: string[]): Promise<ScrapeResult[]> {
  const limit = pLimit(CONCURRENCY);
  return Promise.all(urls.map((url) => limit(() => scrapeOne(url))));
}

export function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
