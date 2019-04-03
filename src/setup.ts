import { ComponentDescriptor, Container, ContainerImpl, MainApplication } from "inversify-components";
import * as internalComponents from "./components";

export class AssistantJSSetup {
  public configuration: { [componentName: string]: any } = {};

  constructor(public container: Container = new ContainerImpl()) {
    this.container = container;
  }

  public run(app: MainApplication) {
    this.container.setMainApplication(app);
    return this.container.runMain();
  }

  /** Returns true if internal components have already been registered */
  public allInternalComponentsAreRegistered() {
    return Object.keys(internalComponents).filter(k => !this.container.componentRegistry.isRegistered(internalComponents[k].name)).length === 0;
  }

  public registerInternalComponents() {
    Object.keys(internalComponents).forEach(k => this.registerComponent(internalComponents[k]));
  }

  public registerComponent(component: ComponentDescriptor) {
    this.registerComponents([component]);
  }

  public registerComponents(components: ComponentDescriptor[] | { [name: string]: ComponentDescriptor }) {
    components = typeof components === "object" ? Object.keys(components).map(k => components[k]) : components;

    components.forEach(component => this.container.componentRegistry.addFromDescriptor(component));
  }

  public addConfiguration(configuration: { [componentName: string]: any }) {
    this.configuration = { ...this.configuration, ...configuration };
  }

  public configure() {
    if (typeof this.configuration === "undefined") return;
    Object.keys(this.configuration).forEach(componentName => this.configureComponent(componentName, this.configuration[componentName]));
  }

  public configureComponent<ComponentConfiguration = {}>(componentName: string, configuration: ComponentConfiguration) {
    this.container.componentRegistry.lookup(componentName).addConfiguration(configuration);
  }

  /**
   * @param autoConfigure If set to true, calls this.configure() afterwards
   * @param {string[]} [except] Optionally give list of components to except from autobind
   */
  public autobind(autoConfigure = true, except: string[] = []) {
    this.container.componentRegistry.autobind(this.container.inversifyInstance, except);
    if (autoConfigure) this.configure();
  }
}
