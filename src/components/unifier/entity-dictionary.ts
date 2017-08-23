import { injectable, inject } from "inversify";
import { MinimalRequestExtraction, EntityDictionary as EntityDictionaryInterface } from "./interfaces";
import { Session } from "../services/interfaces";
import * as levenshtein from "fast-levenshtein";

@injectable()
export class EntityDictionary implements EntityDictionaryInterface {
  store: {[name: string]: any} = {};

  constructor(@inject("core:unifier:current-extraction") extraction: MinimalRequestExtraction) {
    this.store = typeof extraction.entities === "undefined" ? {} : Object.assign({}, extraction.entities);
  }

  get(name: string): any | undefined {
    // Return undefined instead of null. Uniforms all "missing" results to undefined.
    return this.store[name] === null ? undefined : this.store[name];
  }

  contains(name: string) {
    return typeof(this.get(name)) !== "undefined";
  }

  set(name: string, value: any) {
    // Set value to undefined if passed value is null. 
    value = value === null ? undefined : value;

    this.store[name] = value;
  }

  getClosest(name: string, validValues: string[], maxDistance?: number) {
    let entityValue = this.get(name);
    if (typeof entityValue === "undefined") return undefined;
    
    // Try an exact match for performance reasons
    let exactMatch = validValues.filter(validValue => validValue === entityValue)[0];
    if (typeof exactMatch !== "undefined") return exactMatch;

    // Do levenshtein
    let set = this.getDistanceSet(name, validValues);
    if (typeof set === "undefined") return undefined;

    // Return element of lowest distance, if greater than 
    let lowestDistance = set[0];
    set.forEach(entry => {
      if (entry.distance < lowestDistance.distance)
        lowestDistance = entry;
    });
    return typeof maxDistance === "undefined" || maxDistance >= lowestDistance.distance ? lowestDistance.value : undefined;
  }

  getDistanceSet(name: string, validValues: string[]) {
    let entityValue = this.get(name);
    if (typeof entityValue === "undefined") return undefined;

    return validValues.map(validValue => {
      return { value: validValue, distance: levenshtein.get(validValue, entityValue) };
    });
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