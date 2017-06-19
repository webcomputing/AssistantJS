import { injectable, inject } from "inversify";
import { MinimalRequestExtraction, EntityDictionary as EntityDictionaryInterface } from "./interfaces";

@injectable()
export class EntityDictionary implements EntityDictionaryInterface {
  store: {[name: string]: any} = {};

  constructor(@inject("core:unifier:current-extraction") extraction: MinimalRequestExtraction) {
    this.store = typeof extraction.entities === "undefined" ? {} : extraction.entities;
  }

  get(name: string): any | undefined {
    return this.store[name];
  }

  contains(name: string) {
    return typeof(this.get(name)) !== "undefined";
  }

  set(name: string, value: any) {
    this.store[name] = value;
  }
}