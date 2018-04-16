import { inject, injectable, optional } from "inversify";
import { TranslateHelper } from "../../../../src/components/i18n/public-interfaces";
import { Logger } from "../../../../src/components/root/public-interfaces";
import { BaseState } from "../../../../src/components/state-machine/base-state";
import { State } from "../../../../src/components/state-machine/public-interfaces";
import { ResponseFactory } from "../../../../src/components/unifier/public-interfaces";

@injectable()
export class MainState extends BaseState implements State.Required {
  public responseFactory: ResponseFactory;
  public extraction: any;
  public spy?: Function;

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

  public unhandledGenericIntent(...args: any[]) {
    this.spyIfExistent("unhandled", ...args);
  }

  public testIntent(...args: any[]) {
    this.spyIfExistent("test", ...args);
  }

  public answerIntent(...args: any[]) {
    this.spyIfExistent("answer", ...args);
    this.responseFactory.createSimpleVoiceResponse().endSessionWith(this.extraction.message);
  }

  public otherIntent(...args: any[]) {
    this.spyIfExistent("other", ...args);
  }

  public yesGenericIntent(...args: any[]) {
    this.spyIfExistent("yes", ...args);
  }

  public errorIntent(...args: any[]) {
    this.spyIfExistent("error", ...args);
    throw new Error("Error!");
  }

  public errorFallback(...args: any[]) {
    this.spyIfExistent("errorFallback", ...args);
  }

  protected spyIfExistent(methodName: string, ...args: any[]) {
    if (typeof this.spy !== "undefined") {
      this.spy(this, methodName, ...args);
    }
  }
}
