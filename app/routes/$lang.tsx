import { json, LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, NavLink, Outlet, useCatch, useLoaderData, useLocation, useParams } from "@remix-run/react";
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { WebPageModel, WebSectionModel } from "api/models";
import metadata from '~/utils/metadata'
import link from '~/utils/links'
import { fluidType } from '~/utils/helpers'
import { Attachment } from "~/components/Attachment";
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

  const [pageRes, pageErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/${host}/pages/index?public_key=01exy3y9j9pdvyzhchkpj9vc5w&language_code=${lang}`)
  if (pageErr !== null) {
    throw new Response(`Page do not exist: ${pageErr.message} ${pageErr.code}`, {
      status: 404,
    });
  }

  const page: WebPageModel = pageRes.page

  const mainSection: WebSectionModel = page.sections[0]
  const sections: WebSectionModel[] = page.sections.slice(1)

  const loaderData: LoaderData = {
    i18n,
    page,
    mainSection,
    sections,
    primary,
    secondary,
    logo,
    host: host
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

  function buildSrcset(url: any, format: string): any {
    const u = url.replace('cdn.revas.app', 'static.eu1.revas-cdn.com')
    const sizes = [600, 800, 1024, 1280, 1536];
    const densities = [1, 2,3];
    const urls = densities.map(
      (density) => `url("${u}?format=${format}&size=${density === 1 ? '1024' : density === 2 ? '1280' : '1536'}w") ${density}x`
    );
    return urls.join(",");
  }

  function getLanguageName (lang: string) {
    switch (lang) {
      case 'it-IT':
        return 'Italiano'
      case 'en-US':
        return 'English'
      case 'fr-FR':
        return 'Français'
      case 'es-ES':
        return 'Espanol'
      case 'de-DE':
        return 'Deutsch'
      default:
        break;
    }
  }

  const isOutletPageOpen = false

  return (
    <div className="h-full w-full relative overflow-y-auto bg-gray-700 p-[4vmin]">
      <div className="h-full w-full rounded-[6rem] overflow-hidden isolate bg-gray-600 flex items-center justify-center">
        <div className="h-full w-full overflow-y-hidden flex items-center justify-center">
          <div className="h-full w-full flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0 origin-center -translate-y-12 scale-125">
            <div className="hidden lg:block h-full">
              <img src="/shared/left-header.png" className="w-full" alt="" />
            </div>
            <div className="h-full flex flex-col justify-between">
              <img src="/shared/bottom-header.png" className="w-full" alt="" />
              <div className="flex-1 flex items-center justify-center px-[4vmin]">
                <h1 className="font-semibold text-center text-gray-200" style={{fontSize: fluidType(24, 48, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 40, 300, 2400, 1.5).lineHeight }}>
                  { mainSection.title }
                </h1>
              </div>
              <img src="/shared/top-header.png" className="w-full" alt="" />
            </div>
            <div className="hidden lg:block h-full">
              <img src="/shared/right-header.png" className="w-full" alt="" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}