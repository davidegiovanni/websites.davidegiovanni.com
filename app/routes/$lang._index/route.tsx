import { json, LoaderFunction, redirect, SerializeFrom } from "@remix-run/node";
import { useLoaderData, V2_MetaFunction } from "@remix-run/react";
import metadata from '~/utils/metadata'
import { fromFeedItemToUIItem, fromPageSectionToUISection, safeGetFeed, safeGetPage, safeGetWebsite } from "~/api";
import { BlockItem, Feed, Page, UIItem, UISection, Website } from "~/models";
import { DynamicLinksFunction } from "~/utils/dynamic-links";
import { Attachment } from "~/components/Attachment";
import { useRef, useState } from "react";
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRightIcon, Cross2Icon, OpenInNewWindowIcon } from "@radix-ui/react-icons";

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
    items
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
    <div className="h-full w-full overflow-y-auto">
      <div className="aspect-square lg:aspect-[3/1] w-full flex items-center justify-center p-2 override">
        <h1>
          {loaderData.sections[0].title}
        </h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-t">
        {loaderData.items.map((item, index) => (
          <div key={index} ref={layerRefs[index]} className="aspect-square w-full p-2 border-r border-b relative flex">
            <h1 className="absolute inset-x-0 bottom-0 pt-1 pb-2 text-center">
            {formattedUrl(item.slug)}
            </h1>
            <a href={formattedUrl(item.slug)} target="_blank" rel="noreferre,noopener" aria-label="Open website" className="absolute bottom-0 left-0 p-2">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 13C12.5523 13 13 12.5523 13 12V3C13 2.44771 12.5523 2 12 2H3C2.44771 2 2 2.44771 2 3V6.5C2 6.77614 2.22386 7 2.5 7C2.77614 7 3 6.77614 3 6.5V3H12V12H8.5C8.22386 12 8 12.2239 8 12.5C8 12.7761 8.22386 13 8.5 13H12ZM9 6.5C9 6.5001 9 6.50021 9 6.50031V6.50035V9.5C9 9.77614 8.77614 10 8.5 10C8.22386 10 8 9.77614 8 9.5V7.70711L2.85355 12.8536C2.65829 13.0488 2.34171 13.0488 2.14645 12.8536C1.95118 12.6583 1.95118 12.3417 2.14645 12.1464L7.29289 7H5.5C5.22386 7 5 6.77614 5 6.5C5 6.22386 5.22386 6 5.5 6H8.5C8.56779 6 8.63244 6.01349 8.69139 6.03794C8.74949 6.06198 8.80398 6.09744 8.85143 6.14433C8.94251 6.23434 8.9992 6.35909 8.99999 6.49708L8.99999 6.49738" fill="currentColor"></path></svg>
            </a>
            <Dialog.Root defaultOpen={websiteOpen !== -1}>
              <Dialog.Trigger asChild>
              <button onClick={() => setOpenWebsite(index)} aria-label="Open details" className="absolute bottom-0 right-0 p-2">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.49991 0.876892C3.84222 0.876892 0.877075 3.84204 0.877075 7.49972C0.877075 11.1574 3.84222 14.1226 7.49991 14.1226C11.1576 14.1226 14.1227 11.1574 14.1227 7.49972C14.1227 3.84204 11.1576 0.876892 7.49991 0.876892ZM1.82707 7.49972C1.82707 4.36671 4.36689 1.82689 7.49991 1.82689C10.6329 1.82689 13.1727 4.36671 13.1727 7.49972C13.1727 10.6327 10.6329 13.1726 7.49991 13.1726C4.36689 13.1726 1.82707 10.6327 1.82707 7.49972ZM8.24992 4.49999C8.24992 4.9142 7.91413 5.24999 7.49992 5.24999C7.08571 5.24999 6.74992 4.9142 6.74992 4.49999C6.74992 4.08577 7.08571 3.74999 7.49992 3.74999C7.91413 3.74999 8.24992 4.08577 8.24992 4.49999ZM6.00003 5.99999H6.50003H7.50003C7.77618 5.99999 8.00003 6.22384 8.00003 6.49999V9.99999H8.50003H9.00003V11H8.50003H7.50003H6.50003H6.00003V9.99999H6.50003H7.00003V6.99999H6.50003H6.00003V5.99999Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
              </button>
              </Dialog.Trigger>
              {
                websiteOpen !== -1 && (
                <Dialog.Portal className="fixed inset-0 p-4">
                  <Dialog.Overlay className="data-[state=open]:animate-overlayShow fixed inset-0 bg-black" />
                  <Dialog.Content className="data-[state=open]:animate-contentShow bg-white rounded-3xl w-full h-full max-w-[95vw] lg:max-w-screen-xl mx-auto my-auto max-h-[95vh] lg:max-h-[80vh] overflow-y-auto px-4 py-16 fixed inset-0 m-auto">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-4 max-w-screen-sm mx-auto">
                        <h2 className="text-justify">
                          {loaderData.items[websiteOpen].description}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <a href={formattedUrl(loaderData.items[websiteOpen].slug)} target="_blank" rel="noopener,noreferrer" className="flex items-center gap-1 w-full text-sm hover:opacity-80">
                            <OpenInNewWindowIcon className="flex-none" />
                            {formattedUrl(loaderData.items[websiteOpen].slug)}
                          </a>
                          <p className="flex items-center lg:justify-center gap-1 md:text-center w-full text-sm">{loaderData.items[websiteOpen].date_published}</p>
                          <p className="flex items-center lg:justify-end gap-1 md:text-right w-full text-sm">
                            Dettagli
                            <ArrowRightIcon />
                          </p>
                        </div>
                      </div>
                      <div className="w-full max-w-screen-sm mx-auto h-8">
                        {loading &&(
                          <p className="italic text-sm animate-pulse">Loading frame...</p>
                        )}
                      </div>
                      <div data-hidden={loading} className="aspect-[9/16] border w-11/12 lg:aspect-video mx-auto lg:w-11/12 bg-white origin-top-left overflow-hidden shadow-2xl rounded-2xl">
                        <iframe 
                          data-hidden={loading}
                          onLoad={handleLoad}
                          onError={handleError}
                          className="w-full h-full data-[hidden=true]:sr-only"
                          src={formattedUrl(loaderData.items[websiteOpen].slug)}></iframe>
                      </div>
                    </div>
                    <Dialog.Close asChild>
                      <button
                        className="text-black absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
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
            <div id="webiste-image" onMouseLeave={() => resetTransforms(divRefs[index].current)} onMouseMove={(e: any) => handleMouseMove(e, divRefs[index])} ref={divRefs[index]} className="relative aspect-auto rounded-md shadow-xl overflow-hidden w-2/3 m-auto">
              <Attachment size="object-cover" attachment={item.image}></Attachment>
            </div>
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
