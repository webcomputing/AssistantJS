import { componentInterfaces } from "./private-interfaces";
import { multiInject, optional, injectable } from "inversify";
import { Subject, Observable, Observer } from "rxjs";
import { AssistantJSEvent, EventHandler, EventBus } from "./public-interfaces";

@injectable()
export class EventBusHandler implements EventBus {
  private channels: { [category: string]: { [channel: string]: Subject<AssistantJSEvent> } } = {};

  constructor(
    @optional()
    @multiInject(componentInterfaces.eventBus)
    private eventHandler: EventHandler[]
  ) {}

  public publish(event: AssistantJSEvent, channel: string): void {
    this.initializeChannel(channel, event.category);
    this.channels[event.category || "AssistantJS"][channel].next(event);
  }

  public subscribe(observer: Observer<AssistantJSEvent>, channel: string, category: string = "AssistantJS"): void {
    this.initializeChannel(channel, category);
    this.channels[category][channel].subscribe(observer);
  }

  private initializeChannel(channel: string, category: string = "AssistantJS") {
    if (!this.channels[category]) {
      this.channels[category] = {};
    }
    if (!this.channels[category][channel]) {
      this.channels[category][channel] = new Subject<AssistantJSEvent>();
      this.eventHandler.forEach(handler => {
        const subscriber = handler.getSubscriber(category, channel);
        if (subscriber) {
          this.channels[category][channel].subscribe(subscriber);
        }
      });
    }
  }
}
