import { platform } from "@tauri-apps/plugin-os";
import { NT4_Client, NT4_Subscription, NT4_Topic } from "./NT4";

let isMobile = platform() === "ios" || platform() === "android";
export class SubscriptionData<T> {
  private listener: (value: T) => void;
  private subscription: NT4_Subscription | undefined;
  private client: NT4_Client | null;

  constructor(
    client: NT4_Client | null,
    sub: NT4_Subscription | undefined,
    listener: (value: T) => void
  ) {
    this.subscription = sub;
    this.listener = listener;
    this.client = client;
  }

  public unsubscribe() {
    if (this.client && this.subscription)
      this.client.unsubscribe(this.subscription.uid);
    this.listener = () => {};
  }

  update(value: T) {
    this.listener(value);
  }
}

export class NTClient {
  private client: NT4_Client | null = null;
  private topics: Map<string, NT4_Topic> = new Map();
  private subscriptions: Map<string, SubscriptionData<any>[]> = new Map();
  private robotConnectionListeners: ((connected: boolean) => void)[] = [];
  private topicsListeners: ((topics: Map<string, NT4_Topic>) => void)[] = [];
  private connected: boolean = false;

  private data: Map<string, Map<number, any>> = new Map();

  private liveMode: boolean = true;
  private logMode: boolean = false;
  private selectedTimestamp: number = -1;

  private logModeListeners: ((logMode: boolean) => void)[] = [];

  private connectedTimestamp: number = -1;

  private server_base_address: string = "";

  constructor(server_base_address: string) {
    this.server_base_address = server_base_address;
    this.createClient(server_base_address);
    this.client?.connect();
  }

  private createClient(server_base_address: string) {
    this.client = new NT4_Client(
      server_base_address,
      "ShrinkWrap" + (isMobile ? "Mobile" : "Desktop"),
      (topic) => {
        this.topics.set(topic.name, topic);
      },
      (topic) => {
        this.topics.delete(topic.name);
      },
      (topic, timestamp, value) => {
        if (this.subscriptions.has(topic.name)) {
          if (this.liveMode)
            this.subscriptions.get(topic.name)?.forEach((s) => s.update(value));
        }
        if (!this.data.has(topic.name)) {
          this.data.set(topic.name, new Map());
        }
        this.data.get(topic.name)?.set(timestamp, value);
      },
      () => {
        this.connected = true;
        this.robotConnectionListeners.forEach((l) => l(true));
      },
      () => {
        this.connected = false;
        this.robotConnectionListeners.forEach((l) => l(false));
      },
      (ts) => {
        if (this.connectedTimestamp === -1) this.connectedTimestamp = ts;
      }
    );
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

  public addLogModeListener(
    listener: (connected: boolean) => void
  ): () => void {
    this.logModeListeners.push(listener);
    listener(this.logMode);
    return () => {
      this.logModeListeners = this.logModeListeners.filter(
        (l) => l !== listener
      );
    };
  }

  public isConnected() {
    return this.connected;
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
  ): SubscriptionData<any> | null {
    let sub;
    if (this.client != null) {
      sub = this.client.subscribe([topic], prefixMode, sendAll, periodic);
    }
    let data = new SubscriptionData(this.client, sub, callback);
    if (this.subscriptions.has(topic)) {
      this.subscriptions.get(topic)?.push(data);
    } else {
      this.subscriptions.set(topic, [data]);
    }
    return data;
  }

  public publish(topic: string, type: string) {
    if (this.client == null || this.logMode) {
      console.warn("Cannot publish: Client not connected or in log mode");
      return;
    }
    this.client.publishTopic(topic, type);
  }

  public setValue(topic: string, value: any) {
    if (this.client == null || this.logMode) {
      console.warn("Cannot set value: Client not connected or in log mode");
      return;
    }
    this.client.addSample(topic, value);
  }

  public subscribeRoot(): SubscriptionData<any> | null {
    if (this.client == null) return null;
    let sub = this.client.subscribeTopicsOnly(["/"], true);
    return new SubscriptionData(this.client, sub, () => {});
  }

  public disconnect() {
    if (this.client == null) return;
    this.client.disconnect();
  }

  public getClient() {
    return this.client;
  }

  public setSelectedTimestamp(timestamp: number) {
    this.liveMode = false;
    this.selectedTimestamp = timestamp;
    for (let topic of this.subscriptions.keys()) {
      let value = this.getValueBefore(topic, timestamp);
      this.subscriptions.get(topic)?.forEach((s) => s.update(value));
    }
  }

  public enableLiveMode() {
    if (this.logMode) return;
    this.liveMode = true;
    for (let topic of this.subscriptions.keys()) {
      let value = this.getValueBefore(topic, this.getCurrentTimestamp());
      this.subscriptions.get(topic)?.forEach((s) => s.update(value));
    }
    this.selectedTimestamp = -1;
  }

  public isLive() {
    return this.liveMode && !this.logMode;
  }

  private getValueBefore(topic: string, timestamp: number): any | undefined {
    const topicData = this.data.get(topic);
    if (!topicData) {
      return undefined;
    }

    let closestTimestamp: number | undefined = undefined;
    for (let key of Array.from(topicData.keys()).sort((a, b) => b - a)) {
      if (key <= timestamp) {
        closestTimestamp = key;
        break;
      }
    }

    return closestTimestamp !== undefined
      ? topicData.get(closestTimestamp)
      : undefined;
  }

  public getConnectedTimestamp() {
    if (this.logMode || this.client == null) {
      return 0;
    }
    return this.connectedTimestamp;
  }

  public getCurrentTimestamp() {
    if (this.logMode || this.client == null) {
      let timestamp = this.data.get("/AdvantageKit/Timestamp");
      if (timestamp === undefined) {
        return this.selectedTimestamp;
      }
      // Get the latest timestamp
      return timestamp.get(
        Array.from(timestamp.keys()).sort((a, b) => b - a)[0]
      );
    }
    return this.client.getServerTime_us() ?? -1;
  }

  public getSelectedTimestamp() {
    return this.liveMode ? this.getCurrentTimestamp() : this.selectedTimestamp;
  }

  public enableLogMode(
    logData: Map<string, Map<number, any>>,
    topics: Map<string, NT4_Topic>
  ) {
    this.client?.disconnect();
    this.client = null;
    this.logMode = true;
    this.liveMode = false;
    this.data = logData;
    this.logModeListeners.forEach((l) => l(true));
    this.connectedTimestamp = 0;
    this.topics = topics;
    this.topicsListeners.forEach((l) => l(this.topics));
    for (let topic of this.subscriptions.keys()) {
      let value = this.getValueBefore(topic, this.getCurrentTimestamp());
      this.subscriptions.get(topic)?.forEach((s) => s.update(value));
    }
  }

  public disableLogMode() {
    if (!this.logMode) return;
    this.logMode = false;
    this.liveMode = true;
    this.logModeListeners.forEach((l) => l(false));
    this.createClient(this.server_base_address);
    this.client?.connect();
  }

  public static getInstanceByURI(uri: string) {
    return new NTClient(`${uri}`);
  }

  public static getInstanceByTeam(teamNumber: number) {
    return new NTClient(`roborio-${teamNumber}-frc.local:`);
  }
}
