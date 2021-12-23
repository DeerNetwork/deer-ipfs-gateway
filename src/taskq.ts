import {
  ServiceOption,
  InitOption,
  createInitFn,
  STOP_KEY,
} from "use-services";
import IORedis from "ioredis";
import { Queue, QueueScheduler, Worker } from "bullmq";
import { srvs } from "./services";
import { timeStamp } from "console";

export type Option<S extends Service> = ServiceOption<Args, S>;

export interface Args {
  name: string;
}

export class Service {
  private args: Args;
  private queue: Queue;
  private worker: Worker;
  private queueScheduler: QueueScheduler;
  constructor(option: InitOption<Args, Service>) {
    this.args = option.args;
  }
  public async start() {
    const { name } = this.args;
    this.queue = new Queue(name, {
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
      prefix: srvs.settings.app,
      connection: this.createConnection(),
    });
    this.queue.add(
      "resetStatisticMonthly",
      { id: "resetStatisticMonthly" },
      { repeat: { cron: "55 59 23 L * *" } }
    );
    this.queue.add(
      "saveStatisticMinutely",
      { id: "saveStatisticMinutely" },
      { repeat: { cron: "0 * * * * *" } }
    );
    this.worker = new Worker(
      name,
      async (job) => {
        if (job.name === "saveStatisticMinutely") {
          await srvs.statistic.saveAll();
        } else if (job.name === "resetStatisticMonthly") {
          await srvs.statistic.clearAll();
        }
      },
      { connection: this.createConnection(), prefix: srvs.settings.app }
    );
    this.queueScheduler = new QueueScheduler(name, {
      connection: this.createConnection(),
      prefix: srvs.settings.app,
    });
  }
  public async [STOP_KEY]() {
    this.queueScheduler.close();
    this.queue.close();
    this.worker.close();
  }

  private createConnection() {
    return new IORedis({
      ...srvs.redis.options,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
}

export const init = createInitFn(Service);
