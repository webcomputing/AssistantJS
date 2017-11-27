import { createRequestScope } from "../../support/util/setup";
import { configureI18nLocale } from "../../support/util/i18n-configuration";

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

    it("supports explicit keys", function() {
      expect(this.translateHelper.t("mySpecificKeys.keyOne")).toEqual("keyOneResult");
    });

    it("returns a sample of multiple possible values", function() {
      expect(["a", "b"]).toContain(this.translateHelper.t("multiple"));
    });

    it("replaces locals in translation", function() {
      expect(this.translateHelper.t("var", { var: "b" })).toEqual("ab");
    });

    it("supports template syntax", function() {
      expect([
        "Can I help you, Sir?",
        "May I help you, Sir?",
        "Would you like me to help you?"
      ]).toContain(this.translateHelper.t("templateSyntax", { var: "Sir" }));
    });

    describe("when translation does not exist", function() {
      it("throws error", function() {
        expect(() => this.translateHelper.t(".notExisting")).toThrow();
      });
    });

    describe("when state namespace exists", function() {
      describe("when intent namespace exists", function() {
        describe("when extractor namespace exists", function() {
          describe("when key given", function() {
            it("returns translation for '.embedded.platformDependent'", function() {
              expect(this.translateHelper.t(".embedded.platformDependent")).toEqual("platform-specific-sub-key");
            });
          });

          describe("when key is not given", function() {
            it('returns platform-specific translation for intent', function() {
              this.context.intent = 'platformSpecificIntent';
              expect(this.translateHelper.t()).toEqual("platform-specific-intent");
            });
          });
        });

        describe("without extractor namespace", function() {
          describe("when key is not given", function() {
            it("returns intent-only translation", function() {
              this.context.intent = "yesGenericIntent";
              expect(this.translateHelper.t()).toEqual("yes");
            });
          });

          describe("when key is given", function() {
            it("returns key specific intent translation", function() {
              expect(this.translateHelper.t(".embedded.test")).toEqual("very-specific-without-extractor");
            });
          });
        });
      });

      describe("without intent namespace", function() {
        beforeEach(function() {
          this.context.intent = "notExisting";
        });

        it("returns correct translation for empty key", function() {
          this.context.state = "noIntentState";
          expect(this.translateHelper.t()).toEqual("stateOnly");
        });

        describe("with extractor given", function() {
          describe("with key given", function() {
            it("returns platform specific translation for key", function() {
              expect(this.translateHelper.t(".platformDependent")).toEqual("platform-specific-embedded-state-only");
            });
          });

          describe("with key not given", function() {
            it("returns platform specific translation on state level", function() {
              expect(this.translateHelper.t()).toEqual("platform-specific-main-state-only");
            });
          });
        });

        describe("without extractor", function() {
          describe("with key given", function() {
            it("returns platform specific translation for key", function() {
              expect(this.translateHelper.t(".platformIndependent")).toEqual("platform-independent-main-state");
            });
          });

          describe("with key not given", function() {
            it("returns platform specific translation on state level", function() {
              expect(this.translateHelper.t()).toEqual("platform-specific-main-state-only");
            });
          });
        });
      });
    });


    describe("when state namespace does not eixst", function() {
      beforeEach(function() {
        this.context.state = "notExisting";
      })

      describe("when intent namespace exist", function() {
        describe("when extractor namespace exist", function() {
          describe("when key given", function() {
            it("returns key with embedded extractor", function() {
              expect(this.translateHelper.t(".embedded.platformDependent")).toEqual("platform-specific-embedded");
            });
          });

          describe("when key is not given", function() {
            it('returns platform-specific translation for intent', function() {
              this.context.intent = 'secondPlatformSpecificIntent';
              expect(this.translateHelper.t()).toEqual("root-platform-specific-intent");
            });
          });
        });

        describe("without extractor namespace", function() {
          describe("with key given", function() {
            it("returns platform-independent translation for intent+key", function() {
              expect(this.translateHelper.t(".withoutExtractor")).toEqual("root-without-extractor");
            });
          });

          it("returns correct translation for empty key", function() {
            this.context.intent = "yesGenericIntent";
            expect(this.translateHelper.t()).toEqual("root-yes");
          });
        });
      });


      describe("without intent namespace", function() {
        describe("with extractor existing", function() {
          describe("when key given", function() {
            it("returns platform-specific translation for '.key'", function() {
              expect(this.translateHelper.t(".rootKey")).toEqual("platform-specific-root-only");
            });
          });
        });

        describe("with extractor existing", function() {
          it("returns platform specific translation on state level", function() {
            expect(this.translateHelper.t()).toEqual("root-only-platform-given");
          })
        });
      });
    });
  })
});