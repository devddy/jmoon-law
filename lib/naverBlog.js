// 네이버 블로그 RSS를 읽어 NEWS 섹션에 쓸 글 목록으로 변환한다.
// 서버(getStaticProps)에서만 호출된다.

export const NAVER_BLOG_ID = "jmoonlaw";
const RSS_URL = `https://rss.blog.naver.com/${NAVER_BLOG_ID}.xml`;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  if (!m) return "";
  return m[1].replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1").trim();
}

function decodeEntities(str) {
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&");
}

function stripHtml(html) {
  return decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

// "29 Oct, 2022" 형식 (기존 NEWS 카드와 동일)
function formatDate(pubDate) {
  const d = new Date(pubDate);
  if (isNaN(d.getTime())) return "";
  // 한국 시간 기준 날짜
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const day = String(kst.getUTCDate()).padStart(2, "0");
  return `${day} ${MONTHS[kst.getUTCMonth()]}, ${kst.getUTCFullYear()}`;
}

export function parseNaverRss(xml) {
  const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  return items.map((item) => {
    const rawDesc = decodeEntities(getTag(item, "description"));
    const img = rawDesc.match(/<img[^>]+src=["']([^"']+)["']/i);
    const summary = stripHtml(rawDesc);
    return {
      title: stripHtml(getTag(item, "title")),
      link: decodeEntities(getTag(item, "link")).split("?")[0],
      category: stripHtml(getTag(item, "category")),
      date: formatDate(getTag(item, "pubDate")),
      summary: summary.length > 120 ? `${summary.slice(0, 120)}…` : summary,
      thumbnail: img ? img[1] : null,
    };
  });
}

export async function fetchNaverBlogPosts(limit = 3) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(RSS_URL, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`RSS ${res.status}`);
    const xml = await res.text();
    return parseNaverRss(xml).slice(0, limit);
  } catch (e) {
    console.error("[naverBlog] RSS 불러오기 실패:", e.message);
    return null;
  }
}
