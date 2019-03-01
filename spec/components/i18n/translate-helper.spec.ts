import { I18nContext } from "../../../src/components/i18n/context";
import { TranslateHelper } from "../../../src/components/i18n/translate-helper";
import { StateMachine } from "../../../src/components/state-machine/state-machine";
import { injectionNames } from "../../../src/injection-names";
import { createRequestScope } from "../../helpers/scope";
import { configureI18nLocale } from "../../support/util/i18n-configuration";
import { ThisContext } from "../../this-context";

interface CurrentThisContext extends ThisContext {
  stateMachine: StateMachine;
  context: I18nContext;
  translateHelper: TranslateHelper;
}

describe("TranslateHelper", function() {
  beforeEach(function(this: CurrentThisContext) {
    this.specHelper.prepareSpec(this.defaultSpecOptions);
    configureI18nLocale(this.assistantJs.container, false);
    createRequestScope(this.specHelper);
    this.stateMachine = this.inversify.get(injectionNames.current.stateMachine);

    this.context = this.inversify.get(injectionNames.current.i18nContext);
    this.context.intent = "testIntent";
    this.context.state = "mainState";

    this.translateHelper = this.inversify.get(injectionNames.current.translateHelper);
  });

  describe("t", function() {
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
              beforeEach(function(this: CurrentThisContext) {
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
        beforeEach(function(this: CurrentThisContext) {
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
              beforeEach(function(this: CurrentThisContext) {
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
      beforeEach(function(this: CurrentThisContext) {
        this.context.state = "notExisting";
      });

      describe("when intent namespace exist", function() {
        describe("when extractor namespace exist", function() {
          describe("when key given", function() {
            it("returns key with embedded extractor", async function() {
              expect(await this.translateHelper.t(".embedded.platformDependent")).toEqual("platform-specific-embedded");
            });

            describe("when device exists in extraction result", function() {
              beforeEach(function(this: CurrentThisContext) {
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

  describe("getAllAlternatives", function() {
    describe("with array syntax", function() {
      it("returns all alternatives as array", async function() {
        expect(await this.translateHelper.getAllAlternatives("getAllAlternatives.withArray")).toEqual(["alternative 1", "alternative 2"]);
      });
    });

    describe("with templating syntax", function() {
      it("returns all alternatives as array", async function() {
        expect(await this.translateHelper.getAllAlternatives("getAllAlternatives.withTemplating")).toEqual(["one", "two"]);
      });
    });

    describe("with mixed syntax", function() {
      it("returns all alternatives as array", async function() {
        expect(await this.translateHelper.getAllAlternatives("getAllAlternatives.withBoth")).toEqual(["alternative 1", "alternative 2", "alternative 3"]);
      });
    });

    describe("with only one entry", function() {
      it("returns this entry as array", async function() {
        expect(await this.translateHelper.getAllAlternatives("getAllAlternatives.withOne")).toEqual(["no other alternatives"]);
      });
    });
  });

  describe("getObject", () => {
    describe("with single string", () => {
      it("returns single translated string", async function() {
        expect(await this.translateHelper.getObject("getObjectState.relativeIntent.withSingleString")).toEqual("only alternative");
      });

      it("interpolates variables", async function() {
        expect(await this.translateHelper.getObject("getObjectState.relativeIntent.withPlaceholder", { number: 4 })).toEqual("alternative 4");
      });

      it("resolve templates", async function() {
        expect(await this.translateHelper.getObject("getObjectState.relativeIntent.withTemplate", { number: 4 })).toEqual(["alternative 1", "alternative 2"]);
      });
    });

    describe("with array", function() {
      it("returns array with all translations", async function() {
        expect(await this.translateHelper.getObject("getObjectState.relativeIntent.withArray")).toEqual(["alternative 1", "alternative 2"]);
      });
    });

    describe("nestedWithArrays", function() {
      it("returns array with all translations", async function() {
        expect(await this.translateHelper.getObject("getObjectState.relativeIntent.nestedWithArrays")).toEqual({
          first: ["alternative 1", "alternative 2"],
          second: ["alternative 3", "alternative 4"],
        });
      });
    });

    describe("nestedWithTemplates", function() {
      it("returns object tree with all translated alternatives", async function() {
        expect(await this.translateHelper.getObject("getObjectState.relativeIntent.nestedWithTemplates", { version: 2 })).toEqual({
          a: {
            meta: {
              version: "2",
            },
            oneAndTwo: ["alternative 1", "alternative 2"],
            threeAndFour: ["alternative 3", "alternative 4"],
          },
        });
      });
    });

    describe("relative resolution", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.context.intent = "relativeIntent";
        this.context.state = "getObjectState";
      });

      it("behaves as above but with relative key", async function() {
        expect(await this.translateHelper.getObject(".nestedWithTemplates", { version: 2 })).toEqual({
          a: {
            meta: {
              version: "2",
            },
            oneAndTwo: ["alternative 1", "alternative 2"],
            threeAndFour: ["alternative 3", "alternative 4"],
          },
        });
      });
    });
  });
});
