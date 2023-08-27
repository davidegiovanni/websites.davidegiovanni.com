import { cssBundleHref } from "@remix-run/css-bundle";
import { LoaderFunction, json, redirect, type LinksFunction, type V2_MetaFunction } from "@remix-run/node";
import {
  Link,
  Links,
  LiveReload,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLoaderData,
  useNavigation,
  useRouteError,
} from "@remix-run/react";
import { DynamicLinks } from "./utils/dynamic-links";
import { ReactNode, useEffect, useRef, useState } from "react";

import tailwind from "./styles/tailwind.css"
import defaultCss from "./default.css";
import { website, page, safeGetWebsite } from "./api";
import { Website, Page } from "./models";
import { createMouseFollower, fluidType, getContrast, isExternalLink } from "./utils/helpers";
import { Attachment } from "./components/Attachment";

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
  {
    rel: "stylesheet",
    href: tailwind,
  },
  {
    rel: "stylesheet",
    href: defaultCss,
  },
];

export const meta: V2_MetaFunction = () => {
  return [
    {
      name: "twitter:card",
      content:
        "summary_large_image",
    },
  ];
};

type LoaderData = {
  primaryColor: string;
  favicon: string;
  links: {
    title: string;
    url: string;
    isExternal: boolean;
  }[];
  incomingLocale: string;
  locales: { code: string; title: string; }[];
  fontUrl: string;
  fontFamily: string;
  logoUrl: string;
  cursor: string;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const incomingLocale = params.lang || ""

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
        return "";
    }
  }

  let links: {
    title: string;
    url: string;
    isExternal: boolean;
  }[] = []
  let locales: {
    code: string;
    title: string;
  }[] = []

  if (incomingLocale === "") {
    await safeGetWebsite(request, params, "");
    return
  }

  let websiteObject: Website = {} as Website
  let languageCodes: string[] = []
  const websiteRes = await safeGetWebsite(request, params, incomingLocale);
  if (typeof websiteRes === "string") {
    if (websiteRes === "error") {
      throw new Response("Website not found", {
        status: 404,
      });
    }
    return redirect(websiteRes)
  }
  if (typeof websiteRes !== "string") {
    websiteObject = websiteRes.website
    languageCodes = websiteRes.languageCodes
  }

  const primaryColor: string = websiteObject.theme.accentColor

  const favicon = websiteObject.theme.iconUrl
  const fontUrl = websiteObject.theme.fontFamilyUrl
  const fontFamily = websiteObject.theme.fontFamily
  const logoUrl = websiteObject.theme.logoUrl

  links = websiteObject.navigation.map(l => {
    return {
      title: l.title,
      url: l.url,
      isExternal: isExternalLink(l.url)
    }
  })
  const availableLocales: string[] = languageCodes.filter((l: string) => l !== params.lang)
  locales = availableLocales.map(al => {
    return {
      code: al,
      title: getLanguageName(al)
    }
  })

  const [pageRes, pageErr] = await page("index", params)
  if (pageErr !== null) {
    throw new Response(`Page do not exist: ${pageErr.message} ${pageErr.code}`, {
      status: 404,
    });
  }

  const pageObject: Page = pageRes.page

  const cursor = pageObject.blocks[1].items[0].attachment?.url || ""


  const loaderData: LoaderData = {
    primaryColor,
    favicon,
    fontUrl,
    incomingLocale,
    links,
    locales,
    fontFamily,
    logoUrl,
    cursor
  }

  return json(loaderData)
};

