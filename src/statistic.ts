import { ServiceOption, InitOption, createInitFn } from "use-services";
import RedisService from "./redis";
import { srvs } from "./services";

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
  private db: { [k: string]: StatisticData } = {};
  constructor(option: InitOption<Args, Service>) {
    this.args = option.args;
  }

  public inBytes(address: string, bytes: number) {
    let statistic = this.db[address];
    if (!statistic) statistic = this.db[address] = this.useDefault();
    statistic.incomes += bytes;
    statistic.changeAt = Date.now();
    if (statistic.type === "full") {
      if (statistic.incomes >= this.args.maxIncomes) {
        return false;
      }
    } else {
      this.sync(address, statistic);
    }
    return true;
  }

  public outBytes(address: string, bytes: number) {
    let statistic = this.db[address];
    if (!statistic) statistic = this.db[address] = this.useDefault();
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

  public async mustGet(address: string) {
    const statistic = this.db[address] || this.useDefault();
    if (statistic.type === "full") {
      return statistic;
    }
    return this.sync(address, statistic);
  }

  async sync(address: string, statistic: StatisticData) {
    const { redis } = srvs;
    const data = await redis.get(redis.joinKey("statistic", address));
    if (!data) {
      statistic.type = "full";
    } else {
      const cachedStats: StatisticData = JSON.parse(data);
      cachedStats.incomes += statistic.incomes;
      cachedStats.outcomes += statistic.outcomes;
      cachedStats.changeAt = statistic.changeAt;
      statistic = cachedStats;
    }
    this.db[address] = statistic;
    return statistic;
  }

  useDefault(): StatisticData {
    return { type: "local", incomes: 0, outcomes: 0, changeAt: 0 };
  }
}

export const init = createInitFn(Service);
