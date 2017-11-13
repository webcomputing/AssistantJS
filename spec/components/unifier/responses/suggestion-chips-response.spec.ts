import { createRequestScope } from "../../../support/util/setup";
import { ResponseFactory } from "../../../../src/components/unifier/response-factory";
import { SuggestionChipsResponse } from "../../../../src/components/unifier/responses/suggestion-chips-response";

describe("SuggestionChipsResponse", function() {
  beforeEach(function() {
    createRequestScope(this.specHelper);
    this.handler = this.container.inversifyInstance.get("core:unifier:current-response-handler");
    this.handler.suggestionChips = null;
    this.chatResponse = new SuggestionChipsResponse(this.handler, false);
  });

  describe("with a handler not supporting suggestion chips", function() {
    it("is not creatable", function() {
      this.handler.suggestionChips = undefined;

      expect(function() {
        new SuggestionChipsResponse(this.handler, false);
      }).toThrow();
    });
  });

  describe("addSuggestionChip", function() {
    it("adds text to the handlers suggestionChips property", function() {
      this.chatResponse.addSuggestionChip("next");
      this.chatResponse.addSuggestionChip("previous");
      expect(this.handler.suggestionChips).toEqual(["next", "previous"]);
    });
  });
});