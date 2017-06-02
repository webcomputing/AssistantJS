import { injectable, inject, multiInject } from "inversify";
import { MainApplication } from "ioc-container";

import { container, log } from "./globals";
import * as components from "./components/index";

// Import all local components and services
log("Imported component descriptors: %O", components);
Object.keys(components).forEach(k => container.componentRegistry.addFromDescriptor(components[k]));

export let run = (app: MainApplication) => {
  container.componentRegistry.autobind(container.inversifyInstance);
  container.setMainApplication(app);
  container.runMain();
}