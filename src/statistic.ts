import { ServiceOption, InitOption, createInitFn } from "use-services";
import RedisService from "./redis";
import { srvs } from "./services";

export type Option<S extends Service> = ServiceOption<Args, S>;

export interface Args {
  maxOutcomes: number;
  maxIncomes: number;
  ttl: number;
}

export class Service {
  private args: Args;
  private db: { [k: string]: StatisticData } = {};
  private lastSaveAt = 0;
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

  public async getStatistic(address: string) {
    const statistic = this.db[address] || this.useDefault();
    if (statistic.type === "full") {
      return statistic;
    }
    this.sync(address, statistic);
    return statistic;
  }

  public async checkStatistic(address: string) {
    const statistic = await this.getStatistic(address);
    this.db[address] = statistic;
    const { incomes, outcomes } = statistic;
    if (incomes >= this.args.maxIncomes) {
      throw srvs.errs.ErrLackOfInQuota.toError();
    }
    if (outcomes >= this.args.maxOutcomes) {
      throw srvs.errs.ErrLackOfOutQuota.toError();
    }
  }

  public async saveAll() {
    const { redis } = srvs;
    const red = redis.multi();
    const now = Date.now();
    const addresses = Object.keys(this.db);
    for (const address of addresses) {
      const statistic = this.db[address];
      if (!statistic) continue;
      if (statistic.changeAt > this.lastSaveAt) {
        const { incomes, outcomes } = statistic;
        red.hset(
          redis.statisticKey,
          address,
          JSON.stringify({ incomes, outcomes })
        );
        continue;
      }
      if (now - statistic.changeAt >= this.args.ttl) {
        delete this.db[address];
      }
    }
    await red.exec();
    this.lastSaveAt = now;
  }

  public async clearAll() {
    this.db = {};
  }

  async sync(address: string, statistic: StatisticData) {
    const { redis } = srvs;
    const data = await redis.hget(redis.statisticKey, address);
    if (data) {
      const cachedStats: Partial<StatisticData> = JSON.parse(data);
      statistic.incomes += cachedStats.incomes;
      statistic.outcomes += cachedStats.outcomes;
      statistic.type = "full";
    }
  }

  useDefault(): StatisticData {
    return { type: "local", incomes: 0, outcomes: 0, changeAt: 0 };
  }
}

export const init = createInitFn(Service);

interface StatisticData {
  type: "local" | "full";
  incomes: number;
  outcomes: number;
  changeAt: number;
}
