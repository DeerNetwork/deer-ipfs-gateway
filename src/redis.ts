import { Service } from "@use-services/ioredis";
import { srvs } from "./services";

export default class Redis extends Service {
  public sep = ":";
  public joinKey(...pairs: string[]) {
    return [srvs.settings.app, ...pairs].join(this.sep);
  }
  public async getAdressNonce(address: string) {
    const nonce = await this.get(this.joinKey("addressNonce"));
    if (!nonce) return 0;
    return parseInt(nonce) || 0;
  }
}
