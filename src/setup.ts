import { Container, MainApplication, ContainerImpl, ComponentDescriptor } from "ioc-container";
import { debug } from "debug";
import { injectable, inject, multiInject } from "inversify";

import * as internalComponents from "./components/index";

export class AssistantJSSetup {
  static log = debug("assistant");
  static globalContainer = new ContainerImpl();

  container: Container;

  constructor(container: Container = AssistantJSSetup.globalContainer) {
    this.container = container;
  }

  run(app: MainApplication) {
    this.container.setMainApplication(app);
    this.container.runMain();
  }

  registerInternalComponents() {
    Object.keys(internalComponents).forEach(k => this.registerComponent(internalComponents[k]));
  }

  registerComponent(component: ComponentDescriptor) {
    this.registerComponents([component]);
  }

  registerComponents(components: ComponentDescriptor[] | {[name: string]: ComponentDescriptor}) {
    AssistantJSSetup.log("Importing component descriptors: %O", components);
    components = typeof components === "object" ? Object.keys(components).map(k => components[k]) : components;

    components.forEach(component => this.container.componentRegistry.addFromDescriptor(component));
  }

  autobind() {
    this.container.componentRegistry.autobind(this.container.inversifyInstance);
  }
}

/** Short form of AssistantJS.log */
export const log = AssistantJSSetup.log;
