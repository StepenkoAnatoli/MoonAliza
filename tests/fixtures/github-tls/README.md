# Test-only TLS material for the fake GitHub

These files exist only so the real Research Kit collector can be run against `tests/fixtures/fake-github.ts`. That fake answers on loopback, behind a CONNECT proxy that tunnels only `api.github.com:443` and `artifacts.invalid:443`.

- `ca.pem`: a self-signed test CA. Tests trust it only by giving the collector child process `NODE_EXTRA_CA_CERTS`, which no production code path sets. The desktop journeys add it the same way, through the test-only preload `e2e/fixtures/collector-network.cjs` ([research journeys](../../../docs/specification/research-journeys.md)). Its private key was discarded when it was made, so it cannot sign anything else.
- `leaf.pem` and `leaf.key`: the server certificate and key for `api.github.com` and `artifacts.invalid`, signed by that CA and valid until 2036-09-29. The key is a test fixture, not a secret. It protects nothing outside the loopback fake.

Nothing under `src/` may reference this directory. A secret scanner that flags `leaf.key` should allowlist this path (Task 7).

Regenerate (OpenSSL 3, run from this directory, then commit all three files):

```sh
openssl ecparam -name prime256v1 -genkey -noout -out ca.key
openssl req -x509 -new -key ca.key -sha256 -days 3650 -subj "/CN=MoonAliza test CA (not trusted outside tests)" -addext "basicConstraints=critical,CA:TRUE" -addext "keyUsage=critical,keyCertSign,cRLSign" -out ca.pem
openssl ecparam -name prime256v1 -genkey -noout -out leaf.key
openssl req -new -key leaf.key -subj "/CN=api.github.com" -out leaf.csr
printf 'basicConstraints=CA:FALSE\nextendedKeyUsage=serverAuth\nsubjectAltName=DNS:api.github.com,DNS:artifacts.invalid\n' > ext.cnf
openssl x509 -req -in leaf.csr -CA ca.pem -CAkey ca.key -CAcreateserial -days 3650 -sha256 -extfile ext.cnf -out leaf.pem
openssl verify -CAfile ca.pem leaf.pem
rm ca.key ca.srl leaf.csr ext.cnf
```
