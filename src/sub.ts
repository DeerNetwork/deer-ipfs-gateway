import { ApiPromise, WsProvider } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { AccountId } from "@polkadot/types/interfaces/runtime";
import { sleep } from "./utils";
import { srvs } from "./services";
import _ from "lodash";

import {
  ServiceOption,
  InitOption,
  INIT_KEY,
  STOP_KEY,
  createInitFn,
} from "use-services";

export type Option<S extends Service> = ServiceOption<Args, S>;

export interface Args {
  url: string;
}

export class Service {
  private api: ApiPromise;
  private args: Args;
  public constructor(option: InitOption<Args, Service>) {
    this.args = option.args;
  }
  public async [INIT_KEY]() {
    this.api = new ApiPromise({
      provider: new WsProvider(this.args.url),
    });
    await Promise.all([this.api.isReady, cryptoWaitReady()]);
  }
  public async [STOP_KEY]() {
    await this.api.disconnect();
  }
  public async start() {
    await this.waitSynced();
    this.listen();
  }
  public async balanceOf(address: string) {
    const account = await this.api.query.system.account(address);
    return account.data.free.toBn();
  }
  public normalizeAddress(address: string) {
    return this.api.createType("AccountId", address).toString();
  }

  private listen() {
    const { redis } = srvs;
    this.api.query.system.events(async (events) => {
      for (const er of events) {
        const { method, section, data } = er.event;
        if (section === "system" && method === "KilledAccount") {
          const [accountId] = data as unknown as [AccountId];
          redis.del(redis.tokenKey(accountId.toString()));
        }
      }
    });
  }

  private async waitSynced() {
    let latestBlockNum: number;
    while (true) {
      try {
        const [{ isSyncing }, header] = await Promise.all([
          this.api.rpc.system.health(),
          this.api.rpc.chain.getHeader(),
        ]);
        if (isSyncing.isFalse) {
          await sleep(1000);
          const header2 = await this.api.rpc.chain.getHeader();
          if (header2.number.eq(header.number)) {
            await sleep(6000);
            const header3 = await this.api.rpc.chain.getHeader();
            if (header3.number.toNumber() > header.number.toNumber()) {
              latestBlockNum = header3.number.toNumber();
              srvs.logger.info(`Chain synced at ${latestBlockNum}`);
              break;
            }
          }
        }
        latestBlockNum = header.number.toNumber();
      } catch {}
      srvs.logger.info(`Syncing block at ${latestBlockNum}, waiting`);
      await sleep(3000);
    }
  }
}

export const init = createInitFn(Service);
