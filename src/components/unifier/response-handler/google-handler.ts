import { BasicAnswerTypes, BasicHandler } from "./basic-handler";
import { BasicHandable } from "./basic-handable";

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

export interface GoogleSpecificHandable {
  addGoogleTable(table: GoogleSpecificTypes["table"]): this;
}

export class GoogleSpecificHandler<T extends GoogleSpecificTypes> extends BasicHandler<GoogleSpecificTypes> implements GoogleSpecificHandable {
  public addGoogleTable(table: T["table"]): this {
    this.promises.table = { resolver: table };
    return this;
  }

  protected sendResults(results: GoogleSpecificTypes): void {
    throw new Error("Method not implemented.");
  }
}
