import { PointsPage } from "../../src/features/points/points-page";
import { getRequestLocale } from "../request-locale";
export default async function Page() {
  return <PointsPage locale={await getRequestLocale()} />;
}
