import { json, LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, NavLink, Outlet, useCatch, useLoaderData, useLocation, useParams } from "@remix-run/react";
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { Feed, FeedItem, WebPageModel, WebSectionModel } from "api/models";
import metadata from '~/utils/metadata'
import link from '~/utils/links'
import parse from 'html-react-parser'

export const links: LinksFunction = () => {
  return link(
    {
      canonical: 'https://websites.davidegiovanni.com'
    }
  )
};

export const meta: MetaFunction = ({ data, location }) => {
  let title = 'Website error'
  let description = 'The website didn\'t load correctly'
  let image = ''
  let url = 'https://websites.davidegiovanni.com' + location.pathname

  if (data !== undefined) {
    const { feature, host } = data as LoaderData;
    title = (feature.title !== '' ? feature.title : "Page")
    description = feature.summary !== '' ? feature.summary : title
    image = feature.image !== '' ? feature.image : ''
    url = 'https://' + host + location.pathname
  }

  return metadata(
    {
      title: title,
      description: description,
      image: image,
      url: url,
      robots: 'all',
      type: 'website',
    }
  )
};

const i18nKeys = [] as const;
type I18nKeys = typeof i18nKeys[number];

type LoaderData = {
  i18n: Record<I18nKeys, any>;
  primary: string;
  host: string;
  feature: FeedItem;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const i18n = loadTranslations<I18nKeys>(params.lang as string, i18nKeys);

  let url = new URL(request.url)
  const host = (url.host.includes('localhost') || url.host.includes('192.168')) ? 'websites.davidegiovanni.com' : url.host

  let lang = params.lang

  const [websiteRes, websiteErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/${host}?public_key=01exy3y9j9pdvyzhchkpj9vc5w&language_code=${lang}`)
  if (websiteErr !== null) {
    throw new Response(`Error loading website: ${websiteErr.message} ${websiteErr.code}`, {
      status: 404,
    });
  }

  const primary = websiteRes.website.theme.primaryColor

  const [featuresFeedRes, featuresFeedErr] = await safeGet<any>(request, `https://cdn.revas.app/contents/v0/directories/websites-features-${params.lang?.toLowerCase().split('-')[0]}/feed.json?public_key=01exy3y9j9pdvyzhchkpj9vc5w`)
  if (featuresFeedErr !== null) {
    throw new Response(`API Feed: ${featuresFeedErr.message}, ${featuresFeedErr.code}`, {
      status: 404,
    });
  }

  const featuresFeed: Feed = featuresFeedRes

  const features: FeedItem[] = featuresFeed.items
  const slug = params.feature
  let feature = features.find((i: any) => {
    return i.id.endsWith(slug)
  })
  if (feature === undefined) {
    throw new Response(`Page do not exist`, {
      status: 404,
    });
  }

  const loaderData: LoaderData = {
    i18n,
    host,
    primary,
    feature
  }

  return json(loaderData)
};

export default function Index() {
  const loaderData = useLoaderData<LoaderData>();
  const params = useParams()
  const location = useLocation()
  const feature = loaderData.feature

  return (
    <div className="overflow-hidden bg-black bg-opacity-40 flex items-stretch justify-end h-full w-full p-[2vmin]">
      <div className="relative w-full md:w-2/3 lg:w-1/2 max-w-2xl h-full flex items-stretch justify-end">
        <div className="p-[2vmin] w-12 flex-none relative z-20">
          <h1 className="uppercase text-2xl absolute top-0 right-0 -rotate-90 origin-bottom-right -translate-y-full -translate-x-2">
            {feature.title} 
            <Link to={`/${params.lang}`} className="mx-[2vmin] px-4 py-2 rounded-[50%] border border-black">
              HOME
            </Link>
          </h1>
        </div>
        <div className="pr-[2vmin] py-[2vmin] pl-[1vmin] h-full overflow-y-auto relative z-20">
        { feature.content_html !== "" && feature.content_html !== undefined &&
              <article className="block prose prose-2xl max-w-none text-black prose-a:text-[blue] prose-a:underline-offset-4 prose-blockquote:bg-gray-100 prose-blockquote:p-8 prose-blockquote:border-0 prose-blockquote:prose-p:first-of-type:before:opacity-0 prose-a:visited:text-[purple] prose-li:marker:text-[black] prose-p:leading-8">
              {parse(feature.content_html)}
            </article>
            }
        </div>
        <div className="bg-white blur-sm absolute inset-0 rounded-3xl"></div>
      </div>
    </div>
  );
}