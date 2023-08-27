import { LoaderFunction } from "@remix-run/node";
import { safeGet } from "~/utils/safe-post";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)

  const host = (url.host.includes('localhost') || url.host.includes('192.168')) ? 'websites.davidegiovanni.com' : url.host

  const pages: any = {
    'it-IT': []
  }
  
  const [defaultWebsiteRes, defaultWebsiteErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/${host}?public_key=01exy3y9j9pdvyzhchkpj9vc5w`)
  if (defaultWebsiteErr !== null) {
    throw new Error(`Error: ${defaultWebsiteErr.message} ${defaultWebsiteErr.code}`);
  }

  const locales = defaultWebsiteRes.languageCodes

const pagesList = locales.map((l: any) => (pages[l])?.map((p: any) =>
`<url>
  <loc>https://${host}/${l}/${p}</loc>
</url>
`).join("")
)

const indexesList = locales.map((l: any) =>
`<url>
  <loc>https://${host}/${l}</loc>
</url>
`).join("")
  

  const content = 
`<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"
>
${indexesList}
${pagesList}
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