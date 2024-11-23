import { platform } from "@tauri-apps/plugin-os";
import { NT4_Client, NT4_Subscription, NT4_Topic } from "./NT4";

let isMobile = platform() === "ios" || platform() === "android";
export class SubscriptionData<T> {
  private listener: (value: T) => void;
  private subscription: NT4_Subscription;
  private client: NT4_Client;

  constructor(
    client: NT4_Client,
    sub: NT4_Subscription,
    listener: (value: T) => void
  ) {
    this.subscription = sub;
    this.listener = listener;
    this.client = client;
  }

  public unsubscribe() {
    this.client.unsubscribe(this.subscription.uid);
    this.listener = () => {};
  }

  update(value: T) {
    this.listener(value);
  }
}

export class NTClient {
  private client: NT4_Client;
  private topics: Map<string, NT4_Topic> = new Map();
  private subscriptions: Map<string, SubscriptionData<any>> = new Map();
  private robotConnectionListeners: ((connected: boolean) => void)[] = [];
  private topicsListeners: ((topics: Map<string, NT4_Topic>) => void)[] = [];
  private connected: boolean = false;

  constructor(server_base_address: string) {
    this.client = new NT4_Client(
      server_base_address,
      "ShrinkWrap" + (isMobile ? "Mobile" : "Desktop"),
      (topic) => {
        this.topics.set(topic.name, topic);
      },
      (topic) => {
        this.topics.delete(topic.name);
      },
      (topic, _, value) => {
        if (this.subscriptions.has(topic.name)) {
          this.subscriptions.get(topic.name)?.update(value);
        }
      },
      () => {
        this.connected = true;
        this.robotConnectionListeners.forEach((l) => l(true));
      },
      () => {
        this.connected = false;
        this.robotConnectionListeners.forEach((l) => l(false));
      }
    );
    this.client.connect();
  }

  public addRobotConnectionListener(
    listener: (connected: boolean) => void
  ): () => void {
    this.robotConnectionListeners.push(listener);
    listener(this.connected);
    return () => {
      this.robotConnectionListeners = this.robotConnectionListeners.filter(
        (l) => l !== listener
      );
    };
  }

  public addTopicsListener(
    listener: (topics: Map<string, NT4_Topic>) => void
  ): () => void {
    this.topicsListeners.push(listener);
    listener(this.topics);
    return () => {
      this.topicsListeners = this.topicsListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Add a new subscription, reading value updates
   * @param topic The topic or prefix to include in the subscription.
   * @param prefixMode If true, use patterns as prefixes. If false, only subscribe to topics that are an exact match.
   * @param sendAll If true, send all values. If false, only send the most recent value.
   * @param periodic How frequently to send updates (applies regardless of "sendAll" option)
   * @returns A subscription ID that can be used to unsubscribe.
   */
  public subscribe(
    topic: string,
    callback: (value: any) => void,
    prefixMode: boolean = false,
    sendAll: boolean = false,
    periodic: number = 0.1
  ): SubscriptionData<any> {
    let sub = this.client.subscribe([topic], prefixMode, sendAll, periodic);
    let data = new SubscriptionData(this.client, sub, callback);
    this.subscriptions.set(topic, data);
    return data;
  }

  public publish(topic: string, type: string) {
    this.client.publishTopic(topic, type);
  }

  public setValue(topic: string, value: any) {
    this.client.addSample(topic, value);
  }

  public subscribeRoot(): SubscriptionData<any> {
    let sub = this.client.subscribeTopicsOnly(["/"], true);
    return new SubscriptionData(this.client, sub, () => {});
  }

  public disconnect() {
    this.client.disconnect();
  }

  public getClient() {
    return this.client;
  }

  public static getInstanceByURI(uri: string) {
    return new NTClient(`${uri}`);
  }

  public static getInstanceByTeam(teamNumber: number) {
    return new NTClient(`roborio-${teamNumber}-frc.local:`);
  }
}
