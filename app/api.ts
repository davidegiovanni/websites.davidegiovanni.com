import { Params } from "@remix-run/react";
import { safeGet } from "./utils/safe-get";
import { BlockItem, Feed, FeedItem, Page, UIItem, UISection, Website } from "~/models";
import { formatDate, getSlug, isExternalLink } from "./utils/helpers";

let websiteName = "websites.davidegiovanni.com";
let publicKey = "01exy3y9j9pdvyzhchkpj9vc5w";

export const website = async (
  request: Request,
  params: Params<string>,
  locale?: string
) => {
  const languageCode = locale !== undefined ? locale : params.lang || "";

  const [res, err] = await safeGet<any>(
    `https://cdn.revas.app/websites/v1/websites/${websiteName}?public_key=${publicKey}&language_code=${languageCode}`
  );
  const data = res;
  return [data, err];
};

export const page = async (page: string, params: Params<string>) => {
  const [res, err] = await safeGet<any>(
    `https://cdn.revas.app/websites/v1/websites/${websiteName}/pages/${
      page
    }?public_key=${publicKey}&language_code=${params.lang}`
  );
  const data = await res;
  return [data, err];
};

export const feed = async (feedName: string, params: Params<string>) => {
  const [res, err] = await safeGet<any>(
    `https://cdn.revas.app/contents/v0/directories/${feedName}/feed.json?public_key=${publicKey}`
  );
  const data = await res;
  return [data, err];
};

export async function safeGetWebsite(request: Request, params: Params, incomingLocale?: string | undefined): Promise<{ website: Website, languageCodes: string[]} | string> {
  if (!incomingLocale) {
    const [fullWebRes, fullWebErr] = await website(request, params, "");
    if (fullWebErr !== null) {
      return "error"
    }
    return `/${fullWebRes.website.languageCode}`;
  }
  
  const [webRes, webErr] = await website(request, params, incomingLocale);
  if (webErr !== null) {
    if (webErr.code === 5) {
      const [fullWebRes, fullWebErr] = await website(request, params, "");
      if (fullWebErr !== null) {
        return "error"
      }
      return `/${fullWebRes.website.languageCode}`;
    }
    return "error"
  }
  return {
    website: webRes.website as Website,
    languageCodes: webRes.languageCodes
  }
}
export async function safeGetPage(pageName: string, params: Params<string>): Promise<Page | string> {
  const [pageRes, pageErr] = await page(pageName, params)
  if (pageErr !== null) {
    return "error"
  }
  return pageRes.page as Page
}
export async function safeGetFeed(feedName: string, params: Params<string>): Promise<Feed | string> {
  const [feedRes, feedErr] = await feed(feedName, params)
  if (feedErr !== null) {
    return "error"
  }
  return feedRes as Feed
}

export function fromPageSectionToUISection(section: BlockItem): UISection {
  let formattedSection: UISection = {
    title: section.title,
    description: section.description,
    image: {
      mediaType: "",
      url: "",
      description: "",
      metadata: {}
    },
    link: {
      title: "",
      url: "",
      isExternal: false
    },
    id: section.id
  }
  if (section.attachment !== null) {
    formattedSection.image = {
      mediaType: section.attachment.mediaType,
      url: section.attachment.url,
      description: section.attachment.description,
      metadata: section.attachment.metadata,
    }
  }
  if (section.link !== null) {
    formattedSection.link = {
      title: section.link.title,
      url: section.link.url,
      isExternal: isExternalLink(section.link.url)
    }
  }
  return formattedSection
}

export function fromFeedItemToUIItem (item: FeedItem, locale: string): UIItem {
  const formattedItem: UIItem = {
    title: item.title,
    description: item.summary || "",
    image: {
      mediaType: "image/*",
      url: item.image || "",
      description: item.title,
      metadata: {}
    },
    slug: getSlug(item.id) || "",
    date_published: formatDate(item.date_published, locale),
    content: item.content_html || ""
  }
  return formattedItem
}
