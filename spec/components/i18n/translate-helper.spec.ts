import { injectionNames } from "../../../src/injection-names";
import { MissingInterpolationExtension } from "../../../src/assistant-source";
import { injectable } from "inversify";
import { Container } from "inversify-components";
import { I18nextWrapper } from "../../../src/components/i18n/wrapper";
import { componentInterfaces } from "../../../src/components/i18n/component-interfaces";
import { TranslateHelper } from "../../../src/components/i18n/translate-helper";
import { configureI18nLocale } from "../../support/util/i18n-configuration";
import { createRequestScope } from "../../support/util/setup";

interface CurrentThisContext {
  container: Container;
  missingInterpolationExtension: MissingInterpolationExtension;
  translateHelper: TranslateHelper;
}

describe("TranslateHelper", function() {
  beforeEach(function() {
    configureI18nLocale(this.container, false);
    createRequestScope(this.specHelper);
    this.stateMachine = this.container.inversifyInstance.get("core:state-machine:current-state-machine");
  });

  describe("t", function() {
    beforeEach(function() {
      this.context = this.container.inversifyInstance.get("core:i18n:current-context");
      this.context.intent = "testIntent";
      this.context.state = "mainState";

      this.translateHelper = this.container.inversifyInstance.get("core:i18n:current-translate-helper");
    });

    it("supports explicit keys", async function() {
      expect(await this.translateHelper.t("mySpecificKeys.keyOne")).toEqual("keyOneResult");
    });

    it("returns a sample of multiple possible values", async function() {
      expect(["a", "b"]).toContain(await this.translateHelper.t("multiple"));
    });

    it("replaces locals in translation", async function() {
      expect(await this.translateHelper.t("var", { var: "b" })).toEqual("ab");
    });

    it("supports template syntax", async function() {
      expect(["Can I help you, Sir?", "May I help you, Sir?", "Would you like me to help you?"]).toContain(
        await this.translateHelper.t("templateSyntax", { var: "Sir" })
      );
    });

    it("looks for match in array syntax before evaluation template syntax", async function() {
      // Regularly, "5" should have a probabilty of 1/10
      // In a bug case, the prob is much higher (around 1024/1033 ~ 99%)
      const testSize = 100;
      const probabilitySet = await Promise.all([...Array(testSize)].map(async (x): Promise<string> => this.translateHelper.t("templateProbs")));
      const occuredAmount = probabilitySet.filter(x => x.charAt(0) === "5").length / testSize;

      expect(occuredAmount).toBeCloseTo(0.15, 0.15); // Expected amount is 10%, let's check for 0%-30%.
    });

    describe("when translation does not exist", function() {
      it("throws error", async function() {
        try {
          await this.translateHelper.t(".notExisting");
          fail();
        } catch (e) {
          expect(e.message).toContain("I18n key lookup could not be resolved");
        }
      });
    });

    describe("when state namespace exists", function() {
      describe("when intent namespace exists", function() {
        describe("when extractor namespace exists", function() {
          describe("when key given", function() {
            it("returns translation for '.embedded.platformDependent'", async function() {
              expect(await this.translateHelper.t(".embedded.platformDependent")).toEqual("platform-specific-sub-key");
            });

            describe("when extraction contains device", function() {
              beforeEach(function() {
                this.context.intent = "deviceDependentIntent";
                Object.assign(this.translateHelper.extraction, { device: "device1" });
              });

              it("returns state-intent-key-extractor-device specific translation", async function() {
                expect(await this.translateHelper.t(".embeddedKeyOuter.embeddedKeyInner")).toEqual("device-specific-sub-key");
              });
            });
          });

          describe("when key is not given", function() {
            it("returns platform-specific translation for intent", async function() {
              this.context.intent = "platformSpecificIntent";
              expect(await this.translateHelper.t()).toEqual("platform-specific-intent");
            });
          });
        });

        describe("without extractor namespace", function() {
          describe("when key is not given", function() {
            it("returns intent-only translation", async function() {
              this.context.intent = "yesGenericIntent";
              expect(await this.translateHelper.t()).toEqual("yes");
            });
          });

          describe("when key is given", function() {
            it("returns key specific intent translation", async function() {
              expect(await this.translateHelper.t(".embedded.test")).toEqual("very-specific-without-extractor");
            });
          });
        });
      });

      describe("without intent namespace", function() {
        beforeEach(function() {
          this.context.intent = "notExisting";
        });

        it("returns correct translation for empty key", async function() {
          this.context.state = "noIntentState";
          expect(await this.translateHelper.t()).toEqual("stateOnly");
        });

        describe("with extractor given", function() {
          describe("with key given", function() {
            it("returns platform specific translation for key", async function() {
              expect(await this.translateHelper.t(".platformDependent")).toEqual("platform-specific-embedded-state-only");
            });
          });

          describe("with key not given", function() {
            it("returns platform specific translation on state level", async function() {
              expect(await this.translateHelper.t()).toEqual("platform-specific-main-state-only");
            });

            describe("when extraction data contains device", function() {
              beforeEach(function() {
                this.context.state = "deviceDependentState";
                Object.assign(this.translateHelper.extraction, { device: "device1" });
              });

              it("returns state-platform-device specific translation", async function() {
                expect(await this.translateHelper.t()).toEqual("state-platform-device-specific");
              });
            });
          });
        });

        describe("without extractor", function() {
          describe("with key given", function() {
            it("returns platform specific translation for key", async function() {
              expect(await this.translateHelper.t(".platformIndependent")).toEqual("platform-independent-main-state");
            });
          });

          describe("with key not given", function() {
            it("returns platform specific translation on state level", async function() {
              expect(await this.translateHelper.t()).toEqual("platform-specific-main-state-only");
            });
          });
        });
      });
    });

    describe("when state namespace does not eixst", function() {
      beforeEach(function() {
        this.context.state = "notExisting";
      });

      describe("when intent namespace exist", function() {
        describe("when extractor namespace exist", function() {
          describe("when key given", function() {
            it("returns key with embedded extractor", async function() {
              expect(await this.translateHelper.t(".embedded.platformDependent")).toEqual("platform-specific-embedded");
            });

            describe("when device exists in extraction result", function() {
              beforeEach(function() {
                Object.assign(this.translateHelper.extraction, { device: "device1" });
              });

              it("returns root-intent-platform-device-specific value", async function() {
                expect(await this.translateHelper.t(".deviceDependent")).toEqual("root-intent-platform-device-specific");
              });
            });
          });

          describe("when key is not given", function() {
            it("returns platform-specific translation for intent", async function() {
              this.context.intent = "secondPlatformSpecificIntent";
              expect(await this.translateHelper.t()).toEqual("root-platform-specific-intent");
            });
          });
        });

        describe("without extractor namespace", function() {
          describe("with key given", function() {
            it("returns platform-independent translation for intent+key", async function() {
              expect(await this.translateHelper.t(".withoutExtractor")).toEqual("root-without-extractor");
            });
          });

          it("returns correct translation for empty key", async function() {
            this.context.intent = "yesGenericIntent";
            expect(await this.translateHelper.t()).toEqual("root-yes");
          });
        });
      });

      describe("without intent namespace", function() {
        describe("with extractor existing", function() {
          describe("when key given", function() {
            it("returns platform-specific translation for '.key'", async function() {
              expect(await this.translateHelper.t(".rootKey")).toEqual("platform-specific-root-only");
            });
          });
        });

        describe("with extractor existing", function() {
          it("returns platform specific translation on state level", async function() {
            expect(await this.translateHelper.t()).toEqual("root-only-platform-given");
          });
        });
      });
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
      this.translateHelper = this.container.inversifyInstance.get("core:i18n:current-translate-helper");
    });

    it("executes MissingInterpolationExtensions if interpolation is missing", async function(this: CurrentThisContext) {
      await this.translateHelper.t("templateSyntaxSmall");
      expect(this.missingInterpolationExtension.execute).toHaveBeenCalled();
    });

    it("replaces interpolation with the return value of execute-method of MissingInterpolationExtension", async function(this: CurrentThisContext) {
      const translation = await this.translateHelper.t("templateSyntaxSmall");
      expect(translation).toContain("test");
    });

    it("does not call missingInterpolationExtensions if all interpolations are present", async function(this: CurrentThisContext){
      await this.translateHelper.t("mySpecificKeys.keyOne");
      expect(this.missingInterpolationExtension.execute).not.toHaveBeenCalled();
    });
  });
});
