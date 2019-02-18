import { injectionNames } from "../../../src/assistant-source";
import { I18nContext } from "../../../src/components/i18n/context";
import { StateMachine } from "../../../src/components/state-machine/state-machine";
import { configureI18nLocale } from "../../support/util/i18n-configuration";
import { createRequestScope } from "../../support/util/setup";
import { ThisContext } from "../../this-context";

interface CurrentThisContext extends ThisContext {
  stateMachine: StateMachine;
  context: I18nContext;
}

describe("I18nContext", function() {
  beforeEach(async function(this: CurrentThisContext) {
    configureI18nLocale(this.container, false);
    createRequestScope(this.specHelper);
    this.stateMachine = this.container.inversifyInstance.get(injectionNames.current.stateMachine);
  });

  describe("state machine hook", function() {
    beforeEach(async function(this: CurrentThisContext) {
      await this.stateMachine.handleIntent("test");
    });

    it("fills context automatically", async function(this: CurrentThisContext) {
      const expected = { intent: "testIntent", state: "mainState" };

      this.context = this.container.inversifyInstance.get(injectionNames.current.i18nContext);
      expect(this.context.intent).toEqual(expected.intent);
      expect(this.context.state).toEqual(expected.state);
    });
  });
});
