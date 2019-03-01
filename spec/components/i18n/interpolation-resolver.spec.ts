import { injectable } from "inversify";
import { injectionNames, MissingInterpolationExtension, SpecHelper } from "../../../src/assistant-source";
import { componentInterfaces } from "../../../src/components/i18n/component-interfaces";
import { TranslateHelper } from "../../../src/components/i18n/translate-helper";
import { createRequestScope } from "../../helpers/scope";
import { configureI18nLocale } from "../../support/util/i18n-configuration";
import { ThisContext } from "../../this-context";

interface CurrentThisContext extends ThisContext {
  missingInterpolationExtension: MissingInterpolationExtension;
  translateHelper: TranslateHelper;
}

describe("InterpolationResolver", function() {
  beforeEach(function(this: CurrentThisContext) {
    this.specHelper.prepareSpec(this.defaultSpecOptions);
    // Remove emitting of warnings
    this.specHelper.bindSpecLogger("error");
    configureI18nLocale(this.assistantJs.container, false);
    createRequestScope(this.specHelper);
  });

  describe("resolveMissingInterpolations", function() {
    describe("with interpolation extensions present", function() {
      beforeEach(function(this: CurrentThisContext) {
        @injectable()
        class MockMissingInterpolationExtension implements MissingInterpolationExtension {
          public execute(generatorClassName: string): string | undefined {
            return "test";
          }
        }

        this.inversify
          .bind(componentInterfaces.missingInterpolation)
          .to(MockMissingInterpolationExtension)
          .inSingletonScope();

        this.missingInterpolationExtension = this.inversify.get<MissingInterpolationExtension>(componentInterfaces.missingInterpolation);
        spyOn(this.missingInterpolationExtension, "execute").and.callThrough();
        this.translateHelper = this.inversify.get(injectionNames.current.translateHelper);
      });

      it("executes MissingInterpolationExtensions if interpolation is missing", async function(this: CurrentThisContext) {
        await this.translateHelper.t("templateSyntaxSmall");
        expect(this.missingInterpolationExtension.execute).toHaveBeenCalled();
      });

      it("replaces interpolation with the return value of execute-method of MissingInterpolationExtension", async function(this: CurrentThisContext) {
        const translation = await this.translateHelper.t("templateSyntaxSmall");
        expect(translation).toContain("test");
      });

      it("does not call missingInterpolationExtensions if all interpolations are present", async function(this: CurrentThisContext) {
        await this.translateHelper.t("noInterpolation");
        expect(this.missingInterpolationExtension.execute).not.toHaveBeenCalled();
      });
    });

    describe("with no interpolation extensions present", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.translateHelper = this.inversify.get(injectionNames.current.translateHelper);
      });

      it("throws a warning", async function(this: CurrentThisContext) {
        spyOn((this.translateHelper.interpolationResolver as any).logger, "warn").and.callThrough();
        await this.translateHelper.t("multipleVars");
        expect((this.translateHelper.interpolationResolver as any).logger.warn).toHaveBeenCalledTimes(3);
      });

      it("replaces interpolation variable with ''", async function(this: CurrentThisContext) {
        expect(await this.translateHelper.t("var")).toEqual("a");
      });

      describe("with one interpolation given as variable, but multiple interpolations missing", function() {
        it("replaces all not-given variables with ''", async function(this: CurrentThisContext) {
          expect(await this.translateHelper.t("multipleVars", { firstVar: "first" })).toEqual("afirstbc");
        });
      });
    });
  });
});
