import { json, LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, NavLink, Outlet, useCatch, useLoaderData, useLocation, useParams, useSubmit, useTransition } from "@remix-run/react";
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { Feed, FeedItem, WebLinkModel, WebPageModel, WebSectionModel } from "api/models";
import metadata from '~/utils/metadata'
import link from '~/utils/links'
import parse from 'html-react-parser'
import { Attachment } from "~/components/Attachment";
import queryString from 'query-string'
import { useEffect, useState } from "react";

function getPageSlug(url: string) {
  return url.replace('https://websites.davidegiovanni.com/', '')
}

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
    const { currentWebsite, host } = data as LoaderData;
    title = (currentWebsite.title !== '' ? currentWebsite.title : "Homepage")
    description = currentWebsite.summary !== '' ? currentWebsite.summary : title
    image = currentWebsite.image !== '' ? currentWebsite.image : ''
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
  page: WebPageModel | null;
  sections: WebSectionModel[];
  logo: string;
  primary: string;
  secondary: string;
  host: string;
  currentWebsite: FeedItem;
  nextWebsite: FeedItem | null;
  hasNextWebsite: boolean;
  previousWebsite: FeedItem | null;
  hasPreviousWebsite: boolean;
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

  let page: WebPageModel | null = null
  let sections: WebSectionModel[] = []

  const [pageRes, pageErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/${host}/pages/${params.work}?public_key=01exy3y9j9pdvyzhchkpj9vc5w&language_code=${lang}`)
  if (pageErr === null && pageRes !== null) {
    page = pageRes.page as WebPageModel
    sections = page.sections
  }

  const [websitesFeedRes, websitesFeedErr] = await safeGet<any>(request, `https://cdn.revas.app/contents/v0/directories/websites-portfolio-${params.lang?.toLowerCase().split('-')[0]}/feed.json?public_key=01exy3y9j9pdvyzhchkpj9vc5w`)
  if (websitesFeedErr !== null) {
    throw new Response(`API Feed: ${websitesFeedErr.message}, ${websitesFeedErr.code}`, {
      status: 404,
    });
  }

  const websitesFeed: Feed = websitesFeedRes

  const websites: FeedItem[] = websitesFeed.items

  let foundWebsite = websites.find((i: any) => {
    return i.id.endsWith(params.work)
  })
  if (foundWebsite === undefined) {
    throw new Response(`Page do not exist`, {
      status: 404,
    });
  }

  const currentWebsite = foundWebsite

  let nextWebsite = null
  let hasNextWebsite = false
  let previousWebsite = null
  let hasPreviousWebsite = false

  if (websites.indexOf(foundWebsite) < websites.length - 1) {
    nextWebsite = websites[websites.indexOf(foundWebsite) + 1]
    hasNextWebsite = true
  }

  if (websites.indexOf(foundWebsite) > 0) {
    previousWebsite = websites[websites.indexOf(foundWebsite) - 1]
    hasPreviousWebsite = true
  }

  const loaderData: LoaderData = {
    i18n,
    page,
    sections,
    primary,
    secondary,
    logo,
    host,
    currentWebsite,
    nextWebsite,
    hasNextWebsite,
    previousWebsite,
    hasPreviousWebsite
  }

  return json(loaderData)
};

