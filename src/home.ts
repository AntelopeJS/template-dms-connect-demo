import { Banner } from "@antelopejs/interface-dms/base";
import {
  PageController,
  pagesCategory,
  RegisterPage,
} from "@antelopejs/interface-dms/page";

@RegisterPage()
export class PageHome extends PageController("home", {
  displayName: "Home",
  icon: "i-ph-house",
  category: pagesCategory,
  order: 0,
  description: "Connect a database to generate its back office",
}) {
  static connect = Banner({
    tone: "primary",
    icon: "i-ph-plugs-connected",
    title: "Connect a sample database",
    description:
      "Open the Builder (hammer icon, top right), choose Database, then Connect a database. Paste postgres://dms_reader:dms_reader@sample-db:5432/chinook into the Connection field, press Fill in, then Connect. The README has the strings for the MongoDB and RethinkDB samples.",
  });
}
