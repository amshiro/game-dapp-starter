import { redirect } from "next/navigation";
import { shellRoutes } from "./_shell/routes";

export default function Page() {
  redirect(shellRoutes[0].href);
}
