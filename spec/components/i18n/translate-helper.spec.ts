import { createRequestScope } from "../../support/util/setup";
import { configureI18nLocale } from "../../support/util/i18n-configuration";

describe("TranslateHelper", function() {
  beforeEach(function() {
    configureI18nLocale(this.container, false);

    createRequestScope(this.assistantJs);
    this.stateMachine = this.container.inversifyInstance.get("core:state-machine:current-state-machine");
  });

  describe("t", function() {
    beforeEach(async function(done) {
      await this.stateMachine.handleIntent("test");

      this.translateHelper = this.container.inversifyInstance.get("core:i18n:current-helper");
      done();
    });

    it("supports explicit keys", function() {
      expect(this.translateHelper.t("mySpecificKeys.keyOne")).toEqual("keyOneResult");
    });
  })
});