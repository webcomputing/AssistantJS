import * as levenshtein from "fast-levenshtein";
import { inject, injectable } from "inversify";
import { injectionNames } from "../../injection-names";
import { Session } from "../services/public-interfaces";
import { EntityDictionary as EntityDictionaryInterface, LocalesLoader, MinimalRequestExtraction, PlatformGenerator } from "./public-interfaces";

@injectable()
export class EntityDictionary implements EntityDictionaryInterface {
  public store: { [name: string]: any } = {};

  /** Contains configured custom entities */
  private customEntities: PlatformGenerator.CustomEntityMapping;

  constructor(
    @inject(injectionNames.current.extraction) private extraction: MinimalRequestExtraction,
    @inject(injectionNames.localesLoader) private localesLoader: LocalesLoader
  ) {
    this.store = typeof extraction.entities === "undefined" ? {} : { ...extraction.entities };
    this.customEntities = this.localesLoader.getCustomEntities()[this.extraction.language];
  }

  public get(name: string): any | undefined {
    // Return undefined instead of null. Uniforms all "missing" results to undefined.
    const valueFromStore = this.getRaw(name);

    // If value from store is not undefined and this entity is a custom entity, select the custom entity by levenshtein and return it's reference value
    if (typeof valueFromStore === "string" && typeof this.customEntities !== "undefined" && typeof this.customEntities[name] !== "undefined") {
      return this.getReferenceValueOfCustomEntity(name, valueFromStore);
    }

    return valueFromStore;
  }

  public getRaw(name: string) {
    return this.store[name] === null ? undefined : this.store[name];
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
    return EntityDictionary.getClosestToValue(entityValue, validValues, maxDistance);
  }

  public getDistanceSet(name: string, validValues: string[]) {
    const entityValue = this.get(name);
    return EntityDictionary.getDistanceToValueSet(entityValue, validValues);
  }

  public async storeToSession(session: Session, storeKey = "__currentEntityStore") {
    return session.set(storeKey, JSON.stringify(this.store));
  }

  public async readFromSession(session: Session, preferCurrentStore = true, storeKey = "__currentEntityStore") {
    const storedData = await session.get(storeKey);
    const storedEntities = typeof storedData === "undefined" ? {} : JSON.parse(storedData);
    this.store = preferCurrentStore ? { ...storedEntities, ...this.store } : { ...this.store, ...storedEntities };
  }

  /**
   * Uses levenshtein to select correct custom entity and returns it's reference value
   * @param {string} name Name of custom entity
   * @param {string} valueFromStore Result of this.get(name)
   */
  private getReferenceValueOfCustomEntity(name: string, valueFromStore: string): string | undefined {
    // Try to find the choice of this entity by extraction's value
    const choice = this.customEntities[name].find(ch => ch.value === valueFromStore);

    // If not found, try to map synonym to default value
    if (typeof choice === "undefined") {
      // Use Levenshtein distance to find ref value or synonym that's closest to extracted value
      const allValidValues = ([] as string[]).concat(...this.customEntities[name].map(ch => (ch.synonyms || []).concat(ch.value)));
      const closestSynonym = EntityDictionary.getClosestToValue(valueFromStore, allValidValues);

      if (typeof closestSynonym !== "undefined") {
        // Find entity variation that contains the closest synonym
        const matchedEntity = this.customEntities[name].find(ch => !!closestSynonym && !!ch.synonyms && ch.synonyms.indexOf(closestSynonym) !== -1);

        if (typeof matchedEntity !== "undefined") {
          return matchedEntity.value;
        }
      }

      return undefined;
    }

    return choice.value;
  }

  private static getClosestToValue(entityValue: string, validValues: string[], maxDistance?: number) {
    if (typeof entityValue === "undefined") return undefined;

    // Try an exact match for performance reasons
    const exactMatch = validValues.filter(validValue => validValue.toLowerCase() === entityValue.toLowerCase())[0];
    if (typeof exactMatch !== "undefined") return exactMatch;

    // Do levenshtein
    const set = this.getDistanceToValueSet(entityValue, validValues);
    if (typeof set === "undefined") return undefined;

    // Return element of lowest distance, if greater than
    let lowestDistance = set[0];
    set.forEach(entry => {
      if (entry.distance < lowestDistance.distance) lowestDistance = entry;
    });
    return typeof maxDistance === "undefined" || maxDistance >= lowestDistance.distance ? lowestDistance.value : undefined;
  }

  private static getDistanceToValueSet(entityValue: string, validValues: string[]) {
    if (typeof entityValue === "undefined") return undefined;

    return validValues.map(validValue => {
      return { value: validValue, distance: levenshtein.get(validValue.toLowerCase(), entityValue.toLowerCase()) };
    });
  }
}
