import { ResponseFactory } from "../../../../src/components/unifier/response-factory";
import { SuggestionChipsResponse } from "../../../../src/components/unifier/responses/suggestion-chips-response";
import { createRequestScope } from "../../../support/util/setup";

describe("SuggestionChipsResponse", function() {
  beforeEach(function() {
    createRequestScope(this.specHelper);
    this.handler = this.container.inversifyInstance.get("core:unifier:current-response-handler");
    this.handler.suggestionChips = null;
    this.logger = this.container.inversifyInstance.get("core:root:current-logger");

    this.chatResponse = new SuggestionChipsResponse(this.handler, false, this.logger);
  });

  describe("with a handler not supporting suggestion chips", function() {
    it("is not creatable", function() {
      this.handler.suggestionChips = undefined;

      expect(function() {
        new SuggestionChipsResponse(this.handler, false, this.logger);
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
