import { json, LinksFunction, LoaderFunction, redirect, SerializeFrom } from "@remix-run/node";
import { Link, useLoaderData, V2_MetaFunction } from "@remix-run/react";
import metadata from '~/utils/metadata'
import { Children, ReactElement, useEffect, useRef, useState } from "react";
import { fromFeedItemToUIItem, safeGetFeed, safeGetWebsite } from "~/api";
import { Feed, Attachment as AttachmentModel, Website, FeedItem } from "~/models";
import { DynamicLinksFunction } from "~/utils/dynamic-links";
import parse from "html-react-parser";
import defaultCss from "./default.css";
import { cssBundleHref } from "@remix-run/css-bundle";
import { Attachment } from "~/components/Attachment";
import { CalendarIcon, ChevronLeftIcon, InfoCircledIcon, OpenInNewWindowIcon } from "@radix-ui/react-icons";
import * as Dialog from '@radix-ui/react-dialog';
import React from "react";

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
  {
    rel: "stylesheet",
    href: defaultCss,
  },
];

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
  image: AttachmentModel;
  slug: string;
  date_published: string;
  content: string;
  feedTitle: string;
  incomingLocale: string;
  meta: {
    title: string;
    description: string;
    image: string;
  }
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

  let feedObject: Feed = {} as Feed
  const feedRes = await safeGetFeed(`websites-portfolio-${incomingLocale.split("-")[0]}`, params)
  if (typeof feedRes === "string") {
    throw new Response("Page not found", {
      status: 404,
    });
  }
  feedObject = feedRes

  let feedTitle = feedObject.title
  let title = feedObject.title
  let description = feedObject.description
  let image: AttachmentModel = {
    mediaType: "",
    url: "",
    description: "",
    metadata: {}
  }
  let content = ""
  let date_published = ""
  let slug: string | undefined = ""

  meta.title = title
  meta.description = description

  slug = params.website
  let foundItem: FeedItem | undefined = feedObject.items.find((i: any) => {
    return i.id.endsWith(slug)
  })
  if (foundItem === undefined) {
    throw new Response(`Page do not exist`, {
      status: 404,
    });
  }

  meta.title = foundItem.title
  meta.description = foundItem.summary || description

  const formattedItem = fromFeedItemToUIItem(foundItem, incomingLocale)
  title = formattedItem.title
  description = formattedItem.description
  image = formattedItem.image
  date_published = formattedItem.date_published
  content = formattedItem.content
  slug = formattedItem.slug

  const loaderData: LoaderData = {
    title, 
    description,
    image,
    content,
    date_published,
    slug,
    meta,
    feedTitle,
    incomingLocale
  }

  return json(loaderData)
};

