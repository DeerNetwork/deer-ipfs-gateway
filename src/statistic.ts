import { ServiceOption, InitOption, createInitFn } from "use-services";
import { srvs } from "./services";

export type Option<S extends Service> = ServiceOption<Args, S>;

export interface Args {
  maxOutcomes: number;
  maxIncomes: number;
}

export class Service {
  private args: Args;
  constructor(option: InitOption<Args, Service>) {
    this.args = option.args;
  }

  public async inBytes(address: string, bytes: number) {
    const { redis } = srvs;
    const incomes = await redis.hincrby(
      redis.statisticKey(address),
      "incomes",
      bytes
    );
    return incomes < this.args.maxIncomes;
  }

  public async outBytes(address: string, bytes: number) {
    const { redis } = srvs;
    const outcomes = await redis.hincrby(
      redis.statisticKey(address),
      "outcomes",
      bytes
    );
    return outcomes < this.args.maxOutcomes;
  }

  public async getStatistic(address: string) {
    const { redis } = srvs;
    const statisticRaw = await redis.hgetall(redis.statisticKey(address));
    if (!statisticRaw) return this.useDefault();
    const { incomes, outcomes } = statisticRaw;
    return { incomes: parseInt(incomes), outcomes: parseInt(outcomes) };
  }

  public async checkStatistic(address: string) {
    const statistic = await this.getStatistic(address);
    const { incomes, outcomes } = statistic;
    if (incomes >= this.args.maxIncomes) {
      throw srvs.errs.ErrLackOfInQuota.toError();
    }
    if (outcomes >= this.args.maxOutcomes) {
      throw srvs.errs.ErrLackOfOutQuota.toError();
    }
  }

  useDefault(): StatisticData {
    return { incomes: 0, outcomes: 0 };
  }
}

export const init = createInitFn(Service);

interface StatisticData {
  incomes: number;
  outcomes: number;
}
