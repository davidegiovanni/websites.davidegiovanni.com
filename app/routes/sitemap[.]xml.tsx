import { LoaderFunction } from "@remix-run/node";
import { safeGetFeed } from "~/api";
import { getSlug } from "~/utils/helpers";

function getAllPagesUrl(host: string, pages: string[], lang: string): string[] {
  const pagesUrl: string[] = []
  pages.map(page => {
    pagesUrl.push(`https://${host}/${lang}/${page}`)
  })
  return pagesUrl
}

async function getAllFeedsItemsUrl(host: string, feeds: { key: string; value: string; }[], lang: string): Promise<string[]> {
  const itemsUrl: string[] = []
  for (const feed of feeds) {
    const feedRes = await safeGetFeed(feed.key, {})
    if (typeof feedRes === "string" && feedRes === "error") {
      itemsUrl.push(`https://${host}/${lang}/${feed.value}`)
    } else if (typeof feedRes !== "string") {
      const itemsSlugs: string[] = feedRes.items.map(item => getSlug(item.id) as string)
      itemsUrl.push(...itemsSlugs.map(slug => `https://${host}/${lang}/${feed.value}/${slug}`))
    }
  }
  return itemsUrl
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)

  const host = (url.host.includes('localhost') || url.host.includes('192.168')) ? 'websites.davidegiovanni.com' : url.host

  const allPages = [
    {
      locale: "it-IT",
      pages: [],
      feeds: [{
        key: "websites-portfolio-it",
        value: "websites"
      }]
    }
  ]

  let pagesUrl: string[] = []

  async function processPages() {
    for (const page of allPages) {
      pagesUrl.push(`https://${host}/${page.locale}`);
      
      if (page.pages.length > 0) {
        pagesUrl.push(...getAllPagesUrl(host, page.pages, page.locale));
      }
      
      if (page.feeds.length > 0) {
        const feedUrls = await getAllFeedsItemsUrl(host, page.feeds, page.locale);
        pagesUrl.push(...feedUrls);
      }
    }
  }
  
  await processPages();


const content =
`<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"
>
${pagesUrl.map(page =>
`<url>
  <loc>${page}</loc>
</url>`
).join("")
}
</urlset>
`.trim()

  // Return the response with the content, a status 200 message, and the appropriate headers for an XML page
  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "xml-version": "1.0",
      "encoding": "UTF-8"
    }
  });
};