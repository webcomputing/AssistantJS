import { TranslateValuesFor } from "../../../src/assistant-source";
import { arraySplitter } from "../../../src/components/i18n/plugins/array-returns-sample.plugin";
import { TranslateHelper } from "../../../src/components/i18n/translate-helper";
import { injectionNames } from "../../../src/injection-names";
import { createRequestScope } from "../../helpers/scope";
import { configureI18nLocale } from "../../support/util/i18n-configuration";
import { ThisContext } from "../../this-context";

interface CurrentThisContext extends ThisContext {
  translateValuesFor: TranslateValuesFor;
  translateHelper: TranslateHelper;
}

describe("translateValuesFor", function() {
  beforeEach(function(this: CurrentThisContext) {
    this.specHelper.prepareSpec(this.defaultSpecOptions);
    // Remove emitting of warnings
    this.specHelper.bindSpecLogger("error");

    configureI18nLocale(this.assistantJs.container, false);
    createRequestScope(this.specHelper);
    this.translateValuesFor = this.inversify.get(injectionNames.current.i18nTranslateValuesFor);
  });

  it("returns all values of given key", async function() {
    const results = await this.translateValuesFor("templateSyntaxSmall", { name: "my name" });
    expect(results).toEqual(["hello my name", "hi my name", "welcome my name"]);
  });

  describe("combined with translateHelper.t", function() {
    beforeEach(function(this: CurrentThisContext) {
      this.translateHelper = this.inversify.get(injectionNames.current.translateHelper);
    });

    it("does not change behaviour of translateHelper.t", async function() {
      await this.translateValuesFor("templateSyntaxSmall", { name: "my name" });
      expect(this.translateHelper.t("templateSyntaxSmall") as string).not.toContain(arraySplitter);
    });
  });
});
