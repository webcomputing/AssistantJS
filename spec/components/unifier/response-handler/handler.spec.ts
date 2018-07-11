import { Container } from "inversify";
import { MockHandlerA, MockHandlerASpecificTypes } from "./mocks/mock-handler-a";
import { MockHandlerBSpecificTypes } from "./mocks/mock-handler-b";

type CurrentHandler = MockHandlerA<MockHandlerASpecificTypes>;

interface CurrentThisContext {
  specHelper;
  assistantJs;
  container: Container;
  handlerInstance: CurrentHandler & { sendResults: () => void };

  mockCard: MockHandlerASpecificTypes["card"];
  mockChatBubbles: MockHandlerASpecificTypes["chatBubbles"];
  mockPrompt: MockHandlerASpecificTypes["prompt"]["text"];
  mockSSMLPrompt: MockHandlerASpecificTypes["prompt"]["text"];
  mockReprompts: Array<MockHandlerASpecificTypes["prompt"]["text"]>;
  mockSuggestionChips: MockHandlerASpecificTypes["suggestionChips"];
  mockSessionData: MockHandlerASpecificTypes["sessionData"];
  mockShouldAuthenticate: MockHandlerASpecificTypes["shouldAuthenticate"];
  mockShouldSessionEnd: MockHandlerASpecificTypes["shouldSessionEnd"];
  mockTable: MockHandlerASpecificTypes["table"];

  expectedResult: Partial<MockHandlerASpecificTypes>;
  fillExpectedReprompts: () => void;
}

describe("BaseHandler", function() {
  beforeEach(async function(this: CurrentThisContext) {
    // has to set type to any to spy on protected method sendResults()
    this.handlerInstance = new MockHandlerA() as any; // todo change to container instantiation
    spyOn(this.handlerInstance, "sendResults");

    this.mockTable = { header: ["A", "B"], elements: [["A1", "A2"], ["B1", "B2"]] };
    this.mockCard = { description: "desc", title: "title" };
    this.mockChatBubbles = ["Bubble A", "Bubble B"];
    this.mockPrompt = "Prompt";
    this.mockSSMLPrompt = "<ssml>Prompt</ssml>";
    this.mockReprompts = ["Reprompt A", "Reprompt B"];
    this.mockSuggestionChips = [{ displayText: "Suggestion A", spokenText: "Suggestion A" }, { displayText: "Suggestion B", spokenText: "Suggestion A" }];
    this.mockSessionData = "My Mock Session Data";
    this.mockShouldAuthenticate = true;
    this.mockShouldSessionEnd = true;

    this.expectedResult = {
      table: this.mockTable,
      card: this.mockCard,
      chatBubbles: this.mockChatBubbles,
      suggestionChips: this.mockSuggestionChips,
      shouldAuthenticate: this.mockShouldAuthenticate,
      shouldSessionEnd: this.mockShouldSessionEnd,
    };

    this.fillExpectedReprompts = () => {
      this.expectedResult.reprompts = this.mockReprompts.map(value => {
        return mapPrompt(value);
      });
    };
  });

  function expectResult() {
    it("calls sendResponse with corresponding object", async function(this: CurrentThisContext) {
      expect(this.handlerInstance.sendResults).toHaveBeenCalledWith(this.expectedResult);
    });
  }

  function mapPrompt(value: string, isSSML = false) {
    return {
      isSSML,
      text: value,
    };
  }

  describe("without answers set", function() {
    beforeEach(async function(this: CurrentThisContext) {
      await this.handlerInstance.send();
    });

    it("calls sendResponse with empty object", async function(this: CurrentThisContext) {
      expect(this.handlerInstance.sendResults).toHaveBeenCalledWith({});
    });
  });

  describe("with answers set", function() {
    describe("with promises in Answers", function() {
      beforeEach(async function(this: CurrentThisContext) {
        const promisfiedMockedReprompts = this.mockReprompts.map((value: string) => {
          return Promise.resolve(value);
        });

        this.fillExpectedReprompts();
        this.expectedResult.prompt = mapPrompt(this.mockPrompt);

        await this.handlerInstance
          .prompt(Promise.resolve(this.mockPrompt))
          .setReprompts(promisfiedMockedReprompts)
          .setCard(Promise.resolve(this.mockCard))
          .setChatBubbles(Promise.resolve(this.mockChatBubbles))
          .setSuggestionChips(Promise.resolve(this.mockSuggestionChips))
          .addMockHandlerATable(Promise.resolve(this.mockTable))
          .setUnauthenticated()
          .endSession()
          .send();
      });

      expectResult();
    });

    describe("without promises in Answer", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.fillExpectedReprompts();
        this.expectedResult.prompt = mapPrompt(this.mockPrompt);

        await this.handlerInstance
          .prompt(this.mockPrompt)
          .setReprompts(this.mockReprompts)
          .setCard(this.mockCard)
          .setChatBubbles(this.mockChatBubbles)
          .setSuggestionChips(this.mockSuggestionChips)
          .addMockHandlerATable(this.mockTable)
          .setUnauthenticated()
          .endSession()
          .send();
      });

      expectResult();
    });
  });

  describe("with special types", function() {
    describe("with SSML prompt", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.fillExpectedReprompts();
        this.expectedResult.prompt = mapPrompt(this.mockSSMLPrompt, true);

        await this.handlerInstance.prompt(this.mockSSMLPrompt).send();
      });

      expectResult();
    });

    describe("with prompt and reprompt in one call", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.fillExpectedReprompts();
        this.expectedResult.prompt = mapPrompt(this.mockPrompt);

        await this.handlerInstance.prompt(this.mockPrompt, ...this.mockReprompts).send();
      });

      expectResult();
    });
  });

  describe("without sending activly", function() {
    beforeEach(async function(this: CurrentThisContext) {
      this.expectedResult = {};

      this.handlerInstance.setSuggestionChips(this.mockSuggestionChips).addMockHandlerATable(this.mockTable);
    });

    it("calls send in AfterStateMachine", async function(this: CurrentThisContext) {
      pending("not implemented");
    });
  });
});
