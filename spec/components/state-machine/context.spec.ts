import { Container } from "inversify-components";
import { MinimalResponseHandler, SpecSetup, TranslateHelper } from "../../../src/assistant-source";
import { StateMachine } from "../../../src/components/state-machine/state-machine";
import { injectionNames } from "../../../src/injection-names";
import { configureI18nLocale } from "../../support/util/i18n-configuration";
import { createRequestScope } from "../../support/util/setup";

interface CurrentThisContext {
  responseHandler: MinimalResponseHandler;
  specHelper: SpecSetup;
  stateMachine: StateMachine;
  container: Container;
  translateHelper: TranslateHelper;
}

describe("state context decorators", function() {
  beforeEach(async function(this: CurrentThisContext) {
    configureI18nLocale(this.container, false);
    createRequestScope(this.specHelper);
    this.stateMachine = this.container.inversifyInstance.get<StateMachine>("core:state-machine:current-state-machine");
    this.translateHelper = this.container.inversifyInstance.get(injectionNames.current.translateHelper);
    this.responseHandler = this.container.inversifyInstance.get<MinimalResponseHandler>("core:unifier:current-response-handler");
    this.container.inversifyInstance.unbind("core:unifier:current-response-handler");
    this.container.inversifyInstance
      .bind("core:unifier:current-response-handler")
      .toDynamicValue(context => {
        return this.responseHandler;
      })
      .inSingletonScope();
  });
  describe("stayInContext decorator", function() {
    beforeEach(async function(this: CurrentThisContext) {
      await this.stateMachine.transitionTo("ContextAState");
      await this.stateMachine.transitionTo("ContextBState");
    });

    it("uses exampleAIntent of ContextAState", async function(this: CurrentThisContext) {
      await this.stateMachine.handleIntent("exampleAIntent");
      expect(await this.responseHandler.voiceMessage).toBe("exampleAIntent");
    });
  });

  describe("clearContext decorator", function() {});
});
