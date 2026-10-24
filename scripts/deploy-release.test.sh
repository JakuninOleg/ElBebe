#!/usr/bin/env bash
set -Eeuo pipefail
script="$PWD/deploy/apply-release.sh"
tmp="$(mktemp -d /tmp/el-bebe-release.XXXXXXXX)"
trap '[[ "$tmp" == /tmp/el-bebe-release.* ]] && rm -rf -- "$tmp"' EXIT
trap 'cat "$tmp"/*.log >&2' ERR
export tag=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-123-1
export MODE

docker() {
  printf '%s | %s\n' "${IMAGE_TAG:-unset}" "$*" >> "$EL_BEBE_DEPLOY_ROOT/docker.log"
  case "$*" in
    'image inspect '*) echo 'sha256:new' ;;
    'inspect --format {{.Image}} old-container') echo 'sha256:old' ;;
    'inspect --format {{.Image}} new-container') echo 'sha256:new' ;;
    'inspect --format {{range .Config.Env}}'*) echo 'EMDASH_SITE_URL=https://site.example' ;;
    *' ps --all --quiet app') echo 'old-container' ;;
    *' ps --quiet app') echo 'new-container' ;;
    *' run --rm '*) [[ "$MODE" != backup-failure ]] ;;
    *' up --detach '*)
      [[ "$MODE" != unhealthy || "$IMAGE_TAG" == rollback-* ]] && [[ "$MODE" != rollback-failure ]]
      ;;
    *) return 0 ;;
  esac
}
curl() { [[ "$MODE" != public-failure ]]; }
flock() { return 0; }
export -f docker curl flock

fixture() {
  export EL_BEBE_DEPLOY_ROOT="$tmp/$1"
  mkdir -p "$EL_BEBE_DEPLOY_ROOT"/deploy "$EL_BEBE_DEPLOY_ROOT/incoming/123-1"
  printf 'old-compose\n' > "$EL_BEBE_DEPLOY_ROOT/compose.yaml"
  printf 'old-caddy\n' > "$EL_BEBE_DEPLOY_ROOT/deploy/Caddyfile"
  printf 'DOMAIN=site.example\n' > "$EL_BEBE_DEPLOY_ROOT/deploy/.env"
  printf 'persistent-private-data\n' > "$EL_BEBE_DEPLOY_ROOT/data-sentinel"
  local incoming="$EL_BEBE_DEPLOY_ROOT/incoming/123-1"
  printf 'new-compose\n' > "$incoming/compose.yaml"
  printf 'new-override\n' > "$incoming/compose.cicd.yaml"
  printf 'new-caddy\n' > "$incoming/Caddyfile"
  printf 'image-fixture\n' > "$incoming/site-image.tar.gz"
  printf '%s\n' "$tag" > "$incoming/image.tag"
  cp "$script" "$incoming/apply-release.sh"
  (cd "$incoming"; sha256sum site-image.tar.gz compose.yaml compose.cicd.yaml Caddyfile apply-release.sh image.tag | tr -d '\r' > SHA256SUMS)
}

MODE=success; fixture success
bash "$script" 123-1 10 > "$tmp/success.log" 2>&1
[[ "$(cat "$EL_BEBE_DEPLOY_ROOT/deploy/releases/current-image")" == "$tag" ]]
[[ "$(cat "$EL_BEBE_DEPLOY_ROOT/data-sentinel")" == persistent-private-data ]]
[[ ! -f "$EL_BEBE_DEPLOY_ROOT/incoming/123-1/site-image.tar.gz" ]]

for MODE in unhealthy public-failure backup-failure rollback-failure; do
  fixture "$MODE"
  if bash "$script" 123-1 10 > "$tmp/$MODE.log" 2>&1; then echo "Expected $MODE to fail" >&2; exit 1; fi
  [[ "$(cat "$EL_BEBE_DEPLOY_ROOT/compose.yaml")" == old-compose ]]
  [[ "$(cat "$EL_BEBE_DEPLOY_ROOT/deploy/Caddyfile")" == old-caddy ]]
  [[ "$(cat "$EL_BEBE_DEPLOY_ROOT/data-sentinel")" == persistent-private-data ]]
  [[ ! -f "$EL_BEBE_DEPLOY_ROOT/deploy/releases/current-image" ]]
  grep -q 'rollback-123-1.*up --detach' "$EL_BEBE_DEPLOY_ROOT/docker.log"
done
MODE=success; fixture existing-override
printf 'old-override\n' > "$EL_BEBE_DEPLOY_ROOT/compose.cicd.yaml"
MODE=unhealthy
if bash "$script" 123-1 10 > "$tmp/override.log" 2>&1; then exit 1; fi
[[ "$(cat "$EL_BEBE_DEPLOY_ROOT/compose.cicd.yaml")" == old-override ]]

MODE=success; fixture corrupted
printf 'corrupt' >> "$EL_BEBE_DEPLOY_ROOT/incoming/123-1/site-image.tar.gz"
if bash "$script" 123-1 10 > "$tmp/corrupted.log" 2>&1; then exit 1; fi
[[ ! -f "$EL_BEBE_DEPLOY_ROOT/docker.log" ]]
fixture stale
mkdir -p "$EL_BEBE_DEPLOY_ROOT/deploy/releases"
printf '20\n' > "$EL_BEBE_DEPLOY_ROOT/deploy/releases/last-run-number"
bash "$script" 123-1 10 > "$tmp/stale.log" 2>&1
[[ ! -f "$EL_BEBE_DEPLOY_ROOT/docker.log" ]]
if bash "$script" '../not-a-release' 10 > "$tmp/invalid.log" 2>&1; then exit 1; fi
echo 'All deployment failure scenarios passed'
