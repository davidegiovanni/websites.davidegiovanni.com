import { json, LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, NavLink, Outlet, useCatch, useLoaderData, useLocation, useParams } from "@remix-run/react";
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { Feed, FeedItem, WebPageModel, WebSectionModel } from "api/models";
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
  features: FeedItem[];
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

  const [featuresFeedRes, featuresFeedErr] = await safeGet<any>(request, `https://cdn.revas.app/contents/v0/directories/websites-features/feed.json?public_key=01exy3y9j9pdvyzhchkpj9vc5w`)
  if (featuresFeedErr !== null) {
    throw new Response(`API Feed: ${featuresFeedErr.message}, ${featuresFeedErr.code}`, {
      status: 404,
    });
  }

  const featuresFeed: Feed = featuresFeedRes

  const features: FeedItem[] = featuresFeed.items

  const loaderData: LoaderData = {
    i18n,
    page,
    mainSection,
    sections,
    primary,
    secondary,
    logo,
    host,
    features
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
  const features = loaderData.features

  function buildSrcset(url: any, format: string): any {
    const u = url.replace('cdn.revas.app', 'static.eu1.revas-cdn.com')
    const sizes = [600, 800, 1024, 1280, 1536];
    const densities = [1, 2, 3];
    const urls = densities.map(
      (density) => `url("${u}?format=${format}&size=${density === 1 ? '1024' : density === 2 ? '1280' : '1536'}w") ${density}x`
    );
    return urls.join(",");
  }

  function getLanguageName(lang: string) {
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

  const headerImages = {
    left: sections[0].image,
    top: sections[1].image,
    bottom: sections[2].image,
    right: sections[3].image
  }

  return (
    <div className="overflow-y-auto bg-gray-700 h-full w-full">
      <div className="h-screen w-full  p-[4vmin] relative">
        <div className="h-full w-full relative rounded-3xl lg:rounded-[6rem] overflow-hidden isolate bg-gray-600">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 origin-center lg:-translate-y-16 scale-110 absolute inset-0">
            <div className="hidden lg:block">
              <img src={headerImages.left} className="w-full" alt="" />
            </div>
            <div className="h-full flex flex-col justify-between">
              <img src={headerImages.top} className="w-full" alt="" />
              <div className="flex-1 flex items-center justify-center px-[4vmin]">
                <h1 className="font-semibold text-center text-gray-200" style={{ fontSize: fluidType(24, 48, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 40, 300, 2400, 1.5).lineHeight }}>
                  {mainSection.title}
                </h1>
              </div>
              <img src={headerImages.bottom} className="w-full" alt="" />
            </div>
            <div className="hidden lg:block h-full">
              <img src={headerImages.right} className="w-full" alt="" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-[4vmin] px-[4vmin] pb-[4vmin]">
        <div className="rounded-3xl lg:rounded-[3rem] col-span-12 lg:col-span-8 bg-gray-600 overflow-hidden isolate flex flex-col justify-between">
          <div className="aspect-[2/1] relative">
            <Attachment attachment={{
              id: "",
              mediaType: "image/",
              url: features[0].image,
              description: ""
            }}></Attachment>
          </div>
          <h2 className="font-medium text-center text-gray-200 w-11/12 mx-auto px-[4vmin] my-[2vmin]" style={{ fontSize: fluidType(24, 48, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 40, 300, 2400, 1.5).lineHeight }}>
            {features[0].title}
          </h2>
        </div>
        <div className="rounded-3xl lg:rounded-[3rem] col-span-12 lg:col-span-4  bg-gray-600 overflow-hidden isolate flex flex-col justify-between">
          <div className="aspect-[1/1] relative">
          <Attachment attachment={{
              id: "",
              mediaType: "image/",
              url: features[1].image,
              description: ""
            }}></Attachment>
          </div>
          <h2 className="font-medium text-center text-gray-200 w-11/12 mx-auto px-[4vmin] my-[2vmin]" style={{ fontSize: fluidType(24, 48, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 40, 300, 2400, 1.5).lineHeight }}>
            {features[1].title}
          </h2>
        </div>
        <div className="col-span-12 lg:col-span-4 h-full flex flex-col">
          <div className="flex-1 rounded-3xl lg:rounded-[3rem] bg-gray-600 overflow-hidden isolate mb-[4vmin] flex flex-col justify-between">
            <div className="aspect-[2/1]">
            <Attachment attachment={{
              id: "",
              mediaType: "image/",
              url: features[2].image,
              description: ""
            }}></Attachment>
            </div>
            <h2 className="font-medium text-center text-gray-200 w-11/12 mx-auto px-[4vmin] my-[2vmin]" style={{ fontSize: fluidType(24, 48, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 40, 300, 2400, 1.5).lineHeight }}>
              {features[2].title}
            </h2>
          </div>
          <div className="flex-shrink rounded-3xl lg:rounded-[3rem] bg-gray-600 overflow-hidden isolate  flex flex-col justify-between">
            <div className="aspect-[2/1]">
            <Attachment attachment={{
              id: "",
              mediaType: "image/",
              url: features[3].image,
              description: ""
            }}></Attachment>
            </div>
            <h2 className="font-medium text-center text-gray-200 w-11/12 mx-auto px-[4vmin] my-[2vmin]" style={{ fontSize: fluidType(24, 48, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 40, 300, 2400, 1.5).lineHeight }}>
              {features[3].title}
            </h2>
          </div>
        </div>
        <div className="rounded-3xl lg:rounded-[3rem] col-span-12 lg:col-span-8 bg-gray-600 overflow-hidden isolate flex items-end relative">
          <div className="aspect-[2/1] absolute inset-0 h-full w-full">
          <Attachment attachment={{
              id: "",
              mediaType: "image/",
              url: features[4].image,
              description: ""
            }}></Attachment>
          </div>
          <h2 className="font-medium text-center text-gray-200 w-11/12 mx-auto px-[4vmin] my-[2vmin] relative z-10" style={{ fontSize: fluidType(24, 48, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 40, 300, 2400, 1.5).lineHeight }}>
            {features[4].title}
          </h2>
        </div>
        <div className="rounded-3xl lg:rounded-[3rem] col-span-12  bg-[#212121] overflow-hidden isolate flex flex-col justify-between">
          <div className="aspect-[4/1]">
          <Attachment attachment={{
              id: "",
              mediaType: "image/",
              url: features[5].image,
              description: ""
            }}></Attachment>
          </div>
          <h2 className="font-medium text-center text-gray-200 w-11/12 mx-auto px-[4vmin] my-[2vmin]" style={{ fontSize: fluidType(24, 48, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 40, 300, 2400, 1.5).lineHeight }}>
            {features[5].title}
          </h2>
        </div>
        <div className="rounded-3xl lg:rounded-[3rem] col-span-12 lg:col-span-4 bg-gray-600 overflow-hidden isolate flex flex-col justify-between">
          <div className="aspect-[2/1]">
          <Attachment attachment={{
              id: "",
              mediaType: "image/",
              url: features[6].image,
              description: ""
            }}></Attachment>
          </div>
          <h2 className="font-medium text-center text-gray-200 w-11/12 mx-auto px-[4vmin] my-[2vmin]" style={{ fontSize: fluidType(24, 48, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 40, 300, 2400, 1.5).lineHeight }}>
            {features[6].title}
          </h2>
        </div>
        <div className="rounded-3xl lg:rounded-[3rem] col-span-12 lg:col-span-4  bg-gray-600 overflow-hidden isolate flex flex-col justify-between">
          <div className="aspect-[2/1]">
          <Attachment attachment={{
              id: "",
              mediaType: "image/",
              url: features[7].image,
              description: ""
            }}></Attachment>
          </div>
          <h2 className="font-medium text-center text-gray-200 w-11/12 mx-auto px-[4vmin] my-[2vmin]" style={{ fontSize: fluidType(24, 48, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 40, 300, 2400, 1.5).lineHeight }}>
            {features[7].title}
          </h2>
        </div>
        <div className="rounded-3xl lg:rounded-[3rem] col-span-12 lg:col-span-4 bg-gray-600 overflow-hidden isolate flex flex-col justify-between">
          <div className="aspect-[2/1] ">
          <Attachment attachment={{
              id: "",
              mediaType: "image/",
              url: features[8].image,
              description: ""
            }}></Attachment>
          </div>
          <h2 className="font-medium text-center text-gray-200 w-11/12 mx-auto px-[4vmin] my-[2vmin]" style={{ fontSize: fluidType(24, 48, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 40, 300, 2400, 1.5).lineHeight }}>
            {features[8].title}
          </h2>
        </div>
      </div>
    </div>
  );
}