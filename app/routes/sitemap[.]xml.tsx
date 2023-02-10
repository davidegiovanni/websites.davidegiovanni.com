import { LoaderFunction } from "@remix-run/node";
import { safeGet } from "~/utils/safe-post";
import queryString from 'query-string'

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)

  const host = (url.host.includes('localhost') || url.host.includes('192.168')) ? 'websites.davidegiovanni.com' : url.host

  const pages: any = {
    'it-IT': [
      'it-IT/works',
      'it-IT/features'
    ]
  }

  const directories: any = {
    'it-IT': [
      'websites-features-it',
      'websites-portfolio-it'
    ]
  }

  function getSlug(url: string): string {
    const parsed = queryString.parse(url)
    return parsed.content as string
  }

  let italianContents: string[] = []

  for (let index = 0; index < directories['it-IT'].length; index++) {
    const directoryUrl = directories['it-IT'][index];
    
    const [websitesFeedRes, websitesFeedErr] = await safeGet<any>(request, `https://cdn.revas.app/contents/v0/directories/${directoryUrl}/feed.json?public_key=01exy3y9j9pdvyzhchkpj9vc5w`)
    if (websitesFeedErr !== null) {
      throw new Response(`API Feed: ${websitesFeedErr.message}, ${websitesFeedErr.code}`, {
        status: 404,
      });
    }

    for (let j = 0; j < websitesFeedRes.items.length; j++) {
      const item = websitesFeedRes.items[j];
      const itemUrl = getSlug(item.id)
      italianContents.push(`https://${host}/it-IT/${directoryUrl.includes('portfolio') ? "works" : "features"}/${itemUrl}`)
    }
  }

  const [defaultWebsiteRes, defaultWebsiteErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/${host}?public_key=01exy3y9j9pdvyzhchkpj9vc5w`)
  if (defaultWebsiteErr !== null) {
    throw new Error(`Error: ${defaultWebsiteErr.message} ${defaultWebsiteErr.code}`);
  }

  const locales = defaultWebsiteRes.languageCodes

  function getAlternateLocales(locale: string): string[] {
    return defaultWebsiteRes.languageCodes.filter((l: any) => l !== locale)
  }

  const pagesList = locales.map((l: any) => (pages[l])?.map((p: any) =>
`<url>
  <loc>https://${host}/${p}</loc>
  <lastmod>2022-01-01T00:00:00+01:00</lastmod>
  <priority>1.0</priority>
</url>
`).join("")
)

const indexesList = locales.map((l: any) =>
`<url>
  <loc>https://${host}/${l}</loc>
  <lastmod>2022-01-01T00:00:00+01:00</lastmod>
  <priority>1.0</priority>
</url>
`).join("")

const italianContentsList = italianContents.map((c: string) =>
`<url>
  <loc>${c}</loc>
  <lastmod>2022-01-01T00:00:00+01:00</lastmod>
  <priority>1.0</priority>
</url>`
).join("")

const content = 
`<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"
>
${indexesList}
${pagesList}
${italianContentsList}
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