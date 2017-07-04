import { injectable, inject } from "inversify";
import { MinimalRequestExtraction, EntityDictionary as EntityDictionaryInterface } from "./interfaces";
import { Session } from "../services/interfaces";

@injectable()
export class EntityDictionary implements EntityDictionaryInterface {
  store: {[name: string]: any} = {};

  constructor(@inject("core:unifier:current-extraction") extraction: MinimalRequestExtraction) {
    this.store = typeof extraction.entities === "undefined" ? {} : Object.assign({}, extraction.entities);
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

  async storeToSession(session: Session, storeKey = "__currentEntityStore") {
    return session.set(storeKey, JSON.stringify(this.store));
  }

  async readFromSession(session: Session, preferCurrentStore = true, storeKey = "__currentEntityStore") {
    let storedData = await session.get(storeKey);
    let storedEntities = storedData === null ? {} : JSON.parse(storedData);

    if (preferCurrentStore) {
      this.store = Object.assign(storedEntities, this.store);
    } else {
      this.store = Object.assign(this.store, storedEntities);
    }
  }
}