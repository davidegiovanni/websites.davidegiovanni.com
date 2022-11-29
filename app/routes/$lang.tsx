import { json, LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, NavLink, Outlet, useCatch, useLoaderData, useLocation, useParams, useTransition } from "@remix-run/react";
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { Feed, FeedItem, WebLinkModel, WebPageModel, WebSectionModel } from "api/models";
import metadata from '~/utils/metadata'
import link from '~/utils/links'
import { fluidType } from '~/utils/helpers'
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
  comparisons: FeedItem[];
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

  const [featuresFeedRes, featuresFeedErr] = await safeGet<any>(request, `https://cdn.revas.app/contents/v0/directories/websites-features-${params.lang?.toLowerCase().split('-')[0]}/feed.json?public_key=01exy3y9j9pdvyzhchkpj9vc5w`)
  if (featuresFeedErr !== null) {
    throw new Response(`API Feed: ${featuresFeedErr.message}, ${featuresFeedErr.code}`, {
      status: 404,
    });
  }

  const featuresFeed: Feed = featuresFeedRes

  const features: FeedItem[] = featuresFeed.items

  const [comparisonsFeedRes, comparisonsFeedErr] = await safeGet<any>(request, `https://cdn.revas.app/contents/v0/directories/websites-comparisons-${params.lang?.toLowerCase().split('-')[0]}/feed.json?public_key=01exy3y9j9pdvyzhchkpj9vc5w`)
  if (comparisonsFeedErr !== null) {
    throw new Response(`API Feed: ${comparisonsFeedErr.message}, ${comparisonsFeedErr.code}`, {
      status: 404,
    });
  }

  const comparisonsFeed: Feed = comparisonsFeedRes

  const comparisons: FeedItem[] = comparisonsFeed.items

  const loaderData: LoaderData = {
    i18n,
    page,
    mainSection,
    sections,
    primary,
    secondary,
    logo,
    host,
    features,
    comparisons
  }

  return json(loaderData)
};

