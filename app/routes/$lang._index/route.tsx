import { json, LinksFunction, LoaderFunction, redirect, SerializeFrom } from "@remix-run/node";
import { Link, useLoaderData, V2_MetaFunction } from "@remix-run/react";
import metadata from '~/utils/metadata'
import { fromFeedItemToUIItem, fromPageSectionToUISection, safeGetFeed, safeGetPage, safeGetWebsite } from "~/api";
import { BlockItem, Feed, Page, UIItem, UISection, Website } from "~/models";
import { DynamicLinksFunction } from "~/utils/dynamic-links";
import { Attachment } from "~/components/Attachment";
import { useRef, useState } from "react";
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRightIcon, Cross2Icon, InfoCircledIcon, OpenInNewWindowIcon } from "@radix-ui/react-icons";
import { cssBundleHref } from "@remix-run/css-bundle";
import defaultCss from "./default.css";

let dynamicLinks: DynamicLinksFunction<SerializeFrom<typeof loader>> = ({
  id,
  data,
  params,
  location,
  parentsData,
}) => {
  return location.pathname.endsWith(`/${params.lang}`) ? [{ rel: "canonical", href: `https://websites.davidegiovanni.com/${params.lang}` }] : [];
};
export let handle = { dynamicLinks };

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
  {
    rel: "stylesheet",
    href: defaultCss,
  },
];

