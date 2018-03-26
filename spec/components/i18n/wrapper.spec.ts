import { arraySplitter } from "../../../src/components/i18n/plugins/array-returns-sample.plugin";
import { I18nextWrapper } from "../../../src/components/i18n/wrapper";
import { configureI18nLocale } from "../../support/util/i18n-configuration";

describe("I18nWrapper", function() {
  const expectedTranslations = ["hello my name", "hi my name", "welcome my name"];

  beforeEach(function() {
    configureI18nLocale(this.container, false);
  });

  describe("with returnOnlySample = true", function() {
    describe("translation function", function() {
      it("returns one of many options", function() {
        const wrapper = this.container.inversifyInstance.get("core:i18n:wrapper");
        expect(expectedTranslations).toContain(wrapper.instance.t("templateSyntaxSmall", { name: "my name" }))
      })
    });
    describe("missingInterpolationHandler", function() {
      beforeEach(function() {
        this.wrapper = this.container.inversifyInstance.get("core:i18n:wrapper");
        spyOn(this.wrapper.instance.options, "missingInterpolationHandler").and.callThrough();
      });

      it("calls callback if interpolation is missing", function() {
        this.wrapper.instance.t("templateSyntaxSmall");
        expect(this.wrapper.instance.options.missingInterpolationHandler).toHaveBeenCalled();
      });
    });
  });

  describe("with returnOnlySample = false", function() {
    describe("translation function", function() {
      it("returns all available options", function() {
        const wrapper = this.container.inversifyInstance.get("core:i18n:spec-wrapper");
        expect(wrapper.instance.t("templateSyntaxSmall", { name: "my name" })).toEqual(expectedTranslations.join(arraySplitter));
      })
    });
  });
});