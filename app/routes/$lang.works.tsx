import { json, LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, NavLink, Outlet, useCatch, useLoaderData, useLocation, useParams } from "@remix-run/react";
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { Feed, FeedItem, WebPageModel, WebSectionModel } from "api/models";
import metadata from '~/utils/metadata'
import link from '~/utils/links'
import { fluidType } from '~/utils/helpers'
import { Attachment } from "~/components/Attachment";
import queryString from 'query-string'
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
    const { page, host } = data as LoaderData;
    title = (page.title !== '' ? page.title : "Homepage")
    description = page.description !== '' ? page.description : title
    image = page.image !== '' ? page.image : ''
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
  page: WebPageModel;
  mainSection: WebSectionModel;
  sections: WebSectionModel[];
  logo: string;
  primary: string;
  secondary: string;
  host: string;
  websites: FeedItem[];
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
  const logo = websiteRes.website.theme.logoUrl
  const primary = websiteRes.website.theme.primaryColor
  const secondary = websiteRes.website.theme.invertedPrimaryColor

  const [pageRes, pageErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/${host}/pages/works?public_key=01exy3y9j9pdvyzhchkpj9vc5w&language_code=${lang}`)
  if (pageErr !== null) {
    throw new Response(`Page do not exist: ${pageErr.message} ${pageErr.code}`, {
      status: 404,
    });
  }

  const page: WebPageModel = pageRes.page

  const mainSection: WebSectionModel = page.sections[0]
  const sections: WebSectionModel[] = page.sections.slice(1)

  const [websitesFeedRes, websitesFeedErr] = await safeGet<any>(request, `https://cdn.revas.app/contents/v0/directories/websites-portfolio-${params.lang?.toLowerCase().split('-')[0]}/feed.json?public_key=01exy3y9j9pdvyzhchkpj9vc5w`)
  if (websitesFeedErr !== null) {
    throw new Response(`API Feed: ${websitesFeedErr.message}, ${websitesFeedErr.code}`, {
      status: 404,
    });
  }

  const websitesFeed: Feed = websitesFeedRes

  const websites: FeedItem[] = websitesFeed.items

  const loaderData: LoaderData = {
    i18n,
    page,
    mainSection,
    sections,
    primary,
    secondary,
    logo,
    host,
    websites
  }

  return json(loaderData)
};

export default function Index() {
  const loaderData = useLoaderData<LoaderData>();
  const params = useParams()
  const location = useLocation()

  const mainSection = loaderData.mainSection
  const sections = loaderData.sections
  const logo = loaderData.logo
  const websites = loaderData.websites

  function getSlug(url: string): string {
    const parsed = queryString.parse(url)
    return parsed.content as string
  }

  const title = (number: number) => {
    return sections[number].title
  }

  const description = (number: number) => {
    return sections[number].description
  }

  const image = (number: number) => {
    return sections[number].image
  }

  const link = (number: number) => {
    return sections[number].primaryLink
  }

  const [currentTime, setCurrentTime] = useState('-------')

  const getTimeDate = () => {
    var date = new Date();
    var current_date = date.getFullYear()+"-"+(date.getMonth()+1)+"-"+ date.getDate();
    var current_time = `${date.getHours() < 10 ? '0': ''}${date.getHours()}`+":"+`${date.getMinutes() < 10 ? '0': ''}${date.getMinutes()}`+":"+ `${date.getSeconds()}${date.getSeconds() < 10 ? '0': ''}`;
    var date_time = current_date+" - "+current_time;
    setCurrentTime(date_time)
  }

  useEffect(
    () => {setTimeout(getTimeDate, 1000)}
  )

  return (
    <div className="overflow-y-auto bg-zinc-400 h-full w-full uppercase">
      <div className="hidden grid-cols-12 gap-[2vmin] fixed inset-0 z-50 select-none pointer-events-none">
        { [0,1,2,3,4,5,6,7,8,9,10,11].map(n => (
          <div className="h-full bg-white opacity-25"></div>
        ))}
      </div>
      <div className="grid grid-cols-12">
        <div className="col-span-12 relative auto-rows-fr border-b border-black aspect-[4/1]">
          <Link to={`/${params.lang}`} prefetch="intent" className="px-4 py-2 rounded-[50%] border border-black absolute top-0 left-0 m-[2vmin] z-50">
            Homepage
          </Link>
        </div>
        {
          websites.map((w, index) => (
            <>
              <div className="col-span-12 lg:col-span-4 aspect-square flex items-center justify-center relative lg:border-r border-b border-black">
                <p className="absolute mx-[1vmin] top-0 left-0">
                  { w.id.endsWith("other-websites") ? w.title : getSlug(w.id).split('-').join('.')}
                </p>
                <p className="absolute mx-[1vmin] top-0 right-0 text-right">
                  {new Date(w.date_published).getFullYear()}
                </p>
                {
                  !w.id.endsWith("other-websites") && (
                    <a href={'https://' + getSlug(w.id).split('-').join('.')} target="_blank" rel="noopener" className="absolute mx-[1vmin] bottom-0 left-0">
                      Visit
                    </a>
                  )
                }
                <Link to={`/${params.lang}/works/${getSlug(w.id)}`} className="absolute mx-[1vmin] bottom-0 right-0 text-right">
                  Info
                </Link>
                <div className="w-1/2">
                  <Attachment attachment={{
                    id: "",
                    mediaType: "image/",
                    url: w.image,
                    description: ""
                  }}></Attachment>
                </div>
              </div>
              {
                index < websites.length - 1 && (
                  <div className="hidden col-span-12 lg:col-span-4 aspect-square lg:flex items-center justify-center relative lg:border-r border-b border-black"></div>
                )
              }
            </>
          ))
        }
      </div>
    </div>
  );
}