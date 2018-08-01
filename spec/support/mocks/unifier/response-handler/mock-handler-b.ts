import { inject, injectable } from "inversify";
import { MinimalRequestExtraction } from "../../../../../src/assistant-source";
import { RequestContext } from "../../../../../src/components/root/public-interfaces";
import { BasicHandler } from "../../../../../src/components/unifier/response-handler";
import { BasicAnswerTypes, BasicHandable, ResponseHandlerExtensions } from "../../../../../src/components/unifier/response-handler/handler-types";
import { injectionNames } from "../../../../../src/injection-names";

export interface MockHandlerBSpecificTypes extends BasicAnswerTypes {
  card: {
    title: string;
    description: string;
  };
  list: {
    elements: Array<{ title: string }>;
  };
}

export interface MockHandlerBSpecificHandable<MergedAnswerTypes extends MockHandlerBSpecificTypes> extends BasicHandable<MergedAnswerTypes> {
  setMockHandlerBList(list: MergedAnswerTypes["list"]): this;
}

@injectable()
export class MockHandlerB<MergedAnswerTypes extends MockHandlerBSpecificTypes> extends BasicHandler<MergedAnswerTypes>
  implements MockHandlerBSpecificHandable<MergedAnswerTypes> {
  constructor(
    @inject(injectionNames.current.requestContext) requestContext: RequestContext,
    @inject(injectionNames.current.extraction) extraction: MinimalRequestExtraction,
    @inject(injectionNames.current.killSessionService) killSession: () => Promise<void>,
    @inject(injectionNames.current.responseHandlerExtensions)
    responseHandlerExtensions: ResponseHandlerExtensions<MergedAnswerTypes, MockHandlerB<MergedAnswerTypes>>
  ) {
    super(requestContext, extraction, killSession, responseHandlerExtensions);
  }

  public setMockHandlerBList(list: MergedAnswerTypes["list"]): this {
    this.promises.list = { resolver: list };
    return this;
  }

  protected getBody(results: Partial<MockHandlerBSpecificTypes>): void {
    // do nothing here
  }
}
