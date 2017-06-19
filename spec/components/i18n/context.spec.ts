import { createRequestScope } from "../../support/util/setup";

describe("I18nContext", function() {
  beforeEach(function() {
    createRequestScope(this.specHelper);
    this.stateMachine = this.container.inversifyInstance.get("core:state-machine:current-state-machine");
  });

  describe("state machine hook", function() {
    beforeEach(async function(done) {
      await this.stateMachine.handleIntent("test");
      done();
    });

    it("fills context automatically", function() {
      const expected = { intent: "testIntent", state: "mainState" };

      this.context = this.container.inversifyInstance.get("core:i18n:current-context");
      expect(this.context.intent).toEqual(expected.intent);
      expect(this.context.state).toEqual(expected.state);
    })
  })
});