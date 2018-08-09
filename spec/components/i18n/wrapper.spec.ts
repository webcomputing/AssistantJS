import { injectable } from "inversify";
import { Container } from "inversify-components";
import { componentInterfaces } from "../../../src/components/i18n/component-interfaces";
import { TEMPORARY_INTERPOLATION_END, TEMPORARY_INTERPOLATION_START } from "../../../src/components/i18n/interpolation-resolver";
import { arraySplitter } from "../../../src/components/i18n/plugins/array-returns-sample.plugin";
import { I18nextWrapper } from "../../../src/components/i18n/wrapper";
import { SpecHelper } from "../../../src/spec-helper";
import { configureI18nLocale } from "../../support/util/i18n-configuration";

interface CurrentThisContext {
  container: Container;
  wrapper: I18nextWrapper;
  specHelper: SpecHelper;
}
describe("I18nWrapper", function() {
  const expectedTranslations = ["hello my name", "hi my name", "welcome my name"];

  beforeEach(function(this: CurrentThisContext) {
    // Remove emitting of warnings
    this.specHelper.bindSpecLogger("error");

    configureI18nLocale(this.container, false);
  });

  describe("with returnOnlySample = true", function() {
    beforeEach(function() {
      this.wrapper = this.container.inversifyInstance.get("core:i18n:wrapper");
    });

    describe("translation function", function() {
      it("returns one of many options", function(this: CurrentThisContext) {
        expect(expectedTranslations).toContain(this.wrapper.instance.t("templateSyntaxSmall", { name: "my name" }));
      });
    });

    describe("missingInterpolationHandler", function() {
      beforeEach(function() {
        spyOn(this.wrapper.instance.options, "missingInterpolationHandler").and.callThrough();
      });

      it("calls callback if interpolation is missing", function(this: CurrentThisContext) {
        this.wrapper.instance.t("templateSyntaxSmall");
        expect(this.wrapper.instance.options.missingInterpolationHandler).toHaveBeenCalled();
      });

      it("replaces interpolation with modified interpolation", function(this: CurrentThisContext) {
        const translation = this.wrapper.instance.t("templateSyntaxSmall");
        expect(translation).toContain(`${TEMPORARY_INTERPOLATION_START}name${TEMPORARY_INTERPOLATION_END}`);
      });
    });
  });

  describe("with returnOnlySample = false", function(this: CurrentThisContext) {
    describe("translation function", function() {
      it("returns all available options", function() {
        this.wrapper = this.container.inversifyInstance.get("core:i18n:spec-wrapper");
        expect(this.wrapper.instance.t("templateSyntaxSmall", { name: "my name" })).toEqual(expectedTranslations.join(arraySplitter));
      });
    });
  });
});
