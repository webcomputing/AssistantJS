import { Container } from "inversify-components";
import { SpecHelper } from "../src/spec-helper";

export interface ThisContext {
  specHelper: SpecHelper;
  container: Container;
}
