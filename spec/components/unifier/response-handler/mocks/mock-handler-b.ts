import { BasicAnswerTypes, BasicHandler } from "../../../../../src/components/unifier/response-handler";

export interface MockHandlerBSpecificTypes extends BasicAnswerTypes {
  card: {
    title: string;
    description: string;
  };
  list: {
    elements: Array<{ title: string }>;
  };
}

export interface MockHandlerBSpecificHandable {
  addMockHandlerBList(list: MockHandlerBSpecificTypes["list"]): this;
}

export class MockHandlerB<T extends MockHandlerBSpecificTypes> extends BasicHandler<MockHandlerBSpecificTypes> implements MockHandlerBSpecificHandable {
  public addMockHandlerBList(list: T["list"]): this {
    this.promises.list = {
      resolver: list,
    };
    return this;
  }

  protected sendResults(results: MockHandlerBSpecificTypes): void {
    throw new Error("Method not implemented.");
  }
}
