import { injectable } from "inversify";
import { Container } from "inversify-components";
import { MissingInterpolationExtension } from "../../../src/assistant-source";
import { componentInterfaces } from "../../../src/components/i18n/component-interfaces";
import { arraySplitter } from "../../../src/components/i18n/plugins/array-returns-sample.plugin";
import { I18nextWrapper } from "../../../src/components/i18n/wrapper";
import { configureI18nLocale } from "../../support/util/i18n-configuration";

interface CurrentThisContext {
  container: Container;
  missingInterpolationExtension: MissingInterpolationExtension;
  wrapper: I18nextWrapper;
}
describe("I18nWrapper", function() {
  const expectedTranslations = ["hello my name", "hi my name", "welcome my name"];

  beforeEach(function(this: CurrentThisContext) {
    configureI18nLocale(this.container, false);
  });

  describe("with returnOnlySample = true", function() {
    describe("translation function", function() {
      it("returns one of many options", function(this: CurrentThisContext) {
        this.wrapper = this.container.inversifyInstance.get("core:i18n:wrapper");
        expect(expectedTranslations).toContain(this.wrapper.instance.t("templateSyntaxSmall", { name: "my name" }));
      });
    });

    describe("missingInterpolationHandler", function() {
      beforeEach(function(this: CurrentThisContext) {
        @injectable()
        class MockMissingInterpolationExtension implements MissingInterpolationExtension {
          public execute(generatorClassName: string): string | undefined {
            return "test";
          }
        }

        this.container.inversifyInstance
          .bind(componentInterfaces.missingInterpolation)
          .to(MockMissingInterpolationExtension)
          .inSingletonScope();

        this.missingInterpolationExtension = this.container.inversifyInstance.get<MissingInterpolationExtension>(componentInterfaces.missingInterpolation);
        spyOn(this.missingInterpolationExtension, "execute").and.callThrough();
        this.wrapper = this.container.inversifyInstance.get("core:i18n:wrapper");
        spyOn(this.wrapper.instance.options, "missingInterpolationHandler").and.callThrough();
      });

      it("calls callback if interpolation is missing", function(this: CurrentThisContext) {
        this.wrapper.instance.t("templateSyntaxSmall");
        expect(this.wrapper.instance.options.missingInterpolationHandler).toHaveBeenCalled();
      });

      it("executes MissingInterpolationExtensions if interpolation is missing", function(this: CurrentThisContext) {
        this.wrapper.instance.t("templateSyntaxSmall");
        expect(this.missingInterpolationExtension.execute).toHaveBeenCalled();
      });

      it("replaces interpolation with the return value of execute-method of MissingInterpolationExtension", function(this: CurrentThisContext) {
        const translation = this.wrapper.instance.t("templateSyntaxSmall");
        expect(translation).toContain("test");
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
