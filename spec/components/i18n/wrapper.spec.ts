import * as path from "path";

import { TEMPORARY_INTERPOLATION_END, TEMPORARY_INTERPOLATION_START } from "../../../src/components/i18n/interpolation-resolver";
import { arraySplitter } from "../../../src/components/i18n/plugins/array-returns-sample.plugin";
import { I18nextWrapper } from "../../../src/components/i18n/wrapper";
import { injectionNames } from "../../../src/injection-names";
import { configureI18nLocale } from "../../support/util/i18n-configuration";
import { configureUnifier } from "../../support/util/unifier-configuration";
import { ThisContext } from "../../this-context";

interface CurrentThisContext extends ThisContext {
  wrapper: I18nextWrapper;
}
describe("I18nWrapper", function() {
  const expectedTranslations = ["hello my name", "hi my name", "welcome my name"];

  beforeEach(function(this: CurrentThisContext) {
    this.specHelper.prepareSpec(this.defaultSpecOptions);
    // Remove emitting of warnings
    this.specHelper.bindSpecLogger("error");

    configureI18nLocale(this.assistantJs.container, false);
  });

  describe("with returnOnlySample = true", function() {
    beforeEach(function(this: CurrentThisContext) {
      this.wrapper = this.inversify.get(injectionNames.i18nWrapper);
    });

    describe("translation function", function() {
      it("returns one of many options", function(this: CurrentThisContext) {
        expect(expectedTranslations).toContain(this.wrapper.instance.t("templateSyntaxSmall", { name: "my name" }));
      });
    });

    describe("missingInterpolationHandler", function() {
      beforeEach(function(this: CurrentThisContext) {
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
      it("returns all available options", function(this: CurrentThisContext) {
        this.wrapper = this.inversify.get(injectionNames.i18nSpecWrapper);
        expect(this.wrapper.instance.t("templateSyntaxSmall", { name: "my name" })).toEqual(expectedTranslations.join(arraySplitter));
      });
    });
  });
});

describe("I18nWrapper loading Typescript files", function(this: CurrentThisContext) {
  const expectedTranslations = ["hello my name", "hi my name", "welcome my name"];

  beforeEach(function(this: CurrentThisContext) {
    this.specHelper.prepareSpec(this.defaultSpecOptions);
    // Remove emitting of warnings
    this.specHelper.bindSpecLogger("error");

    configureI18nLocale(this.assistantJs.container, false);
    configureUnifier(this.assistantJs.container, path.join(__dirname, "../../support/mocks/i18n-ts/locale/"));
    this.wrapper = this.inversify.get("core:i18n:wrapper");
  });

  describe("translation function", function() {
    it("returns one of many options", function(this: CurrentThisContext) {
      expect(expectedTranslations).toContain(this.wrapper.instance.t("templateSyntaxSmall", { name: "my name" }));
    });
  });

  describe("loading behaviour", function() {
    it("load from file that has the same name as a directory", function() {
      expect(this.wrapper.instance.store.data.de.translation.mySpecificKeys.keyOne).toBe("keyOneResult");
    });

    it("loads default only if exists", function() {
      expect(this.wrapper.instance.store.data.de.translation.defaultExport.test).toBe("default");
    });

    it("loads export with camelcase filename if no default exists", function() {
      expect(this.wrapper.instance.store.data.de.translation.templateSyntaxSmall[0]).toBe("{hello|hi} {{name}}");
    });

    it("loads all exports if neither default nor one equal to camelcase filename exists", function() {
      expect(this.wrapper.instance.store.data.de.translation.mainState.testIntent.embedded.test).toBe("very-specific-without-extractor");
    });
  });
});