export default function App() {
  const loaderData = useLoaderData<LoaderData>()
  const navigation = useNavigation();

  const [navigationStart, setNavigationStart] = useState<boolean>(false);
  const [navigationEnd, setNavigationEnd] = useState<boolean>(false);

  useEffect(() => {
    if (navigation.state === "loading") {
      setNavigationStart(true);
      setNavigationEnd(false);
    }
    if (navigation.state === "idle" && navigationStart) {
      setNavigationEnd(true);
      setNavigationStart(false);
      setTimeout(() => {
        setNavigationEnd(false);
      }, 700);
    }
  }, [navigation.state]);

  const style = {
    "--customfont": loaderData.fontFamily,
    fontFamily: loaderData.fontFamily,
    backgroundColor: loaderData.primaryColor,
    color: getContrast(loaderData.primaryColor)
  }

  const [isMenuOpen, toggleMenuOpen] = useState<boolean>(false)
  const followerDivRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const supportsHover = window.matchMedia("(hover: hover)").matches;

    if (!supportsHover || !followerDivRef.current) {
      return; // Exit the useEffect hook if hover is not supported or the ref is not available
    }

    if (followerDivRef.current) {
      createMouseFollower(followerDivRef.current);
    }
  }, []);

  const [currentTime, setCurrentTime] = useState('✻☯︎')

  const getTimeDate = () => {
    var date = new Date();
    var current_date = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
    var current_time = `${date.getHours() < 10 ? '0' : ''}${date.getHours()}` + ":" + `${date.getMinutes() < 10 ? '0' : ''}${date.getMinutes()}` + ":" + `${date.getSeconds()}${date.getSeconds() < 10 ? '0' : ''}`;
    var date_time = current_date + " ✶ " + current_time;
    setCurrentTime(date_time)
  }

  useEffect(
    () => { setTimeout(getTimeDate, 1000) }
  )

  return (
    <Document lang={loaderData.incomingLocale} favicon={loaderData.favicon} fontUrl={loaderData.fontUrl}>
      <div style={style} className="root-layout cursor-none">
        {(navigationStart || navigationEnd) && (
            <div
              data-navigation-start={navigationStart}
              data-navigation-end={navigationEnd}
              className="loading-bar"
            />
          )}
          <nav data-open={isMenuOpen} className="hidden data-[open=true]:block fixed inset-0 z-[80]">
            <p>
              Copyright © <a href="https://davidegiovanni.com" target={'_blank'} rel="noopener">Davide Giovanni Steccanella </a>
            </p>
            <p>
            {currentTime}
          </p>
            <ul>
                {loaderData.links.map((link, index) => (
                <li key={index} onClick={() => toggleMenuOpen(false)}>
                  {
                    link.isExternal ? (
                      <a href={link.url}>
                        {link.title}
                      </a>
                    ) : (
                      <NavLink to={link.url} className={({ isActive }) =>
                        `${isActive ? "" : ""} `
                      }>
                        {link.title}
                      </NavLink>
                    )
                  }
                </li>
              ))}
            </ul>
          </nav>
          { loaderData.logoUrl !== "" && (
            <Attachment attachment={{
              mediaType: "image/*",
              url: loaderData.logoUrl,
              description: "Davide Giovanni Steccanella",
              metadata: {}
          }} />
          )}
          <button onClick={() => toggleMenuOpen(!isMenuOpen)} className="fixed top-0 mx-auto hidden">
            { isMenuOpen ? "Chiudi" : "Menu"}
          </button>
          <Outlet />
      </div>
      <CustomCursor cursor={loaderData.cursor} followerDivRef={followerDivRef} />
    </Document>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const isErrorBig = isRouteErrorResponse(error)

  return (
    <Document lang={"en-US"} favicon={""} fontUrl={""}>
      <div className="fixed inset-0 overflow-hidden bg-[#0827F5] text-white p-2 selection:bg-yellow-500 selection:text-white">
        <div className="w-full h-full overflow-hidden safari-only">
          <h1 style={{ fontSize: fluidType(32, 120, 300, 2400, 1.5).fontSize, lineHeight: fluidType(24, 100, 300, 2400, 1.5).lineHeight }}>
            Error ಥ_ಥ
          </h1>
          <p className="text-white my-4">
            {isErrorBig && (
              <>
                {error.status} {error.statusText}
              </>
            )}
            {!isErrorBig && error instanceof Error && (
              <>
                {error.message} {error.name}
              </>
            )}
          </p>
          <Link to={'/'} className="block underline mb-4 text-white" reloadDocument>
            Go to homepage
          </Link>
          <img src="https://c.tenor.com/1zi9Ppr4YDsAAAAj/travolta-lost.gif" alt="" />
        </div>
      </div>
    </Document>
  );
}

function Document(props: { children: ReactNode; lang: string; favicon: string; fontUrl: string; }) {
  return (
    <html>
      <head lang={props.lang}>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <link rel="icon" type="image/x-icon" href={props.favicon} />
        <Links />
        <DynamicLinks />
      </head>
      <body>
        {props.children}
        <Scripts />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link href={props.fontUrl} rel="stylesheet"></link>
        {process.env.NODE_ENV === "development" && <LiveReload />}
      </body>
    </html>
  )
}

function CustomCursor (props: { cursor: string, followerDivRef: React.RefObject<HTMLDivElement>} ) {
  if (props.cursor === "") {
    return (
      <div ref={props.followerDivRef} className="cursor__default" />
    )
  }
  return (
    <div ref={props.followerDivRef} className="cursor__filled">
      <img src={props.cursor} alt="Cursor" />
    </div>
  )
}

function darkenColor(hexColor: string): string {
  // Remove the '#' symbol if present
  const sanitizedHex = hexColor.replace('#', '');

  // Convert the hex color to RGB components
  const r = parseInt(sanitizedHex.substring(0, 2), 16);
  const g = parseInt(sanitizedHex.substring(2, 4), 16);
  const b = parseInt(sanitizedHex.substring(4, 6), 16);

  // Calculate the darker color by reducing each component by 50%
  const darkerR = Math.max(r - Math.round(r * 0.5), 0);
  const darkerG = Math.max(g - Math.round(g * 0.5), 0);
  const darkerB = Math.max(b - Math.round(b * 0.5), 0);

  // Convert the darker RGB components back to hex
  const darkerHex = ((1 << 24) | (darkerR << 16) | (darkerG << 8) | darkerB).toString(16).slice(1);

  return '#' + darkerHex;
}
