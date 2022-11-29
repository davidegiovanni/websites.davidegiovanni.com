import { json, LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, NavLink, Outlet, useCatch, useLoaderData, useLocation, useNavigate, useParams, useTransition } from "@remix-run/react";
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { Feed, FeedItem, WebPageModel, WebSectionModel } from "api/models";
import metadata from '~/utils/metadata'
import link from '~/utils/links'
import parse from 'html-react-parser'
import { useEffect, useState } from "react";

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
  const transition = useTransition()
  const navigate = useNavigate()

  const [isLoadingHome, setLoadingHome] = useState<boolean>(false)

  useEffect(() => {
    if (isLoadingHome) {
      setTimeout(() => {
        navigate(`/${params.lang}`)
      }, 900)
    }
  })

  return (
    <div className={(isLoadingHome ? "bg-opacity-0 " : "bg-opacity-40 ") + "overflow-hidden bg-black flex items-stretch justify-end h-full w-full p-[2vmin] delay-700 transition-all duration-200"}>
      <div className={(isLoadingHome ? "translate-x-[120%] " : "translate-x-0 ") + "relative w-full md:w-2/3 lg:w-1/2 max-w-2xl h-full flex items-stretch justify-end delay-100 transition-all duration-500"}>
        <div className="p-[2vmin] w-16 flex-none relative z-20">
          <div className="flex items-center whitespace-nowrap absolute top-0 right-0 -rotate-90 origin-bottom-right -translate-y-full -translate-x-0.5">
            <h1 className="uppercase text-2xl">
              {feature.title} 
            </h1>
            <button onClick={() => {setLoadingHome(true)}} className="mx-[2vmin] px-4 py-2 rounded-[50%] border border-black uppercase text-2xl">
              HOME
            </button>
          </div>
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