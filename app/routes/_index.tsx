import type { LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { safeGetWebsite } from "~/api";

export const loader: LoaderFunction = async ({ request, params }) => {
  const websiteRes = await safeGetWebsite(request, params)
  if (typeof websiteRes === "string") {
    if (websiteRes === "error") {
      throw new Response("Website not found", {
        status: 404,
      });
    }
    return redirect(websiteRes)
  }
  return redirect("/")
};
