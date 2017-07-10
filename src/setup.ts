import { Container, MainApplication, ContainerImpl, ComponentDescriptor } from "inversify-components";
import { debug } from "debug";
import { injectable, inject, multiInject } from "inversify";

import * as internalComponents from "./components/index";

export class AssistantJSSetup {
  static log = debug("assistant");
  static globalContainer = new ContainerImpl();

  container: Container;
  configuration: { [componentName: string]: any } = {};

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

  addConfiguration(configuration: { [componentName: string]: any }) {
    this.configuration = Object.assign(this.configuration, configuration);
  }

  configure() {
    if (typeof this.configuration === "undefined") return; 
    Object.keys(this.configuration).forEach(componentName => this.configureComponent(componentName, this.configuration[componentName]));
  }

  configureComponent(componentName: string, configuration: any) {
    this.container.componentRegistry.lookup(componentName).addConfiguration(configuration);
  }

  /** 
   * @param autoConfigure If set to true, calls this.configure() afterwards
   */
  autobind(autoConfigure = true) {
    this.container.componentRegistry.autobind(this.container.inversifyInstance);
    if (autoConfigure) this.configure();
  }
}

/** Short form of AssistantJS.log */
export const log = AssistantJSSetup.log;
