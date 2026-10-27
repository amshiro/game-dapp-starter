import { shellRoutes } from "../_shell/routes";

export default function Page() {
  return <h1 className="text-page-title font-bold">{shellRoutes[0].label}</h1>;
}
