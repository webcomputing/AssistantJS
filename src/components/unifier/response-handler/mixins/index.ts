export { AuthenticationMixin } from "./authentication";
export { CardMixin } from "./card";
export { ChatBubblesMixin } from "./chat-bubbles";
export { RepromptsMixin } from "./reprompts";
export { SessionDataMixin } from "./session-data";
export { SuggestionChipsMixin } from "./suggestion-chips";

export function applyMixin(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach(baseCtor => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
      derivedCtor.prototype[name] = baseCtor.prototype[name];
    });
  });
}
