import moment from "moment";
import config from "client-config.json";

export function formatTimestamp(timestamp) {
  if (!timestamp) return null;
  return moment(parseInt(timestamp, 10)).format("MMM D, YYYY HH:mm:ss");
}

export function validateAddress(address) {
  const prefixes = config.currency.prefixes.join("|");
  const addressRegex = new RegExp(
    `^(${prefixes})_[13456789abcdefghijkmnopqrstuwxyz]{60}$`
  );
  return addressRegex.test(address);
}

export function validateBlockHash(hash) {
  return /^[A-F0-9]{64}$/.test(hash);
}
