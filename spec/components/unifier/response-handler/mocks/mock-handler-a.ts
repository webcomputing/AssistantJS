import { BasicAnswerTypes, BasicHandler } from "../../../../../src/components/unifier/response-handler";

export interface MockHandlerASpecificTypes extends BasicAnswerTypes {
  card: {
    title: string;
    subTitle?: string;
    description: string;
  };
  table: {
    header: string[];
    elements: string[][];
  };
}

export interface MockHandlerASpecificHandable {
  addMockHandlerATable(table: MockHandlerASpecificTypes["table"]): this;
}

export class MockHandlerA<T extends MockHandlerASpecificTypes> extends BasicHandler<MockHandlerASpecificTypes> implements MockHandlerASpecificHandable {
  public addMockHandlerATable(table: T["table"]): this {
    this.promises.table = { resolver: table };
    return this;
  }

  protected sendResults(results: MockHandlerASpecificTypes): void {
    throw new Error("Method not implemented.");
  }
}
