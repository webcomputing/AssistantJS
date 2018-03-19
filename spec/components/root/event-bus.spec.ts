import { injectable } from "inversify";
import { Subscriber } from "rxjs";
import { componentInterfaces } from "../../../src/components/root/private-interfaces";
import { AssistantJSEvent, EventHandler } from "../../../src/components/root/public-interfaces";
import { injectionNames } from "../../../src/injection-names";

const mySymbol = Symbol();
const myString = "myEvent";

/** Splits up subscribed events into two different queues */
@injectable()
class EventHandlerA implements EventHandler {
  public symbolEvents: AssistantJSEvent[] = [];
  public stringEvents: AssistantJSEvent[] = [];

  public getSubscriber(eventName: string | symbol) {
    if (eventName === mySymbol) {
      return Subscriber.create<AssistantJSEvent>(event => {
        if (event) this.symbolEvents.push(event);
      });
    }

    if (eventName === myString) {
      return Subscriber.create<AssistantJSEvent>(event => {
        if (event) this.stringEvents.push(event);
      });
    }
  }
}

/** Puts everything into "events" queue */
// tslint:disable-next-line:max-classes-per-file
@injectable()
class EventHandlerB implements EventHandler {
  public events: AssistantJSEvent[] = [];

  public getSubscriber() {
    return Subscriber.create<AssistantJSEvent>(event => {
      if (event) this.events.push(event);
    });
  }
}

describe("EventBus", function() {
  beforeEach(function() {
    // Bind some event handlers
    this.container.inversifyInstance
      .bind(componentInterfaces.eventHandler)
      .to(EventHandlerA)
      .inSingletonScope();
    this.container.inversifyInstance
      .bind(componentInterfaces.eventHandler)
      .to(EventHandlerB)
      .inSingletonScope();

    // Get event handler instances
    const allHandlers = this.container.inversifyInstance.getAll(componentInterfaces.eventHandler);
    this.handlerA = allHandlers[0];
    this.handlerB = allHandlers[1];

    this.eventBus = this.container.inversifyInstance.get(injectionNames.eventBus);
  });

  it("is injectable", function() {
    expect(typeof this.eventBus.publish).toEqual("function");
  });

  describe("publish/subscribe", function() {
    describe("when using symbols", function() {
      beforeEach(function() {
        this.event = { name: mySymbol };
        this.eventBus.publish(this.event);
      });

      it("puts event in general queue", function() {
        expect(this.handlerB.events).toEqual([this.event]);
      });

      it("puts event in symbol queue", function() {
        expect(this.handlerA.symbolEvents).toEqual([this.event]);
      });

      it("does not put event in string queue", function() {
        expect(this.handlerA.stringEvents).toEqual([]);
      });
    });

    describe("when using strings", function() {
      beforeEach(function() {
        this.event = { name: myString, data: { a: "b" } };
        this.eventBus.publish(this.event);
      });

      it("puts event in general queue", function() {
        expect(this.handlerB.events).toEqual([this.event]);
      });

      it("does not put event in symbol queue", function() {
        expect(this.handlerA.symbolEvents).toEqual([]);
      });

      it("puts event in string queue", function() {
        expect(this.handlerA.stringEvents).toEqual([this.event]);
      });
    });
  });
});
