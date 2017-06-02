import { Component as ComponentI, InterfaceDescriptor } from "ioc-container";

export class Component implements ComponentI {
  readonly name: string;
  readonly interfaces: InterfaceDescriptor;
  private _configuration: {};

  get configuration() {
    return this._configuration;
  }

  constructor(name: string, interfaces: InterfaceDescriptor = {}, configuration = {}) {
    this.name = name;
    this.interfaces = interfaces;
    this._configuration = configuration;
  }

  getInterface(name: string) {
    if (!this.interfaces.hasOwnProperty(name)) {
      throw new Error("Component " + this.name + " does not offer interface symbol " + name);
    }

    return this.interfaces[name];
  }

  addConfiguration(c: {}) {
    this._configuration = Object.assign(this._configuration, c);
  }
}