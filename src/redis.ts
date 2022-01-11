import { Service } from "@use-services/ioredis";
import { srvs } from "./services";

export default class Redis extends Service {
  public sep = ":";
  public joinKey(...pairs: string[]) {
    return [srvs.settings.app, ...pairs].join(this.sep);
  }
  public async getNonce(address: string) {
    const nonce = await this.get(this.joinKey("nonce", address));
    if (!nonce) return 0;
    return parseInt(nonce) || 0;
  }
  public async incNonce(address: string) {
    await this.incr(this.joinKey("nonce", address));
  }
  public async logAddIpfs(address: string, cid: string, name: string) {
    const exist = await this.exists(this.tokenKey(address));
    if (!exist) return;
    const item = cid === name ? cid : cid + ":" + name;
    await this.multi()
      .rpush(this.accountIpfsKey(address), item)
      .rpush(this.ipfsKey(cid), address)
      .exec();
  }
  public statisticKey(address) {
    const month = new Date().toISOString().slice(0, 7).replace(/-/, "");
    return this.joinKey("statistic", month, address);
  }
  public tokenKey(address: string) {
    return this.joinKey("token", address);
  }
  public accountIpfsKey(address: string) {
    return this.joinKey("accountIpfs", address);
  }
  public ipfsKey(cid: string) {
    return this.joinKey("ipfs", cid);
  }
}
