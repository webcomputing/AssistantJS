import { configureI18nLocale } from "../../support/util/i18n-configuration";
import { injectionNames } from "../../../src/injection-names";

describe("translateValuesFor", function() {
  beforeEach(function() {
    configureI18nLocale(this.container, false);
  })

  it("returns all values of given key", function() {
    let results = this.container.inversifyInstance.get(injectionNames.i18nTranslateValuesFor)("templateSyntaxSmall", { "name": "my name" });
    expect(results).toEqual(["hello my name", "hi my name", "welcome my name"]);
  });
});