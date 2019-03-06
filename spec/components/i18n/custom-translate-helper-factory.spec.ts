import { Container } from "inversify";
import { TranslateHelperFactory } from "../../../src/assistant-source";
import { injectionNames } from "../../../src/injection-names";
import { configureI18nLocale } from "../../support/util/i18n-configuration";
import { createRequestScope } from "../../support/util/setup";
import { ThisContext } from "../../this-context";

interface CurrentThisContext extends ThisContext {
  currentTranslateHelperFactory: TranslateHelperFactory;
}

describe("TranslateHelperFactory", function() {
  beforeEach(function(this: CurrentThisContext) {
    this.specHelper.prepareSpec(this.defaultSpecOptions);
    // Remove emitting of warnings
    this.specHelper.bindSpecLogger("error");

    configureI18nLocale(this.assistantJs.container, false);
    createRequestScope(this.specHelper);

    this.currentTranslateHelperFactory = this.inversify.get<TranslateHelperFactory>(injectionNames.current.translateHelperFactory);
  });

  it("translates for custom contexts", async function(this: CurrentThisContext) {
    const translateHelper = this.currentTranslateHelperFactory("GetObjectState", "relativeIntent");
    expect(await translateHelper.t(".withSingleString")).toEqual("only alternative");
  });
});
