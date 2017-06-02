import { injectable } from "inversify";

import { Component } from "../util/component";
import { RequestContext } from "../../../../src/components/root/interfaces";
import { RequestConversationExtractor } from "../../../../src/components/unifier/interfaces";

@injectable()
export class MockExtractor implements RequestConversationExtractor {
  component: Component;

  constructor(componentName = "MockExtractorComponent") {
    this.component = new Component(componentName);
  }
  
  /** Returns true if path == "/fitting_path" */
  fits(context: RequestContext) {
    return new Promise(resolve => {
      resolve(context.path === MockExtractor.fittingPath());
    });
  }

  /** Returns the whole body as extraction result */
  extract(context: RequestContext) {
    return new Promise(resolve => {
      resolve(context.body);
    });
  }

  /** Returns the path needed for a fitting request */
  static fittingPath(): string {
    return "/fitting_path";
  }
}