import { State } from "../../../../src/components/state-machine/interfaces";
import { BaseState } from "../../../../src/components/state-machine/base-state";
import { ResponseFactory } from "../../../../src/components/unifier/interfaces";
import { TranslateHelper } from "../../../../src/components/i18n/interfaces";
import { injectable, inject, optional } from "inversify";


@injectable()
export class MainState extends BaseState implements State {
  responseFactory: ResponseFactory;
  extraction: any;
  spy?: Function;

  constructor(
    @inject("core:unifier:current-response-factory") responseFactory: ResponseFactory,
    @inject("core:unifier:current-extraction") extraction: any,
    @inject("core:i18n:current-translate-helper") translateHelper: TranslateHelper,
    @optional() @inject("mocks:states:call-spy") spy: Function
  ) {
    super(responseFactory, translateHelper);
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