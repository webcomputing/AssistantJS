import { injectionNames } from "../../../src/assistant-source";
import { configureI18nLocale } from "../../support/util/i18n-configuration";
import { createRequestScope } from "../../support/util/setup";

describe("I18nContext", function() {
  beforeEach(function() {
    configureI18nLocale(this.container, false);
    createRequestScope(this.specHelper);
    this.stateMachine = this.container.inversifyInstance.get(injectionNames.current.stateMachine);
  });

  describe("state machine hook", function() {
    beforeEach(async function() {
      await this.stateMachine.handleIntent("test");
    });

    fit("fills context automatically", function() {
      const expected = { intent: "testIntent", state: "mainState" };

      this.context = this.container.inversifyInstance.get("core:i18n:current-context");
      expect(this.context.intent).toEqual(expected.intent);
      expect(this.context.state).toEqual(expected.state);
    });
  });
});
