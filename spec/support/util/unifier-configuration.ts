import * as i18next from "i18next";
import { Container } from "inversify-components";
import { UnifierConfiguration } from "../../../src/assistant-source";

export function configureUnifier(container: Container, utterancePath: string) {
  const config: UnifierConfiguration = {
    utterancePath,
  };

  container.componentRegistry.lookup("core:unifier").addConfiguration(config);
}
