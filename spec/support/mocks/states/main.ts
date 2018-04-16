import { State } from "../../../../src/components/state-machine/public-interfaces";
import { BaseState } from "../../../../src/components/state-machine/base-state";
import { Logger } from "../../../../src/components/root/public-interfaces";
import { ResponseFactory } from "../../../../src/components/unifier/public-interfaces";
import { TranslateHelper } from "../../../../src/components/i18n/public-interfaces";
import { injectable, inject, optional } from "inversify";

@injectable()
export class MainState extends BaseState implements State.Required {
  responseFactory: ResponseFactory;
  extraction: any;
  spy?: Function;

  constructor(
    @inject("core:unifier:current-response-factory") responseFactory: ResponseFactory,
    @inject("core:unifier:current-extraction") extraction: any,
    @inject("core:i18n:current-translate-helper") translateHelper: TranslateHelper,
    @inject("core:root:current-logger") logger: Logger,
    @optional()
    @inject("mocks:states:call-spy")
    spy: Function
  ) {
    super(responseFactory, translateHelper, extraction, logger);
    this.extraction = extraction;
    this.spy = spy;
    this.responseFactory = responseFactory;
  }

  unhandledGenericIntent(...args: any[]) {
    this.spyIfExistent("unhandled", ...args);
  }

  testIntent(...args: any[]) {
    this.spyIfExistent("test", ...args);
  }

  answerIntent(...args: any[]) {
    this.spyIfExistent("answer", ...args);
    this.responseFactory.createSimpleVoiceResponse().endSessionWith(this.extraction.message);
  }

  otherIntent(...args: any[]) {
    this.spyIfExistent("other", ...args);
  }

  yesGenericIntent(...args: any[]) {
    this.spyIfExistent("yes", ...args);
  }

  errorIntent(...args: any[]) {
    this.spyIfExistent("error", ...args);
    throw new Error("Error!");
  }

  errorFallback(...args: any[]) {
    this.spyIfExistent("errorFallback", ...args);
  }

  protected spyIfExistent(methodName: string, ...args: any[]) {
    if (typeof this.spy !== "undefined") {
      this.spy(this, methodName, ...args);
    }
  }
}
