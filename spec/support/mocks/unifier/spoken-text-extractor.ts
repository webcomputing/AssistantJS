import { injectable } from "inversify";

import { Component } from "../util/component";
import { RequestContext } from "../../../../src/components/root/public-interfaces";
import { RequestExtractor } from "../../../../src/components/unifier/public-interfaces";

@injectable()
export class SpokenTextExtractor implements RequestExtractor {
  component: Component;

  constructor(componentName = "SpokenTextExtractorComponent") {
    this.component = new Component(componentName);
  }
  
  /** Always returns true */
  fits(context: RequestContext) {
    return new Promise<boolean>(resolve => {
      resolve(true);
    });
  }

  /** Returns the whole body as extraction result + a spoken text extraction */
  extract(context: RequestContext) {
    return new Promise<any>(resolve => {
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