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

    describe("when translation does not exist", function() {
      it("throws error", function() {
        expect(() => this.translateHelper.t(".notExisting")).toThrow();
      });
    });

    describe("when state namespace exists", function() {
      describe("when intent namespace exists", function() {
        describe("when extractor namespace exists", function() {
          describe("when key given", function() {
            it("returns translation for '.key'", function() {
              expect(this.translateHelper.t(".key")).toEqual("verySpecific");
            });
          });
        });

        describe("without extractor namespace", function() {
          beforeEach(function() {
            this.context.intent = "yesGenericIntent";
          });

          it("returns correct translation for empty key", function() {
            expect(this.translateHelper.t()).toEqual("yes");
          });
        });
      });

      describe("without intent namesace", function() {
        beforeEach(function() {
          this.context.state = "noIntentState";
        });

        it("returns correct translation for empty key", function() {
          expect(this.translateHelper.t()).toEqual("stateOnly");
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
            it("returns translation for '.key'", function() {
              expect(this.translateHelper.t(".key")).toEqual("root-verySpecific");
            });
          });
        });

        describe("without extractor namespace", function() {
          beforeEach(function() {
            this.context.intent = "yesGenericIntent";
          });

          it("returns correct translation for empty key", function() {
            expect(this.translateHelper.t()).toEqual("root-yes");
          });
        });
      });


      describe("without intent namespace", function() {
        describe("when key given", function() {
          it("returns translation for '.key'", function() {
            expect(this.translateHelper.t(".rootKey")).toEqual("root-veryUnspecific");
          });
        });
      });
    });
  })
});