export default function Index() {
  const loaderData = useLoaderData<LoaderData>();
  const params = useParams()
  const location = useLocation()
  const transition = useTransition()

  const mainSection = loaderData.mainSection
  const sections = loaderData.sections
  const logo = loaderData.logo
  const features = loaderData.features
  const comparisons = loaderData.comparisons

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

  function getSlug(url: string) {
    const parsed = queryString.parse(url)
    return parsed.content
  }

  const isOutletPageOpen = location.pathname.includes('features')

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
    let link = {
      title: sections[number].primaryLink.title,
      url: '',
      type: ''
    }
    const rawLink = sections[number].primaryLink
    link.url = rawLink.url.includes('websites.davidegiovanni.com') ? getPageSlug(rawLink.url) : rawLink.url
    link.type = rawLink.url.includes('websites.davidegiovanni.com') ? 'inner' : 'external'
    return link
  }

  const [currentTime, setCurrentTime] = useState<string>('-------')

  const getTimeDate = () => {
    var date = new Date();
    var current_date = date.getFullYear()+"-"+(date.getMonth()+1)+"-"+ date.getDate();
    var current_time = `${date.getHours() < 10 ? '0': ''}${date.getHours()}`+":"+`${date.getMinutes() < 10 ? '0': ''}${date.getMinutes()}`+":"+ `${date.getSeconds()}${date.getSeconds() < 10 ? '0': ''}`;
    var date_time = current_date+" - "+current_time;
    setCurrentTime(date_time)
  }

  useEffect(
    () => {
      setInterval(getTimeDate, 1000)
    }, []
  )

  const isLoadingDetails = transition.location?.pathname.includes('features')
  const isLoadingWorks = transition.location?.pathname.includes('works')

  return (
    <div className={"overflow-y-auto bg-zinc-400 h-full w-full uppercase"}>
      {
        isOutletPageOpen && (
          <div className="fixed overflow-hidden inset-0 z-50">
            <Outlet />
          </div>
        )
      }
      <div className={(isLoadingDetails ? "opacity-100 " : "opacity-0 pointer-events-none select-none ") + "fixed overflow-hidden inset-0 z-40 bg-black bg-opacity-40 flex items-stretch justify-end p-[2vmin]"}>
        <div className={(isLoadingDetails ? "opacity-100 translate-x-none " : "opacity-0 translate-x-full ") + "h-full w-full md:w-2/3 lg:w-1/2 max-w-2xl bg-white rounded-3xl blur-sm delay-100 transition-all duration-200"}></div>
      </div>
      <div className={(isLoadingWorks ? "opacity-100 " : "opacity-0 pointer-events-none select-none ") + "fixed overflow-hidden inset-0 z-40 bg-zinc-400 transition-all duration-100 delay-100 ease-in-out"}>
        <div className="w-full aspect-[4/1] border-b border-black" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-b border-black">
          { [0,1,2].map(n => (<div className="aspect-square w-full border-r border-black last:border-none"></div>))}
        </div>
      </div>
      <div className="hidden grid-cols-12 gap-[2vmin] fixed inset-0 z-50 select-none pointer-events-none">
        { [0,1,2,3,4,5,6,7,8,9,10,11].map(n => (
          <div className="h-full bg-white opacity-25"></div>
        ))}
      </div>
      <div className="h-[50vh] lg:h-screen w-full relative flex flex-col border-b border-black">
        <div className="flex-1 h-8 w-full p-[2vmin]">
          <div className="h-full w-full relative rounded-3xl overflow-hidden isolate">
            <div className="absolute inset-0 h-full w-full z-20">
              <img src={mainSection.image} className="h-full w-full object-cover" alt="" />
            </div>
            <div className="absolute inset-0 h-full w-full">
              <Attachment attachment={{
                id: "",
                mediaType: "image/",
                url: mainSection.image,
                description: ""
              }}></Attachment>
            </div>
          </div>
        </div>
        <div className="p-[2vmin] border-t border-black">
          <h1 className=" uppercase max-w-lg" style={{ fontSize: fluidType(24, 48, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 40, 300, 2400, 1.5).lineHeight }}>
            {mainSection.title}
          </h1>
        </div>
      </div>
      <div className="grid grid-cols-12">
        <div className="relative col-span-6 md:col-span-8 row-span-1 border-r border-b border-black overflow-hidden isolate flex flex-col justify-between">
          <div className="aspect-square -translate-y-4 md:translate-y-0 md:aspect-[10/4] relative">
            <Attachment attachment={{
              id: "",
              mediaType: "image/",
              url: features[0].image,
              description: ""
            }}></Attachment>
          </div>
          <h2 className="absolute bottom-0 inset-x-0  text-center text-black w-11/12 mx-auto px-[4vmin] my-[2vmin]" style={{ fontSize: fluidType(16, 32, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 24, 300, 2400, 1.5).lineHeight }}>
            {features[0].title}
          </h2>
          <Link to={`/${params.lang}/features/${getSlug(features[0].id)}`} style={{ fontSize: fluidType(16, 32, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 24, 300, 2400, 1.5).lineHeight }} className="absolute top-0 lg:top-auto lg:bottom-0 right-0 mx-[2vmin] mt-[2vmin] lg:mt-0 lg:mb-[2.3vmin] z-30">
            <span className="sr-only">
              Info
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 md:w-8 h-6 md:h-8">
              <path strokeLinecap="square" strokeLinejoin="bevel" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>

          </Link>
        </div>
        <div className="relative aspect-square col-span-6 md:col-span-4 row-span-1  border-b border-black overflow-hidden isolate flex flex-col justify-between p-[2vmin]">
          <div className="aspect-[5/4] relative flex-1 rounded-3xl overflow-hidden isolate">
            <Attachment attachment={{
              id: "",
              mediaType: "image/",
              url: features[1].image,
              description: ""
            }}></Attachment>
          </div>
          <h2 className=" text-center text-black w-11/12 mx-auto mt-[2vmin]" style={{ fontSize: fluidType(16, 32, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 24, 300, 2400, 1.5).lineHeight }}>
            {features[1].title}
          </h2>
          <Link to={`/${params.lang}/features/${getSlug(features[1].id)}`} style={{ fontSize: fluidType(16, 32, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 24, 300, 2400, 1.5).lineHeight }} className="absolute top-0 lg:top-auto lg:bottom-0 right-0 mx-[2vmin] mt-[2vmin] lg:mt-0 lg:mb-[2.3vmin] z-30">
            <span className="sr-only">
              Info
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 md:w-8 h-6 md:h-8">
              <path strokeLinecap="square" strokeLinejoin="bevel" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>

          </Link>
        </div>
      </div>
      <div className="grid grid-cols-12 grid-rows-2">
        <div className="relative col-span-12 md:col-span-4 row-span-2 border-b lg:border-r border-black overflow-hidden isolate flex flex-col justify-between">
          <div className="aspect-[5/9]">
            <Attachment attachment={{
              id: "",
              mediaType: "image/",
              url: features[2].image,
              description: ""
            }}></Attachment>
          </div>
          <h2 className="lg:absolute bottom-0 inset-x-0  text-center text-black w-11/12 mx-auto px-[4vmin] my-[2vmin]" style={{ fontSize: fluidType(16, 32, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 24, 300, 2400, 1.5).lineHeight }}>
            {features[2].title}
          </h2>
          <Link to={`/${params.lang}/features/${getSlug(features[2].id)}`} style={{ fontSize: fluidType(16, 32, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 24, 300, 2400, 1.5).lineHeight }} className="absolute top-0 lg:top-auto lg:bottom-0 right-0 mx-[2vmin] mt-[2vmin] lg:mt-0 lg:mb-[2.3vmin] z-30">
            <span className="sr-only">
              Info
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 md:w-8 h-6 md:h-8">
              <path strokeLinecap="square" strokeLinejoin="bevel" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>

          </Link>
        </div>
        <div className="relative aspect-square col-span-6 md:col-span-4 row-span-1 border-b border-r border-black overflow-hidden isolate  flex flex-col justify-between">
          <div className="aspect-[5/4]">
            <Attachment attachment={{
              id: "",
              mediaType: "image/",
              url: features[3].image,
              description: ""
            }}></Attachment>
          </div>
          <h2 className="absolute bottom-0 inset-x-0  text-center text-black w-11/12 mx-auto px-[4vmin] my-[2vmin]" style={{ fontSize: fluidType(16, 32, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 24, 300, 2400, 1.5).lineHeight }}>
            {features[3].title}
          </h2>
          <Link to={`/${params.lang}/features/${getSlug(features[3].id)}`} style={{ fontSize: fluidType(16, 32, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 24, 300, 2400, 1.5).lineHeight }} className="absolute top-0 lg:top-auto lg:bottom-0 right-0 mx-[2vmin] mt-[2vmin] lg:mt-0 lg:mb-[2.3vmin] z-30">
            <span className="sr-only">
              Info
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 md:w-8 h-6 md:h-8">
              <path strokeLinecap="square" strokeLinejoin="bevel" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>

          </Link>
        </div>
        <div className="relative aspect-square col-span-6 md:col-span-4 row-span-1 border-b border-r border-black overflow-hidden isolate flex items-end">
          <div className="absolute inset-0 h-full w-full">
            <Attachment attachment={{
              id: "",
              mediaType: "image/",
              url: features[4].image,
              description: ""
            }}></Attachment>
          </div>
        </div>
        <div className="relative aspect-square col-span-6 md:col-span-4 row-span-1  border-b border-r border-black overflow-hidden isolate flex flex-col justify-between">
          <div className="absolute inset-0 h-full w-full">
            <Attachment attachment={{
              id: "",
              mediaType: "image/",
              url: features[5].image,
              description: ""
            }}></Attachment>
          </div>
        </div>
        <div className="relative aspect-square col-span-6 md:col-span-4 row-span-1 border-b border-black overflow-hidden isolate flex flex-col justify-between">
          <div className="aspect-[5/4]">
            <Attachment attachment={{
              id: "",
              mediaType: "image/",
              url: features[6].image,
              description: ""
            }}></Attachment>
          </div>
          <h2 className="absolute bottom-0 inset-x-0  text-center text-black w-11/12 mx-auto px-[4vmin] my-[2vmin]" style={{ fontSize: fluidType(16, 32, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 24, 300, 2400, 1.5).lineHeight }}>
            {features[6].title}
          </h2>
          <Link to={`/${params.lang}/features/${getSlug(features[6].id)}`} style={{ fontSize: fluidType(16, 32, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 24, 300, 2400, 1.5).lineHeight }} className="absolute top-0 lg:top-auto lg:bottom-0 right-0 mx-[2vmin] mt-[2vmin] lg:mt-0 lg:mb-[2.3vmin] z-30">
            <span className="sr-only">
              Info
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 md:w-8 h-6 md:h-8">
              <path strokeLinecap="square" strokeLinejoin="bevel" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>

          </Link>
        </div>
      </div>
      <div className="grid grid-cols-12">
        <div className="relative border-b border-r border-black aspect-square col-span-6 md:col-span-4 row-span-1  overflow-hidden isolate flex flex-col justify-between">
          <div className="aspect-[5/4]">
            <Attachment attachment={{
              id: "",
              mediaType: "image/",
              url: features[7].image,
              description: ""
            }}></Attachment>
          </div>
          <h2 className="absolute z-30 bottom-0 inset-x-0  text-center text-black w-11/12 mx-auto px-[4vmin] my-[2vmin]" style={{ fontSize: fluidType(16, 32, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 24, 300, 2400, 1.5).lineHeight }}>
            {features[7].title}
          </h2>
          <Link to={`/${params.lang}/features/${getSlug(features[7].id)}`} style={{ fontSize: fluidType(16, 32, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 24, 300, 2400, 1.5).lineHeight }} className="absolute top-0 lg:top-auto lg:bottom-0 right-0 mx-[2vmin] mt-[2vmin] lg:mt-0 lg:mb-[2.3vmin] z-30">
            <span className="sr-only">
              Info
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 md:w-8 h-6 md:h-8">
              <path strokeLinecap="square" strokeLinejoin="bevel" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>

          </Link>
        </div>
        <div className="relative border-b border-r border-black h-full col-span-6 md:col-span-8 row-span-1 bg-[#212121] overflow-hidden isolate flex flex-col justify-between">
          <div className="aspect-square -translate-y-4 translate-x-1 scale-110 md:scale-100 md:translate-x-0 md:translate-y-0 md:aspect-[10/4]">
            <Attachment attachment={{
              id: "",
              mediaType: "image/",
              url: features[8].image,
              description: ""
            }}></Attachment>
          </div>
          <h2 className="absolute bottom-0 inset-x-0  text-center text-white w-11/12 mx-auto px-[4vmin] my-[2vmin]" style={{ fontSize: fluidType(16, 32, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 24, 300, 2400, 1.5).lineHeight }}>
            {features[8].title}
          </h2>
          <Link to={`/${params.lang}/features/${getSlug(features[8].id)}`} style={{ fontSize: fluidType(16, 32, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 24, 300, 2400, 1.5).lineHeight }} className="absolute top-0 lg:top-auto lg:bottom-0 right-0 mx-[2vmin] mt-[2vmin] lg:mt-0 lg:mb-[2.3vmin] z-30 text-white">
            <span className="sr-only">
              Info
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 md:w-8 h-6 md:h-8">
              <path strokeLinecap="square" strokeLinejoin="bevel" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>

          </Link>
        </div>
        <div className="relative border-b border-r border-black col-span-12 row-span-1 overflow-hidden isolate flex flex-col justify-between ">
          <div className="aspect-square lg:aspect-[2/1]">
            <Attachment attachment={{
              id: "",
              mediaType: "image/",
              url: features[9].image,
              description: ""
            }}></Attachment>
          </div>
          <h2 className="absolute z-30 bottom-0 inset-x-0  text-center text-white w-11/12 mx-auto px-[4vmin] my-[2vmin]" style={{ fontSize: fluidType(16, 32, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 24, 300, 2400, 1.5).lineHeight }}>
            {features[9].title}
          </h2>
          <Link to={`/${params.lang}/features/${getSlug(features[9].id)}`} style={{ fontSize: fluidType(16, 32, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 24, 300, 2400, 1.5).lineHeight }} className="absolute top-0 lg:top-auto lg:bottom-0 right-0 mx-[2vmin] mt-[2vmin] lg:mt-0 lg:mb-[2.3vmin] z-30 text-white">
            <span className="sr-only">
              Info
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 md:w-8 h-6 md:h-8">
              <path strokeLinecap="square" strokeLinejoin="bevel" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>

          </Link>
        </div>
        <div className="relative border-b border-r border-black h-full aspect-square lg:aspect-auto col-span-6 md:col-span-8 row-span-1 overflow-hidden isolate flex flex-col justify-between">
          <div className="absolute inset-0 w-full h-full object-cover ">
            <Attachment attachment={{
              id: "",
              mediaType: "image/",
              url: features[10].image,
              description: ""
            }}></Attachment>
          </div>
        </div>
        <div className="relative border-b border-r border-black aspect-square col-span-6 md:col-span-4 row-span-1 overflow-hidden isolate flex flex-col justify-between">
          <div className="aspect-[5/4] ">
            <Attachment attachment={{
              id: "",
              mediaType: "image/",
              url: features[11].image,
              description: ""
            }}></Attachment>
          </div>
          <h2 className="absolute bottom-0 inset-x-0  text-center text-black w-11/12 mx-auto px-[4vmin] my-[2vmin]" style={{ fontSize: fluidType(16, 32, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 24, 300, 2400, 1.5).lineHeight }}>
            {features[11].title}
          </h2>
          <Link to={`/${params.lang}/features/${getSlug(features[11].id)}`} style={{ fontSize: fluidType(16, 32, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 24, 300, 2400, 1.5).lineHeight }} className="absolute top-0 lg:top-auto lg:bottom-0 right-0 mx-[2vmin] mt-[2vmin] lg:mt-0 lg:mb-[2.3vmin] z-30">
            <span className="sr-only">
              Info
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 md:w-8 h-6 md:h-8">
              <path strokeLinecap="square" strokeLinejoin="bevel" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>

          </Link>
        </div>
      </div>
      <div className="border-b border-black">
        <div className="sticky top-0 w-full aspect-[2/1] p-[2vmin]">
          <p className="uppercase max-w-2xl" style={{ fontSize: fluidType(24, 48, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 40, 300, 2400, 1.5).lineHeight }}>
          {title(0)}
          </p>
        </div>
        <div>
          <div>
            {
              comparisons.map((c, index) => (
                <div style={{ zIndex: index * 10 }} className="sticky top-0 border-t border-black pb-[6vmin] mb-[2vmin] grid grid-cols-12 gap-[2vmin] bg-zinc-400 px-[2vmin]">
                  <div className="relative w-fit h-fit px-4 py-2 col-span-12 md:col-span-3">
                    <p className="relative z-20">
                      {c.title}
                    </p>
                    <div className="bg-[#4af626] blur-[8px] rounded-[50%] absolute inset-0 w-full h-full" />
                  </div>
                  <p className="w-full max-w-2xl col-span-12 md:col-span-6 md:col-start-7">
                    {c.summary}
                  </p>
                </div>
              ))
            }
          </div>
        </div>
      </div>
      <div className={(isLoadingWorks ? "opacity-0 blur-lg " : "opacity-100 blur-0 ") + " transition-all duration-100 ease-in-out"}>
          <div className="p-[2vmin] aspect-[2/1]">
          <p className="uppercase max-w-2xl" style={{ fontSize: fluidType(24, 48, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 40, 300, 2400, 1.5).lineHeight }}>
          {title(1)}
          </p>
          </div>
          <div className="sticky top-0 z-10 h-screen w-screen flex items-center justify-center p-[4vmin]">
            <div className="max-w-xs rotate-3">
            <Attachment attachment={{
              id: "",
              mediaType: "image/",
              url: image(2),
              description: ""
            }}></Attachment>
            </div>
          </div>
          <div className="sticky top-0 z-20 h-screen w-screen flex items-center justify-center p-[4vmin]">
            <div className="max-w-xs -rotate-6">
            <Attachment attachment={{
              id: "",
              mediaType: "image/",
              url: image(3),
              description: ""
            }}></Attachment>
            </div>
          </div>
          <div className="sticky top-0 z-30 h-screen w-screen flex items-center justify-center p-[4vmin]">
            <div className="max-w-xs">
            <Attachment attachment={{
              id: "",
              mediaType: "image/",
              url: image(4),
              description: ""
            }}></Attachment>
            </div>
          </div>
          <div className="sticky top-0 z-40 h-screen w-screen flex items-center justify-center p-[4vmin]">
            <div className="max-w-sm w-fit h-fit relative px-8 py-4">
              <Link to={`/${getPageSlug(link(1).url)}`} className="relative z-10">
                { link(1).title}
              </Link>
              <div className="bg-[#ccff00] blur-[6px] rounded-[50%] absolute inset-0 w-full h-full" />
            </div>
          </div>
      </div>
      <div>
        <div className="grid grid-cols-12 gap-[4vmin] mt-[32vmin]">
          <div className="col-span-10 lg:col-span-4 col-start-2 lg:col-start-7">
            {description(5)}
            <div className="max-w-sm w-fit h-fit relative px-8 py-4 mt-[8vmin] rounded-[50%]">
              {
                link(5).type === "inner" ? (
                  <Link to={`/${link(5).url}`} className="relative z-10">
                { link(5).title}
              </Link>
                ) : (
                  <a href={link(5).url} className="relative z-10">
                    { link(5).title}
                  </a>
                )
              }
              <div className="bg-pink-500 blur-[6px] rounded-[50%] absolute inset-0 w-full h-full border border-black" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-[4vmin] text-xs uppercase border-t border-black p-[2vmin] mt-[48vmin]">
        <div className="col-span-12 lg:col-span-4">
          {currentTime} | Copyright © <a href="https://davidegiovanni.com" target={'_blank'} rel="noopener">Davide Giovanni Steccanella</a>
        </div>
        <div className="col-span-12 lg:col-span-4 lg:col-end-13 lg:text-right">
          <p>
            This website is green, fast and privacy friendly
          </p>
          <p>
            Built by me with RevasOS and code
          </p>
        </div>
      </div>
    </div>
  );
}