export default function Index() {
  const loaderData = useLoaderData<LoaderData>();
  const contentRef = useRef<HTMLDivElement>(null);

  const [simpleTags, setSimpleTags] = useState<string>("")
  const [complexTags, setComplexTags] = useState<string>("")
  const [points, setPoints] = useState<string[]>([])

  const layerRef:React.MutableRefObject<null> = useRef(null)
  const divRef:React.MutableRefObject<null> = useRef(null)
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

  function handleMouseMove(e: React.MouseEvent<HTMLElement>): void {
    const xy: [number, number, HTMLElement | null] = [e.clientX, e.clientY, layerRef.current];
    window.requestAnimationFrame(() => {
      transformElement(layerRef.current, xy);
    });
  }

  useEffect(() => {
    const [simpleP, complexP, pointsTags] = extractGroupsFromHTMLString(loaderData.content)
    setSimpleTags(simpleP)
    setComplexTags(complexP)
    setPoints(pointsTags)
  }, [])

  const [clickedImage, setClickedImage] = useState("")

  useEffect(() => {
    setTimeout(() => {
      if (contentRef.current) {
        applyClassesToTags(contentRef.current);

        const imgTags = contentRef.current.querySelectorAll('img');
        imgTags.forEach((imgTag) => {
          imgTag.addEventListener('click', () => setClickedImage(imgTag.getAttribute('src') || ''));
        });
      }
    }, 100)
  }, [])

  return (
    <div className="page-layout">
      <div>
        <div className="page-header sticky top-0 z-10">
          <h1>
            {loaderData.title}
          </h1>
        </div>
        <div ref={divRef} className="page-header sticky top-0 z-40">
          <a href={formattedUrl(loaderData.slug)} target="_blank" rel="noreferrer,noopener" ref={layerRef} onMouseMove={handleMouseMove} onMouseLeave={() =>resetTransforms(layerRef.current)} onMouseOut={() =>resetTransforms(layerRef.current)} className="w-full lg:w-1/3 shadow-xl block rounded-lg overflow-hidden">
            <Attachment attachment={loaderData.image}></Attachment>
          </a>
        </div>
        {
          loaderData.description !== "" && (
            <div className="page-header sticky top-0 z-10">
              <h2 className="text-center lg:w-1/3 px-2">
                {loaderData.description}
              </h2>
            </div>
          )
        }
        <div className="page-header sticky top-0 pointer-events-none"></div>
      </div>
      <div data-justify-between className="page-content--content">
        <div className="page-content--description-section column-layout__large">
          {
            simpleTags !== "" && (
              <div className="column-layout__large">
                {parse(simpleTags)}
              </div>
            )
          }
          {
            points.length > 0 && (
              <div className="description-section--list">
                {
                  points.map(point => (
                    <div className="description-section--list-item ">
                      {parse(point)}
                    </div>
                  ))
                }
              </div>
            )
          }
          <div className="column-layout__medium">
            <a href={formattedUrl(loaderData.slug)} target="_blank" rel="noopener,noreferrer" data-items-center className="row-layout__default">
              <OpenInNewWindowIcon className="flex-none" />
              {formattedUrl(loaderData.slug)}
            </a>
            <p data-items-center className="row-layout__default">
              <CalendarIcon className="flex-none" />
              {loaderData.date_published}
            </p>
          </div>
        </div>
        <div ref={contentRef} className="page-content--media-section">
          {parse(complexTags)}
        </div>
        <Link to={`/${loaderData.incomingLocale}`} aria-label="Go back" tabIndex={1} className="fixed top-0 left-0 bg-white bg-opacity-5 backdrop-blur-3xl z-40 m-4 hover:ring-1 hover:ring-offset-2 w-8 h-8 flex items-center justify-center rounded-full">
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <div data-visible={clickedImage !== ""} className="hidden data-[visible=true]:block bg-black bg-opacity-50 fixed inset-0 z-40 overflow-hidden p-8">
          <div onClick={() => setClickedImage("")} className="absolute inset-0 z-10" />
          <div className="w-full h-full rounded-lg shadow-xl overflow-hidden relative z-20 animate-contentShow">
            <img className="h-full w-full object-cover" src={clickedImage} alt="" />
          </div>
        </div>
        
      </div>
    </div>
  );
}

type ExtractedGroups = [string, string, string[]];

