import { injectable } from "inversify";

import { Component } from "../util/component";
import { RequestContext } from "../../../../src/components/root/public-interfaces";
import { RequestExtractor } from "../../../../src/components/unifier/public-interfaces";

@injectable()
export class MockExtractor implements RequestExtractor {
  component: Component;

  constructor(componentName = "MockExtractorComponent") {
    this.component = new Component(componentName);
  }

  /** Returns true if path == "/fitting_path" */
  fits(context: RequestContext): Promise<boolean> {
    return new Promise(resolve => {
      resolve(context.path === MockExtractor.fittingPath());
    });
  }

  /** Returns the whole body as extraction result */
  extract(context: RequestContext): Promise<any> {
    return new Promise(resolve => {
      resolve(context.body);
    });
  }

  /** Returns the path needed for a fitting request */
  static fittingPath(): string {
    return "/fitting_path";
  }
}
