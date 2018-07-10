import { BasicHandable, BasicHandler, BasicAnswerTypes } from "./basic-handler";

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

export interface AlexaSpecificHandable extends BasicHandable<AlexaSpecificTypes> {
  addCard(myCard: AlexaSpecificTypes["card"]): this;
  addSuggestionChips(chips: AlexaSpecificTypes["suggestionChips"]): this;
  addAlexaList(list: AlexaSpecificTypes["list"]): this;
}

export class AlexaSpecificHandler<T extends AlexaSpecificTypes> extends BasicHandler<AlexaSpecificTypes> implements AlexaSpecificHandable {
  private list: T["list"] | null = null;

  public addAlexaList(list: T["list"]): this {
    this.list = list;
    return this;
  }

  public getAlexaList(): T["list"] | null {
    return this.list;
  }
}