function extractGroupsFromHTMLString(htmlString: string): ExtractedGroups {
  const div = document.createElement('div');
  div.innerHTML = htmlString;

  const simpleTags: Element[] = [];
  const complexTags: Element[] = [];
  const pointsTags: string[] = [];

  const allTags = div.querySelectorAll('*');
  allTags.forEach((tag) => {
    const parentPTag = tag.closest('p');
    const isPTag = tag.tagName.toLowerCase() === 'p';
    const isBlockquote = tag.tagName.toLowerCase() === 'blockquote';
    const isPre = tag.tagName.toLowerCase() === 'pre';
    const isImg = tag.tagName.toLowerCase() === 'img';
    const isPoint = tag.tagName.toLowerCase() === 'li';
    const parentQuoteTag = tag.closest('blockquote');

    if (!isPTag && (isBlockquote || isPre || isImg || isPoint) && !parentPTag) {
      if (isPoint) {
        pointsTags.push(tag.innerHTML)
      } else {
        complexTags.push(tag);
      }
    } else if (isPTag) {
      const hasBlockquote = tag.querySelector('blockquote');
      const hasPre = tag.querySelector('pre');
      const hasImg = tag.querySelector('img');
      const parentListTag = tag.closest('li');
      const parentQuoteTag = tag.closest('blockquote');

      if (hasImg && tag.childNodes.length === 1) {
        complexTags.push(hasImg);
      } else if (!hasBlockquote && !hasPre && !hasImg && !parentListTag && !parentQuoteTag) {
        simpleTags.push(tag);
      } else {
        if (!parentListTag && !parentQuoteTag) {
          complexTags.push(tag);
        }
      }
    }
  });

  const simpleP = simpleTags.map(tag => `<div>${tag.outerHTML}</div>`).join('\n');
  const complexP = complexTags.map(tag => `<div className="w-full">${tag.outerHTML}</div>`).join('\n');

  return [simpleP, complexP, pointsTags];
}

function applyClassesToTags(div: HTMLDivElement): void {
  if (!div) return;
  
  const allTags = div.querySelectorAll('div');
  allTags.forEach((tag, index) => {
    const hasImg = tag.querySelector('img');

    if (hasImg) {
      const newDiv = document.createElement('p');

      // Create an SVG element
      const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgElement.setAttribute('width', '15');
      svgElement.setAttribute('height', '15');
      svgElement.setAttribute('viewBox', '0 0 15 15');

      // Create a path element within the SVG
      const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathElement.setAttribute('d', 'M7.5 11C4.80285 11 2.52952 9.62184 1.09622 7.50001C2.52952 5.37816 4.80285 4 7.5 4C10.1971 4 12.4705 5.37816 13.9038 7.50001C12.4705 9.62183 10.1971 11 7.5 11ZM7.5 3C4.30786 3 1.65639 4.70638 0.0760002 7.23501C-0.0253338 7.39715 -0.0253334 7.60288 0.0760014 7.76501C1.65639 10.2936 4.30786 12 7.5 12C10.6921 12 13.3436 10.2936 14.924 7.76501C15.0253 7.60288 15.0253 7.39715 14.924 7.23501C13.3436 4.70638 10.6921 3 7.5 3ZM7.5 9.5C8.60457 9.5 9.5 8.60457 9.5 7.5C9.5 6.39543 8.60457 5.5 7.5 5.5C6.39543 5.5 5.5 6.39543 5.5 7.5C5.5 8.60457 6.39543 9.5 7.5 9.5Z'); // Add the path data here
      pathElement.setAttribute('fill', 'currentColor');
      pathElement.setAttribute('fill-rule', 'evenodd');
      pathElement.setAttribute('clip-rule', 'evenodd');

      // Append the path element to the SVG element
      svgElement.appendChild(pathElement);

      // Append the SVG element inside the new div
      newDiv.appendChild(svgElement);
      newDiv.classList.add('page-content--image-details-text__base-size');
      tag.appendChild(newDiv);
    }
    // tag.innerHTML = index.toString()
    if (index % 3 === 0) {
      tag.classList.add('media-section--item__large');
    } else {
      tag.classList.add('media-section--item__base');
    }
    tag.classList.add('relative');
    tag.classList.add('group');
  })

  const blockquoteTags = div.querySelectorAll('blockquote');
  blockquoteTags.forEach((blockquoteTag) => {
    blockquoteTag.classList.add('page-content--blockquote__base-size');
  });

  const preTags = div.querySelectorAll('pre');
  preTags.forEach((preTag) => {
    preTag.classList.add('page-content--codeblock__base-size');
  });

  const imgTags = div.querySelectorAll('img');
  imgTags.forEach((imgTag) => {
    imgTag.classList.add('page-content--image__base-size');
  });
}

const formattedUrl = (input: string): string => {
  if (input === "other-websites") {
    return input
  }
  return `https://${input.split("-").join(".")}`
}
