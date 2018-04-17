import { Component as ComponentI, InterfaceDescriptor } from "inversify-components";

export class Component implements ComponentI {
  public readonly name: string;
  public readonly interfaces: InterfaceDescriptor;
  private _configuration: {};

  get configuration() {
    return this._configuration;
  }

  constructor(name: string, interfaces: InterfaceDescriptor = {}, configuration = {}) {
    this.name = name;
    this.interfaces = interfaces;
    this._configuration = configuration;
  }

  public getInterface(name: string) {
    if (!this.interfaces.hasOwnProperty(name)) {
      throw new Error("Component " + this.name + " does not offer interface symbol " + name);
    }

    return this.interfaces[name];
  }

  public addConfiguration(c: {}) {
    this._configuration = {...this._configuration, ...c};
  }
}
