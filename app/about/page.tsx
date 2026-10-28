import { AboutPage } from "../../src/features/about/about-page";
import { getRequestLocale } from "../request-locale";
export default async function Page() {
  return <AboutPage locale={await getRequestLocale()} />;
}
