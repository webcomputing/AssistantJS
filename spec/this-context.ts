import { Container } from "inversify-components";
import { SpecSetup } from "../src/spec-setup";

export interface ThisContext {
  specHelper: SpecSetup;
  container: Container;
}
