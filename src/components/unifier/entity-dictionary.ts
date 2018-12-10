import * as levenshtein from "fast-levenshtein";
import { inject, injectable } from "inversify";
import { Session } from "../services/public-interfaces";
import { componentInterfaces, LocalesLoader } from "./private-interfaces";
import { EntityDictionary as EntityDictionaryInterface, MinimalRequestExtraction } from "./public-interfaces";

@injectable()
export class EntityDictionary implements EntityDictionaryInterface {
  public store: { [name: string]: any } = {};

  constructor(
    @inject("core:unifier:current-extraction") private extraction: MinimalRequestExtraction,
    @inject(componentInterfaces.localesLoader) private localesLoader: LocalesLoader
  ) {
    this.store = typeof extraction.entities === "undefined" ? {} : { ...extraction.entities };
  }

  public get(name: string): any | undefined {
    // Return undefined instead of null. Uniforms all "missing" results to undefined.
    let value = this.store[name] === null ? undefined : this.store[name];

    const customEntities = this.localesLoader.getCustomEntities()[this.extraction.language];
    if (typeof value === "string" && customEntities !== undefined && customEntities[name] !== undefined) {
      // Try to find the choice of this entity by extraction's value
      const choice = customEntities[name].find(ch => ch.value === value);

      // If not found, try to map synonym to default value
      if (choice === undefined) {
        const valuesByDistance = customEntities[name]
          .reduce<Array<{ value: string; distance: number }>>((agg, ch) => {
            if (!ch.synonyms) {
              return agg;
            }

            const distances = ch.synonyms.map(syn => {
              return { value: syn, distance: levenshtein.get(syn.toLowerCase(), value.toLowerCase()) };
            });

            return [...agg, ...distances];
          }, [])
          .sort((a, b) => a.distance - b.distance);

        value = valuesByDistance[0].value;
      }
    }

    return value;
  }

  public contains(name: string) {
    return typeof this.get(name) !== "undefined";
  }

  public set(name: string, value: any) {
    // Set value to undefined if passed value is null.
    const valueToSet = value === null ? undefined : value;
    this.store[name] = valueToSet;
  }

  public getClosest(name: string, validValues: string[], maxDistance?: number) {
    const entityValue = this.get(name);
    if (typeof entityValue === "undefined") return undefined;

    // Try an exact match for performance reasons
    const exactMatch = validValues.filter(validValue => validValue.toLowerCase() === entityValue.toLowerCase())[0];
    if (typeof exactMatch !== "undefined") return exactMatch;

    // Do levenshtein
    const set = this.getDistanceSet(name, validValues);
    if (typeof set === "undefined") return undefined;

    // Return element of lowest distance, if greater than
    let lowestDistance = set[0];
    set.forEach(entry => {
      if (entry.distance < lowestDistance.distance) lowestDistance = entry;
    });
    return typeof maxDistance === "undefined" || maxDistance >= lowestDistance.distance ? lowestDistance.value : undefined;
  }

  public getDistanceSet(name: string, validValues: string[]) {
    const entityValue = this.get(name);
    if (typeof entityValue === "undefined") return undefined;

    return validValues.map(validValue => {
      return { value: validValue, distance: levenshtein.get(validValue.toLowerCase(), entityValue.toLowerCase()) };
    });
  }

  public async storeToSession(session: Session, storeKey = "__currentEntityStore") {
    return session.set(storeKey, JSON.stringify(this.store));
  }

  public async readFromSession(session: Session, preferCurrentStore = true, storeKey = "__currentEntityStore") {
    const storedData = await session.get(storeKey);
    const storedEntities = typeof storedData === "undefined" ? {} : JSON.parse(storedData);
    this.store = preferCurrentStore ? { ...storedEntities, ...this.store } : { ...this.store, ...storedEntities };
  }
}
