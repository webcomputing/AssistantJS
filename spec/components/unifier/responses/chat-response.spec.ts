import { ResponseFactory } from "../../../../src/components/unifier/response-factory";
import { ChatResponse } from "../../../../src/components/unifier/responses/chat-response";
import { createRequestScope } from "../../../support/util/setup";

describe("ChatResponse", function() {
  beforeEach(function() {
    createRequestScope(this.specHelper);
    this.handler = this.container.inversifyInstance.get("core:unifier:current-response-handler");
    this.logger = this.container.inversifyInstance.get("core:root:current-logger");

    this.handler.chatBubbles = null;
    this.chatResponse = new ChatResponse(this.handler, false, this.logger);
  });

  describe("with a handler not supporting cards", function() {
    it("is not creatable", function() {
      this.handler.chatBubbles = undefined;

      expect(function() {
        new ChatResponse(this.handler, false, this.logger);
      }).toThrow();
    });
  });

  describe("addChatBubble", function() {
    it("adds text to the handlers chatBubbles property", function() {
      this.chatResponse.addChatBubble("My first bubble");
      this.chatResponse.addChatBubble("My second bubble");
      expect(this.handler.chatBubbles).toEqual(["My first bubble", "My second bubble"]);
    });
  });
});
