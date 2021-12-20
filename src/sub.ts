import { ApiPromise, WsProvider } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
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
  private destoryed = false;
  public constructor(option: InitOption<Args, Service>) {
    if (option.deps.length !== 1) {
      throw new Error("miss deps [store]");
    }
    this.args = option.args;
  }
  public async [INIT_KEY]() {
    this.api = new ApiPromise({
      provider: new WsProvider(this.args.url),
    });
    await Promise.all([this.api.isReady, cryptoWaitReady()]);
  }
  public async [STOP_KEY]() {
    this.destoryed = true;
    await this.api.disconnect();
  }
  public async start() {
    await this.waitSynced();
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
