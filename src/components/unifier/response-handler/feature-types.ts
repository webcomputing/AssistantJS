/**
 * In addition to the basic features every response handler has to support (see MinimalResponseHandler),
 * every response handler may also support a subset of these features
 */
export namespace HandlerFeatureTypes {
  /**
   * If implemented, a response handler is able to inform the assistant about a missing oauth token
   * If set to true, the assistant will be informed about a missing oauth token
   */
  export type ForceAuthentication = boolean;

  /** If implemented, a response handler is able to parse SSML voice message, If set to true, this voice message is in SSML format */
  export type SSML = boolean;

  /** If implemented, the response handler's platform supports reprompts, Reprompts for the current voice message */
  export type Reprompt = string[];

  /** If used, the response handler's platform supports storing of session data, Blob of all session data to set */
  export type SessionData = string;

  export namespace GUI {
    export namespace Card {
      /** Minimal Interface to represent a simple Card */
      export interface Simple {
        /** The card's title */
        title: string;

        /** The card's body */
        description: string;
      }

      /* Interface to represent a Card with Image */
      export interface Image {
        /** The image to display in the card */
        cardImage: string;
      }
    }

    /** Minimal Interface to represent SuggestionChips */
    export type SuggestionChips = Array<{ displayText: string; spokenText: string }>;

    /** Minimal Interface to represent ChatBubbles, an array containing all chat messages / chat bubbles to display */
    export type ChatBubbles = string[];
  }
}
