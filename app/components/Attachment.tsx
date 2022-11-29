import { Attachment } from "api/models";
import { useEffect } from "react";


type AttachmentProps = {
  attachment: Attachment;
  align?: string;
  size?: string;
  dimensions?: string;
};

export function Attachment(props: AttachmentProps) {
  function buildSrcset(url: any, format: string): any {
    const u = url.replace('cdn.revas.app', 'static.eu1.revas-cdn.com')
    const sizes = [600, 800, 1024, 1280, 1536];
    const urls = sizes.map(
      (size) => `${u}?format=${format}&size=${size}w ${size}w`
    );
    return urls.join(",");
  }

  const id = props.attachment.url.split('/').slice(-1)[0]

  let isLoadingLazy = true

  useEffect(() => {
    const image = document.getElementById(id) as HTMLElement
    const top = image.getBoundingClientRect().top

    if (top > 0 && top < window.innerHeight) {
      isLoadingLazy = false
    }
  })

  return (
    <figure id={props.attachment.id} className="w-full h-full relative" role="figure">
      {props.attachment.mediaType.startsWith("image/") && (
        <picture id={id} className="h-full w-full">
          <source
            className={(props.align) + " " + (props.size ? props.size : "object-cover ") + " relative z-10 h-full w-full"}
            type="image/webp"
            sizes="(min-width: 1536px) 1536px, (min-width: 1280px) 1280px, (min-width: 1024px) 1024px, (min-width: 800px) 800px, 600px"
            srcSet={buildSrcset(props.attachment.url, "webp")}
          ></source>
          <source
            className={(props.align) + " " + (props.size ? props.size : "object-cover ") + " relative z-10 h-full w-full"}
            type="image/avif"
            sizes="(min-width: 1536px) 1536px, (min-width: 1280px) 1280px, (min-width: 1024px) 1024px, (min-width: 800px) 800px, 600px"
            srcSet={buildSrcset(props.attachment.url, "avif")}
          ></source>
          <img
            srcSet={buildSrcset(props.attachment.url, "png")}
            sizes="(min-width: 1536px) 1536px, (min-width: 1280px) 1280px, (min-width: 1024px) 1024px, (min-width: 800px) 800px, 600px"
            src={props.attachment.url}
            className={(props.align) + " " + (props.size ? props.size : "object-cover ") + " relative z-10 h-full w-full"}
            alt={props.attachment.description}
            loading={isLoadingLazy ? "lazy" : "eager"}
            decoding="async"
          />
        </picture>
      )}
      {props.attachment.mediaType === "application/vnd.youtube.video" && (
        <iframe
          className="w-full h-full relative z-10"
          src={props.attachment.url}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      )}
    </figure>
  );
}
