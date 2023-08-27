import { LoaderFunction } from "@remix-run/node";

export const loader: LoaderFunction = ({ request }) => {
  const url = request.url
  const host = new URL(url).host

  let websiteName = host;

const robotText = 
`User-agent: *
Allow: /

Sitemap: https://${websiteName}/sitemap.xml
`
  // return the text content, a status 200 success response, and set the content type to text/plain 
  return new Response(robotText, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    }
  });
};