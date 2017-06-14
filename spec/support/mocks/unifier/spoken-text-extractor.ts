import { injectable } from "inversify";

import { Component } from "../util/component";
import { RequestContext } from "../../../../src/components/root/interfaces";
import { RequestConversationExtractor } from "../../../../src/components/unifier/interfaces";

@injectable()
export class SpokenTextExtractor implements RequestConversationExtractor {
  component: Component;

  constructor(componentName = "SpokenTextExtractorComponent") {
    this.component = new Component(componentName);
  }
  
  /** Always returns true */
  fits(context: RequestContext) {
    return new Promise(resolve => {
      resolve(true);
    });
  }

  /** Returns the whole body as extraction result + a spoken text extraction */
  extract(context: RequestContext) {
    return new Promise(resolve => {
      let result = Object.assign({}, context.body);
      result.spokenText = SpokenTextExtractor.spokenTextFill();
      resolve(result);
    });
  }

  /** What to input into spokenText */
  static spokenTextFill() {
    return "My spoken text";
  }
}