import { Container } from "inversify-components";
import { AssistantJSSetup } from "../src/setup";
import { SpecHelper } from "../src/spec-helper";

export interface ThisContext {
  specHelper: SpecHelper;
  assistantJs: AssistantJSSetup;
  container: Container;
}
