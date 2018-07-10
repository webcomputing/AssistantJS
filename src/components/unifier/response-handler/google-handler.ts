import { BasicHandable, BasicHandler, BasicAnswerTypes } from "./basic-handler";

export interface GoogleSpecificTypes extends BasicAnswerTypes {
  card: {
    title: string;
    description: string;
    commonTest?: string;
    googleSpecific?: string;
  };
  table: {
    header: string[];
    elements: string[][];
  };
}

export interface GoogleSpecificHandable extends BasicHandable<GoogleSpecificTypes> {
  addCard(myCard: GoogleSpecificTypes["card"]): this;
  addSuggestionChips(chips: GoogleSpecificTypes["suggestionChips"]): this;
  addGoogleTable(table: GoogleSpecificTypes["table"]): this;
}

export class GoogleSpecificHandler<T extends GoogleSpecificTypes> extends BasicHandler<GoogleSpecificTypes> implements GoogleSpecificHandable {
  private table: T["table"] | null = null;

  public addGoogleTable(table: T["table"]): this {
    this.table = table;
    return this;
  }

  public getGoogleTable(): T["table"] | null {
    return this.table;
  }
}
