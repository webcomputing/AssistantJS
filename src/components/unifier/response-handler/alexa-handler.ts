import { BasicAnswerTypes, BasicHandler } from "./basic-handler";
import { BasicHandable } from "./basic-handable";

export interface AlexaSpecificTypes extends BasicAnswerTypes {
  card: {
    title: string;
    description: string;
    commonTest: string;
    alexaSpecific: string;
  };
  list: {
    elements: Array<{ title: string }>;
  };
}

export interface AlexaSpecificHandable {
  addAlexaList(list: AlexaSpecificTypes["list"]): this;
}

export class AlexaSpecificHandler<T extends AlexaSpecificTypes> extends BasicHandler<AlexaSpecificTypes> implements AlexaSpecificHandable {
  public addAlexaList(list: T["list"]): this {
    this.promises.list = {
      resolver: list,
    };
    return this;
  }

  protected sendResults(results: AlexaSpecificTypes): void {
    throw new Error("Method not implemented.");
  }
}
