import { injectable, inject, multiInject } from "inversify";
import { MainApplication, Container } from "ioc-container";

import { container as globalContainer, log } from "./globals";
import * as components from "./components/index";

export const setupContainer = (container: Container = globalContainer) => {
  // Import all local components and services
  log("Imported component descriptors: %O", components);
  Object.keys(components).forEach(k => container.componentRegistry.addFromDescriptor(components[k]));
}

export const autobindContainer = (container: Container = globalContainer) => {
  container.componentRegistry.autobind(container.inversifyInstance);
}

export const run = (app: MainApplication, container: Container = globalContainer) => {
  container.setMainApplication(app);
  container.runMain();
}