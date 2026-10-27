import { getRequestLocale } from "../request-locale";
import { getShellCopy } from "../_shell/copy";
export default async function Page() {
  const copy = getShellCopy(await getRequestLocale());
  return <h1 className="text-page-title font-bold">{copy.about}</h1>;
}