export default function Index() {
  const loaderData = useLoaderData<LoaderData>();
  const params = useParams()
  const transition = useTransition()
  const sections = loaderData.sections
  const currentWebsite = loaderData.currentWebsite
  const nextWebsite = loaderData.nextWebsite
  const hasNextWebsite = loaderData.hasNextWebsite
  const previousWebsite = loaderData.previousWebsite
  const hasPreviousWebsite = loaderData.hasPreviousWebsite

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
    let link: WebLinkModel = {
      title: sections[number].primaryLink.title,
      url: ''
    }
    const rawLink = sections[number].primaryLink
    link.url = rawLink.url.includes('websites.davidegiovanni.com') ? rawLink.url.replace('websites.davidegiovanni.com', '') : rawLink.url
    return link
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      const doc = document.getElementById('scrollingDetail') as HTMLElement
      doc.scrollTo(0,0)
    }, 1);
    return () => clearTimeout(timer);
  }, [currentWebsite]
  )

  return (
    <div className="overflow-y-auto bg-zinc-400 h-full w-full uppercase" id="scrollingDetail">
      <div className="hidden grid-cols-12 gap-[2vmin] fixed inset-0 z-50 select-none pointer-events-none">
        { [0,1,2,3,4,5,6,7,8,9,10,11].map(n => (
          <div className="h-full bg-white opacity-25"></div>
        ))}
      </div>
      <div>
        <div className="fixed top-0 right-0 m-[2vmin] z-50">
          {
            !currentWebsite.id.endsWith('other-websites') && (
            <a href={'https://' + getSlug(currentWebsite.id).split('-').join('.')} target="_blank" rel="noopener" className="px-4 py-2 rounded-[50%] border border-black">
            { getSlug(currentWebsite.id).split('-').join('.')}
            </a>
            )
          }
        </div>
        <div className="grid grid-cols-12 h-screen lg:sticky top-0 relative">
            <Link to={`/${params.lang}/works`} prefetch="intent" className="px-4 py-2 rounded-[50%] border border-black absolute top-0 left-0 m-[2vmin] z-50">
              Tutti i siti
            </Link>
          <div className="col-span-12 relative lg:col-span-6 flex items-center justify-center p-[2vmin] ">
            <div className="max-w-xl relative">
              <div>
              <Attachment attachment={{
                id: "",
                mediaType: "image/",
                url: currentWebsite.image,
                description: ""
              }}></Attachment>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-12 lg:h-screen p-[2vmin] mb-[25vh] lg:mb-0">
          <div className="col-span-9 lg:col-span-3 lg:col-start-9">
            <p className="text-sm mb-[8vmin] w-full flex items-center justify-between">
              <span>{ currentWebsite.title}</span>
              <span>{ new Date(currentWebsite.date_published).getFullYear()}</span>
            </p>
            <p className="text-sm">
            { currentWebsite.summary}
            </p>
          </div>
        </div>
        {
          sections.length > 0 && (
            <div className="grid grid-cols-12 h-screen p-[2vmin]">
              <div className="col-span-9 col-start-3 lg:col-span-3 lg:col-start-9">
                <p className="text-sm mb-[8vmin]">
                  {title(0)}
                </p>
                <p className="text-sm">
                  {description(0)}
                </p>
              </div>
            </div>
          )
        }
      </div>
        { currentWebsite.content_html !== "" && currentWebsite.content_html !== undefined &&
          <div className="grid grid-cols-12 p-[2vmin]">
              <article className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[4vmin] prose prose-sm prose-img:m-0 prose-p:m-0 max-w-none prose-a:my-[1vmin] prose-a:no-underline text-black prose-a:text-black prose-a:w-fit prose-a:rounded-[50%] prose-a:block prose-a:px-4 prose-a:py-2 prose-a:border prose-a:border-black prose-blockquote:bg-gray-100 prose-blockquote:p-8 prose-blockquote:border-0 prose-blockquote:prose-p:first-of-type:before:opacity-0 prose-a:visited:text-[purple] prose-li:marker:text-[black] prose-hr:opacity-0">
              {parse(currentWebsite.content_html)}
            </article>
          </div>
        }
        {
          sections.length > 1 && (
            <div className="mt-[25vh]">
              {
                 sections.slice(1).map((s, index) => (
                  <div className="grid grid-cols-12">
                    {
                      title(index + 1) !== "" && (
                        <h2 className="text-sm lg:text-base col-span-12 p-[2vmin]">
                          {title(index + 1)}
                        </h2>
                      )
                    }
                    {
                      image(index + 1) !== "" && (
                      <div className="col-span-12 aspect-[2/1] relative">
                        <Attachment attachment={{
                          id: "",
                          mediaType: "image/",
                          url: image(index + 1),
                          description: ""
                        }}></Attachment>
                      </div>
                      )
                    }
                    {
                      description(index + 1) !== "" && (
                        <h3 className="text-sm col-span-9 lg:col-span-4 col-start-2 lg:col-start-7 p-[2vmin] mt-[2vmin]">
                          {description(index + 1)}
                        </h3>
                      )
                    }
                  </div>
                ))
              }
            </div>
          )
        }
      <div style={{ height: "calc(100vh - env(safe-area-inset-bottom))" }} className="grid grid-cols-12 border-t border-black relative p-[2vmin] mt-[25vh]">
        <Link to={`/${params.lang}/works`} prefetch="intent" className="px-4 py-2 rounded-[50%] border border-black absolute top-0 left-0 m-[2vmin] z-50">
          Tutti i siti
        </Link>
        <div className="absolute bottom-0 inset-x-0 flex items-end justify-between p-[2vmin]">
          <div>
          {
              hasPreviousWebsite && previousWebsite !== null && (
                <Link to={`/${params.lang}/works/${getSlug(previousWebsite.id)}`} prefetch="intent" className="block px-4 py-2 rounded-[50%] border border-black">
                  Precedente
                </Link>
              )
            }
          </div>
          <div>
            {
              hasNextWebsite && nextWebsite !== null && (
                <Link to={`/${params.lang}/works/${getSlug(nextWebsite.id)}`} prefetch="intent" className="block px-4 py-2 rounded-[50%] border border-black">
                  Successivo
                </Link>
              )
            }
          </div>
        </div>
      </div>
    </div>
  );
}