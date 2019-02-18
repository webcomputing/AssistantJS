import { injectable } from "inversify";

import { RequestContext } from "../../../../src/components/root/public-interfaces";
import { RequestExtractor } from "../../../../src/components/unifier/public-interfaces";
import { Component } from "../util/component";

@injectable()
export class SpokenTextExtractor implements RequestExtractor {
  public component: Component;

  constructor(componentName = "SpokenTextExtractorComponent") {
    this.component = new Component(componentName);
  }

  /** Always returns true */
  public fits(context: RequestContext) {
    return new Promise<boolean>(resolve => {
      resolve(true);
    });
  }

  /** Returns the whole body as extraction result + a spoken text extraction */
  public extract(context: RequestContext) {
    return new Promise<any>(resolve => {
      const result = {...context.body};
      result.spokenText = SpokenTextExtractor.spokenTextFill();
      resolve(result);
    });
  }

  /** What to input into spokenText */
  public static spokenTextFill() {
    return "My spoken text";
  }
}
