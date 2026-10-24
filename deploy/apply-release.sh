#!/usr/bin/env bash
# A release replaces code only. Databases, uploads, sessions and secrets stay on the VPS.
set -Eeuo pipefail
umask 077
release="${1:-}"
run_number="${2:-}"
[[ "$release" =~ ^[0-9]+-[0-9]+$ && "$run_number" =~ ^[0-9]+$ ]] || { echo 'Invalid release identity.' >&2; exit 1; }
root="$(cd "${EL_BEBE_DEPLOY_ROOT:-/srv/el-bebe}" && pwd -P)"
[[ "$root" != / ]] || exit 1
cd "$root"
mkdir -p deploy/releases deploy/backups
exec 9>deploy/releases/deploy.lock
flock -w 900 9
incoming="$root/incoming/$release"
record="$root/deploy/releases/$release"
[[ -f deploy/.env && -f compose.yaml && ! -e "$record" ]] || { echo 'Initialize the existing site first, or use a fresh release identity.' >&2; exit 1; }
last_run=0
if [[ -f deploy/releases/last-run-number ]]; then
  read -r last_run < deploy/releases/last-run-number
  [[ "$last_run" =~ ^[0-9]+$ ]] || exit 1
fi
if (( 10#$run_number < 10#$last_run )); then echo 'Skipping obsolete release.'; exit 0; fi
cd "$incoming"
for file in site-image.tar.gz compose.yaml compose.cicd.yaml Caddyfile apply-release.sh image.tag; do [[ -f "$file" && ! -L "$file" ]] || exit 1; done
while read -r hash file; do
  [[ "$hash" =~ ^[a-f0-9]{64}$ ]] || exit 1
  file="${file#\*}"
  case "$file" in site-image.tar.gz|compose.yaml|compose.cicd.yaml|Caddyfile|apply-release.sh|image.tag) ;; *) exit 1 ;; esac
done < SHA256SUMS
sha256sum --strict --check SHA256SUMS
read -r tag < image.tag
[[ "$tag" =~ ^[a-f0-9]{40}-[0-9]+-[0-9]+$ ]] || { echo 'Invalid image tag.' >&2; exit 1; }
cd "$root"
compose() { docker compose --project-directory "$root" --env-file "$root/deploy/.env" -f "$root/compose.yaml" -f "$root/compose.cicd.yaml" "$@"; }
candidate() { docker compose --project-directory "$root" --env-file "$root/deploy/.env" -f "$incoming/compose.yaml" -f "$incoming/compose.cicd.yaml" "$@"; }
export IMAGE_TAG="$tag"
candidate config --quiet
docker load --input "$incoming/site-image.tar.gz"
new_id="$(docker image inspect --format '{{.Id}}' "el-bebe:$tag")"
# The initial manual deployment may not use the CI override yet.
old_container="$(docker compose --project-directory "$root" --env-file "$root/deploy/.env" -f "$root/compose.yaml" ps --all --quiet app)"
[[ -n "$old_container" ]] || { echo 'Import and start the existing site before enabling automatic deployments.' >&2; exit 1; }
old_id="$(docker inspect --format '{{.Image}}' "$old_container")"
old_tag="rollback-$release"
docker image tag "$old_id" "el-bebe:$old_tag"
mkdir "$record"
cp compose.yaml "$record/compose.yaml"
cp deploy/Caddyfile "$record/Caddyfile"
had_override=false
if [[ -f compose.cicd.yaml ]]; then cp compose.cicd.yaml "$record/compose.cicd.yaml"; had_override=true; fi
printf '%s\n' "$old_tag" > "$record/previous-image"
stopped=false
installed=false
rollback() {
  status=$?
  trap - ERR HUP INT TERM
  if [[ "$stopped" == true ]]; then
    echo 'Release failed; restoring the previous application image. Databases are preserved.' >&2
    cp "$record/compose.yaml" "$root/compose.yaml"
    cp "$record/Caddyfile" "$root/deploy/Caddyfile"
    export IMAGE_TAG="$old_tag"
    if [[ "$had_override" == true ]]; then
      cp "$record/compose.cicd.yaml" "$root/compose.cicd.yaml"
      rollback_files=(-f "$root/compose.yaml" -f "$root/compose.cicd.yaml")
    else
      rollback_files=(-f "$root/compose.yaml")
      if [[ "$installed" == true ]]; then rm -f "$root/compose.cicd.yaml"; fi
    fi
    if docker compose --project-directory "$root" --env-file "$root/deploy/.env" "${rollback_files[@]}" up --detach --no-build --pull never --wait --wait-timeout 180 app proxy \
      && docker compose --project-directory "$root" --env-file "$root/deploy/.env" "${rollback_files[@]}" exec -T proxy caddy reload --config /etc/caddy/Caddyfile; then
      echo 'Previous image is running again. Inspect the failed Actions run before retrying.' >&2
    else
      echo "Automatic rollback failed. Recover using $record and deploy/backups/$release." >&2
    fi
  fi
  exit "${status:-1}"
}
trap rollback ERR
trap 'false' HUP INT TERM
# Stop writes before the consistent SQLite snapshots. This is a brief maintenance window.
stopped=true
docker compose --project-directory "$root" --env-file "$root/deploy/.env" -f "$root/compose.yaml" stop app
candidate run --rm --no-deps --user 0:0 --cap-add DAC_OVERRIDE --entrypoint node \
  --volume "$root/deploy/backups:/backups" app deploy/backup-release.mjs "/backups/$release"
cp "$incoming/compose.yaml" compose.yaml
cp "$incoming/compose.cicd.yaml" compose.cicd.yaml
cp "$incoming/Caddyfile" deploy/Caddyfile
installed=true
compose up --detach --no-build --pull never --wait --wait-timeout 180 app proxy
compose exec -T proxy caddy reload --config /etc/caddy/Caddyfile
running="$(compose ps --quiet app)"
[[ "$(docker inspect --format '{{.Image}}' "$running")" == "$new_id" ]]
origin="$(docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "$running" | sed -n 's/^EMDASH_SITE_URL=//p')"
[[ "$origin" =~ ^https://[A-Za-z0-9.-]+(:[0-9]+)?$ ]]
curl --fail --silent --show-error --connect-timeout 10 --max-time 30 --retry 3 --retry-connrefused "$origin/" --output /dev/null
printf '%s\n' "$tag" > deploy/releases/current-image.tmp
mv deploy/releases/current-image.tmp deploy/releases/current-image
printf '%s\n' "$run_number" > deploy/releases/last-run-number.tmp
mv deploy/releases/last-run-number.tmp deploy/releases/last-run-number
trap - ERR HUP INT TERM
# The image is loaded and retained in Docker; do not retain a second large tarball on disk.
rm -f "$incoming/site-image.tar.gz"
echo "Release $release is healthy. Previous image: el-bebe:$old_tag"