export const meta: V2_MetaFunction = ({ data, location }) => {
  let title = 'Website error'
  let description = 'The website didn\'t load correctly'
  let image = ''
  let url = 'https://websites.davidegiovanni.com' + location.pathname

  if (data !== undefined) {
    const { meta } = data as LoaderData;
    title = (meta.title !== '' ? meta.title : "Homepage") + ' | Davide G. Steccanella'
    description = meta.description !== '' ? meta.description : "Illustrazioni di Davide Giovanni Steccanella"
    image = meta.image !== '' ? meta.image : ''
    url = 'https://websites.davidegiovanni.com' + location.pathname
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

type LoaderData = {
  title: string;
  description: string;
  image: string;
  sections: UISection[];
  items: UIItem[];
  incomingLocale: string;
  meta: {
    title: string;
    description: string;
    image: string;
  };
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const incomingLocale = params.lang || ""

  let websiteObject: Website = {} as Website
  const websiteRes = await safeGetWebsite(request, params, incomingLocale);
  if (typeof websiteRes === "string") {
    if (websiteRes === "error") {
      throw new Response("Website not found", {
        status: 404,
      });
    }
    return redirect(websiteRes)
  }
  websiteObject = websiteRes.website

  let meta = {
    title: "",
    description: "",
    image: ""
  }

  let pageObject: Page = {} as Page
  const pageRes = await safeGetPage("homepage", params)
  if (typeof pageRes === "string") {
    throw new Response("Page not found", {
      status: 404,
    });
  }
  pageObject = pageRes

  let title = pageObject.title
  let description = pageObject.description
  let image = pageObject.imageUrl

  meta.title = pageObject.title
  meta.description = pageObject.description
  meta.image = pageObject.imageUrl

  let startingSections: BlockItem[] = []
  pageObject.blocks.forEach(block => startingSections.push(...block.items))
  const sections: UISection[] = startingSections.map(section => {
    return fromPageSectionToUISection(section)
  })

  let feedObject: Feed = {} as Feed
  const feedRes = await safeGetFeed(`websites-portfolio-${incomingLocale.split("-")[0]}`, params)
  if (typeof feedRes === "string") {
    throw new Response("Page not found", {
      status: 404,
    });
  }
  feedObject = feedRes

  let items = feedObject.items.map(item => {
    return fromFeedItemToUIItem(item, incomingLocale)
  })

  const loaderData: LoaderData = {
    title, 
    description,
    image,
    meta,
    sections,
    items,
    incomingLocale
  }

  return json(loaderData)
};

export default function Index() {
  const loaderData = useLoaderData<LoaderData>();

  const divRefs = loaderData.items.map(() => useRef(null));
  const layerRefs = loaderData.items.map(() => useRef(null));
  const constrain = 18;

  function transforms(x: number, y: number, el: HTMLElement | null): string {
    if (!el) return '';

    const box = el.getBoundingClientRect();
    const calcX = -(y - box.y - box.height / 2) / constrain;
    const calcY = (x - box.x - box.width / 2) / constrain;

    return `perspective(800px) rotateX(${calcX}deg) rotateY(${calcY}deg)`;
  }

  function resetTransforms (el: HTMLElement | null) {
    if (!el) return;

    el.style.transform = `perspective(800px) rotateX(0deg) rotateY(0deg)`;
  }

  function transformElement(el: HTMLElement | null, xyEl: [number, number, HTMLElement | null]): void {
    if (!el) return;

    el.style.transform = transforms(xyEl[0], xyEl[1], xyEl[2]);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>, layerRef: React.MutableRefObject<null>): void {
    const xy: [number, number, HTMLElement | null] = [e.clientX, e.clientY, layerRef.current];
    window.requestAnimationFrame(() => {
      transformElement(layerRef.current, xy);
    });
  }

  const [websiteOpen, setOpenWebsite] = useState<number>(-1)

  const [loading, setLoading] = useState(true);

  const handleLoad = () => {
    setLoading(false);
    console.log('IFrame loaded successfully');
  };

  const handleError = () => {
    setLoading(false);
    console.log('IFrame failed to load');
  };

  return (
    <div className="page-layout override">
      <div className="page-header override">
        <h1>
          {loaderData.sections[0].title}
        </h1>
      </div>
      <div className="websites-grid override">
        {loaderData.items.map((item, index) => (
          <div key={index} ref={layerRefs[index]} className="website-grid--item override">
            <h1 className="website-item--slug override">
            {formattedUrl(item.slug)}
            </h1>
            <a href={formattedUrl(item.slug)} target="_blank" rel="noreferre,noopener" aria-label="Open website" className="website-item--link override">
              <OpenInNewWindowIcon className="flex-none" />
            </a>
            <Dialog.Root defaultOpen={websiteOpen !== -1}>
              <Dialog.Trigger asChild>
              <button onClick={() => setOpenWebsite(index)} aria-label="Open details" className="website-dialog--trigger override">
                <InfoCircledIcon />
              </button>
              </Dialog.Trigger>
              {
                websiteOpen !== -1 && (
                <Dialog.Portal className="website-dialog--portal">
                  <Dialog.Overlay className="website-dialog--bg override" />
                  <Dialog.Content className="website-dialog--card override">
                    <div className="column-layout__medium override">
                      <div className="dialog-card--info-section override">
                        <h2 className="dialog-card--info-section override">
                          {loaderData.items[websiteOpen].description}
                        </h2>
                        <div className="dialog-info-section--info-table override">
                          <a href={formattedUrl(loaderData.items[websiteOpen].slug)} target="_blank" rel="noopener,noreferrer" className="dialog-info-table--link override">
                            <OpenInNewWindowIcon className="flex-none" />
                            {formattedUrl(loaderData.items[websiteOpen].slug)}
                          </a>
                          <p className="dialog-info-table--date override">{loaderData.items[websiteOpen].date_published}</p>
                          <Link to={`/${loaderData.incomingLocale}/websites/${loaderData.items[websiteOpen].slug}`} className="dialog-info-table--details group override">
                            Dettagli
                            <ArrowRightIcon className="group-hover:translate-x-1 transition-al ease-in-out duration-500" />
                          </Link>
                        </div>
                      </div>
                      <div className="dialog-info-section--loader override">
                        {loading &&(
                          <p>Loading frame...</p>
                        )}
                      </div>
                      <div data-hidden={loading} className="data-[hidden=true]:grid-bg dialog-card--iframe-section override">
                        <iframe 
                          data-hidden={loading}
                          onLoad={handleLoad}
                          onError={handleError}
                          className="data-[hidden=true]:grid-bg override"
                          src={formattedUrl(loaderData.items[websiteOpen].slug)}></iframe>
                      </div>
                    </div>
                    <Dialog.Close asChild>
                      <button
                        className="dialog-card--close-button override"
                        aria-label="Close"
                        onClick={() => {setOpenWebsite(-1), setLoading(true)}}
                      >
                        <Cross2Icon />
                      </button>
                    </Dialog.Close>
                  </Dialog.Content>
                </Dialog.Portal>
                )
              }
            </Dialog.Root>
            <Link to={`/${loaderData.incomingLocale}/websites/${item.slug}`} id="website-image" onMouseLeave={() => resetTransforms(divRefs[index].current)} onMouseMove={(e: any) => handleMouseMove(e, divRefs[index])} ref={divRefs[index]} className="website-item--image override">
              <Attachment size="object-cover" attachment={item.image}></Attachment>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

const formattedUrl = (input: string): string => {
  if (input === "other-websites") {
    return input
  }
  return `https://${input.split("-").join(".")}`
}
