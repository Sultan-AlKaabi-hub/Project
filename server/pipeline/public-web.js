// Article downloads cannot reach loopback, private networks, or cloud metadata.
import dns from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import { isIP } from "node:net";

export function publicAddress(address) {
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number);
    return (
      a !== 0 &&
      a !== 10 &&
      a !== 127 &&
      a < 224 &&
      !(a === 169 && b === 254) &&
      !(a === 172 && b >= 16 && b <= 31) &&
      !(a === 192 && (b === 168 || b === 0)) &&
      !(a === 100 && b >= 64 && b <= 127) &&
      !(a === 198 && (b === 18 || b === 19))
    );
  }
  // Permit ordinary global IPv6, excluding documentation and transition networks.
  return (
    isIP(address) === 6 &&
    /^[23]/i.test(address) &&
    !/^2001:(db8|0):/i.test(address) &&
    !/^2002:/i.test(address)
  );
}
export async function publicText(input, headers = {}, redirects = 0) {
  const url = new URL(input);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    (url.port && !["80", "443"].includes(url.port))
  )
    throw new Error("Unsupported article URL");
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(hostname)
    ? [{ address: hostname, family: isIP(hostname) }]
    : await dns.lookup(hostname, { all: true });
  if (!addresses.length || addresses.some((x) => !publicAddress(x.address)))
    throw new Error("Private network URLs are blocked");
  const resolved = addresses[0];
  const result = await new Promise((resolve, reject) => {
    const request = (url.protocol === "https:" ? https : http).get(
      url,
      {
        headers,
        lookup: (_host, options, callback) =>
          options.all
            ? callback(null, [resolved])
            : callback(null, resolved.address, resolved.family),
      },
      (response) => {
        if (
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          response.resume();
          resolve({ redirect: new URL(response.headers.location, url).href });
          return;
        }
        if (response.statusCode < 200 || response.statusCode >= 300) {
          response.resume();
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }
        let size = 0;
        const chunks = [];
        response.on("data", (chunk) => {
          size += chunk.length;
          if (size > 3 * 1024 * 1024)
            request.destroy(new Error("Article is too large"));
          else chunks.push(chunk);
        });
        response.on("end", () =>
          resolve({
            html: Buffer.concat(chunks).toString("utf8"),
            url: url.href,
          }),
        );
        response.on("error", reject);
      },
    );
    const timer = setTimeout(
      () => request.destroy(new Error("Article download timed out")),
      15000,
    );
    request.on("close", () => clearTimeout(timer));
    request.on("error", reject);
  });
  if (result.redirect) {
    if (redirects >= 5) throw new Error("Too many redirects");
    return publicText(result.redirect, headers, redirects + 1);
  }
  return result;
}
