import { inject, injectable, optional } from "inversify";
import { TranslateHelper } from "../../../../src/components/i18n/public-interfaces";
import { Logger } from "../../../../src/components/root/public-interfaces";
import { BaseState } from "../../../../src/components/state-machine/base-state";
import { State } from "../../../../src/components/state-machine/public-interfaces";
import { injectionNames } from "../../../../src/injection-names";
import { MockHandlerA, MockHandlerASpecificTypes } from "../unifier/response-handler/mock-handler-a";

@injectable()
export class MainState extends BaseState<MockHandlerASpecificTypes, MockHandlerA<MockHandlerASpecificTypes>> implements State.Required {
  public extraction: any;
  public spy?: (...args: any[]) => void;

  constructor(
    @inject(injectionNames.current.responseHandler) responseHandler: MockHandlerA<MockHandlerASpecificTypes>,
    @inject(injectionNames.current.extraction) extraction: any,
    @inject(injectionNames.current.translateHelper) translateHelper: TranslateHelper,
    @inject(injectionNames.current.logger) logger: Logger,
    @optional()
    @inject("mocks:states:call-spy")
    spy: (...args: any[]) => void
  ) {
    super(responseHandler, translateHelper, extraction, logger);
    this.extraction = extraction;
    this.spy = spy;
  }

  public async unhandledGenericIntent(...args: any[]) {
    this.spyIfExistent("unhandled", ...args);
  }

  public testIntent(...args: any[]) {
    this.spyIfExistent("test", ...args);
  }

  public answerIntent(...args: any[]) {
    this.spyIfExistent("answer", ...args);
    this.responseHandler.endSessionWith(this.extraction.message);
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
