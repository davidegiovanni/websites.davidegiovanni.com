export default ({ title, description, image, url, robots, type, theme, twitter } : { title:string, description:string, image:string, url:string, robots: string, type: string, theme?: string, twitter?: string }) => {
  let meta: any[] = [
    {
      name: "og:type",
      content: type
    },
    {
      name: "og:url",
      content: url
    },
    {
      name: "og:title",
      content: title
    },
    {
      name: "og:description",
      content: description
    },
    {
      name: "og:image",
      content: image
    },
    {
      name: "twitter:title",
      content: title
    },
    {
      name: "twitter:description",
      content: description
    },
    {
      name: "twitter:image",
      content: image
    },
    {
      title
    },
    {
      description
    },
    {
      name: "robots",
      content: robots
    },
    {
      name: "theme-colo",
      content: robots
    },
    {
      name: "robots",
      content: theme || '#ffffff'
    },
    {
      name: "twitter:card",
      content: twitter || 'summary'
    },
  ]
  
  return meta
}