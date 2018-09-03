import { Entity, CustomEntity } from "./public-interfaces";

/**
 * Maps the entitý name to their specific types
 * @param entity
 */
export function mapEntity(entity: { [type: string]: string[] | CustomEntity | Entity }) {
  const result = {};
  Object.keys(entity).forEach(type => {
    const currEntity = entity[type];
    if (currEntity instanceof Array) {
      currEntity.forEach(parameter => {
        result[parameter] = type;
      });
    } else {
      currEntity.names.forEach(name => {
        result[name] = type;
      });
    }
    // Add type as possible parameter, for answer prompt
    result[type] = type;
  });
  return result;
}
