import { arraySplitter } from "../../../src/components/i18n/plugins/array-returns-sample.plugin";
import { injectionNames } from "../../../src/injection-names";
import { configureI18nLocale } from "../../support/util/i18n-configuration";
import { createRequestScope } from "../../support/util/setup";

describe("translateValuesFor", function() {
  beforeEach(function() {
    configureI18nLocale(this.container, false);
    createRequestScope(this.specHelper);
    this.translateValuesFor = this.container.inversifyInstance.get(injectionNames.current.i18nTranslateValuesFor);
  })

  it("returns all values of given key", async function() {

    const results = await this.translateValuesFor("templateSyntaxSmall", { "name": "my name" });
    expect(results).toEqual(["hello my name", "hi my name", "welcome my name"]);
  });

  describe("combined with translateHelper.t", function() {
    beforeEach(function() {
      this.translateHelper = this.container.inversifyInstance.get(injectionNames.current.translateHelper);
    });

    it("does not change behaviour of translateHelper.t", async function() {
      await this.translateValuesFor("templateSyntaxSmall", { "name": "my name" });
      expect(this.translateHelper.t("templateSyntaxSmall") as string).not.toContain(arraySplitter);
    });
  });
});
