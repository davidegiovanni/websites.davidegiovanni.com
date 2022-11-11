import { LoaderFunction } from "@remix-run/node";
import { safeGet } from "~/utils/safe-post";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)

  const host = (url.host.includes('localhost') || url.host.includes('192.168')) ? 'websites.davidegiovanni.com' : url.host

  const [defaultWebsiteRes, defaultWebsiteErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/${host}?public_key=01exy3y9j9pdvyzhchkpj9vc5w`)
  if (defaultWebsiteErr !== null) {
    throw new Error(`Error: ${defaultWebsiteErr.message} ${defaultWebsiteErr.code}`);
  }

  const locales = defaultWebsiteRes.languageCodes

  function getAlternateLocales(locale: string): string[] {
    return defaultWebsiteRes.languageCodes.filter((l: any) => l !== locale)
  }

  const content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
  ${locales.map((l: any) => (
  `<url>
    <loc>https://${host}/${l}</loc>
    <lastmod>2022-01-01T00:00:00+01:00</lastmod>${getAlternateLocales(l).map(al => (`
    <xhtml:link
                rel="alternate"
                hreflang="${al}"
                href="https://${host}/${al}"/>`)).toString().split(',').join('')}
    <priority>1.0</priority>
  </url>`)).toString().split(',').join('')
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