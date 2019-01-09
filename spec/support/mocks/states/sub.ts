import { inject, injectable, optional } from "inversify";
import { Logger } from "../../../../src/components/root/public-interfaces";
import { BasicHandable } from "../../../../src/components/unifier/response-handler";
import { injectionNames } from "../../../../src/injection-names";
import { MockHandlerA, MockHandlerASpecificTypes } from "../unifier/response-handler/mock-handler-a";
import { MainState } from "./main";

@injectable()
export class SubState extends MainState {
  constructor(
    @inject(injectionNames.current.responseHandler) responseHandler: MockHandlerA<MockHandlerASpecificTypes>,
    @inject(injectionNames.current.extraction) extraction: any,
    @inject(injectionNames.current.translateHelper) tHelper: any,
    @inject(injectionNames.current.logger) logger: Logger,
    @optional()
    @inject("mocks:states:call-spy")
    spy: (...args: any[]) => void
  ) {
    super(responseHandler, extraction, tHelper, logger, spy);
  }

  public helpGenericIntent(...args: any[]) {
    this.spyIfExistent("help", ...args);
  }
}
