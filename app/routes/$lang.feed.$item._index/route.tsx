import { json, LoaderFunction, redirect, SerializeFrom } from "@remix-run/node";
import { useLoaderData, V2_MetaFunction } from "@remix-run/react";
import metadata from '~/utils/metadata'
import { useRef } from "react";
import { fromFeedItemToUIItem, safeGetFeed, safeGetWebsite } from "~/api";
import { Feed, Attachment as AttachmentModel, Website, FeedItem } from "~/models";
import { DynamicLinksFunction } from "~/utils/dynamic-links";

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
  const feedRes = await safeGetFeed("index", params)
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

  slug = params.item
  let foundItem: FeedItem | undefined = feedObject.items.find((i: any) => {
    return i.id.endsWith(slug)
  })
  if (foundItem === undefined) {
    throw new Response(`Page do not exist`, {
      status: 404,
    });
  }

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
    feedTitle
  }

  return json(loaderData)
};

export default function Index() {
  const loaderData = useLoaderData<LoaderData>();

  const divRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      Feed item page
    </div>
  );
}
