import { arraySplitter } from "../../../src/components/i18n/plugins/array-returns-sample.plugin";
import { injectionNames } from "../../../src/injection-names";
import { configureI18nLocale } from "../../support/util/i18n-configuration";
import { createRequestScope } from "../../support/util/setup";

describe("translateValuesFor", function() {
  beforeEach(function() {
    configureI18nLocale(this.container, false);
    this.translateValuesFor = this.container.inversifyInstance.get(injectionNames.i18nTranslateValuesFor);
  });

  it("returns all values of given key", function() {
    const results = this.translateValuesFor("templateSyntaxSmall", { name: "my name" });
    expect(results).toEqual(["hello my name", "hi my name", "welcome my name"]);
  });

  describe("combined with translateHelper.t", function() {
    beforeEach(function() {
      createRequestScope(this.specHelper);
      this.translateHelper = this.container.inversifyInstance.get(injectionNames.current.translateHelper);
    });

    it("does not change behaviour of translateHelper.t", function() {
      this.translateValuesFor("templateSyntaxSmall", { name: "my name" });
      expect(this.translateHelper.t("templateSyntaxSmall") as string).not.toContain(arraySplitter);
    });
  });
});
