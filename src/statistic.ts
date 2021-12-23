import {
  ServiceOption,
  InitOption,
  createInitFn,
  STOP_KEY,
  INIT_KEY,
} from "use-services";
import RedisService from "./redis";
import { srvs } from "./services";
import { sleep } from "./utils";

export type Option<S extends Service> = ServiceOption<Args, S>;

export interface Args {
  maxOutcomes: number;
  maxIncomes: number;
}

export type Deps = [RedisService];

interface StatisticData {
  type: "local" | "full";
  incomes: number;
  outcomes: number;
  changeAt: number;
}

export class Service {
  private args: Args;
  private destoryed = false;
  private lastRunAt = 0;
  private statistics: { [k: string]: StatisticData } = {};
  constructor(option: InitOption<Args, Service>) {
    if (option.deps.length !== 1) {
      throw new Error("miss deps [redis]");
    }
    this.args = option.args;
  }

  public async [INIT_KEY]() {
    //
  }

  public [STOP_KEY]() {
    this.destoryed = true;
  }

  public inBytes(address: string, bytes: number) {
    let statistic = this.statistics[address];
    if (!statistic)
      statistic = this.statistics[address] = this.defaultStatistic;
    statistic.incomes += bytes;
    statistic.changeAt = Date.now();
    if (statistic.type === "full") {
      if (statistic.incomes >= this.args.maxIncomes) {
        return false;
      }
    } else {
      this.sync(address, statistic);
    }
  }

  public outBytes(address: string, bytes: number) {
    let statistic = this.statistics[address];
    if (!statistic)
      statistic = this.statistics[address] = this.defaultStatistic;
    statistic.outcomes += bytes;
    statistic.changeAt = Date.now();
    if (statistic.type === "full") {
      if (statistic.outcomes >= this.args.maxOutcomes) {
        return false;
      }
    } else {
      this.sync(address, statistic);
    }
    return true;
  }

  async sync(address: string, statistic: StatisticData) {
    const { redis } = srvs;
    const data = await redis.get(redis.joinKey("statistic", address));
    if (data) {
      const cachedStats: StatisticData = JSON.parse(data);
      cachedStats.incomes += statistic.incomes;
      cachedStats.outcomes += statistic.outcomes;
      cachedStats.changeAt = statistic.changeAt;
      this.statistics[address] = cachedStats;
    } else {
      statistic.type = "full";
    }
  }

  get defaultStatistic(): StatisticData {
    return { type: "local", incomes: 0, outcomes: 0, changeAt: 0 };
  }
}

export const init = createInitFn(Service);
