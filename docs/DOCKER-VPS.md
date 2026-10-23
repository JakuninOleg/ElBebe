# Полный сайт и EmDash на VPS

Это серверная сборка Astro + EmDash + SQLite, а не Vercel showcase. Сайт, штатная админка, заявки и печатные документы работают в одном Node-процессе. Caddy принимает HTTPS. Отдельный сервер PostgreSQL/MySQL не требуется.

## Состав

- `Dockerfile`: Linux/Node 24, `npm ci` по lock-файлу, обычный `npm run build`, запуск от uid/gid 1000. Сборка не получает `.env`, базы, uploads, ключи и локальный `node_modules`.
- `compose.yaml`: приложение и Caddy. Снаружи доступны только 80 и 443; порт Node 4321 не опубликован. Caddy перезаписывает `X-Real-IP`, приложение доверяет только его явно заданному IP.
- Том `DATA_VOLUME` (по умолчанию `el-bebe_site_data`): `/var/lib/el-bebe/cms/data.db`, `uploads/`, `office/office.sqlite`, `sessions/`, отметка завершённого импорта. Пересборка контейнера не заменяет эти данные.
- Фото, адаптивные варианты, шрифты и три оптимизированных видео из `public/` входят в образ через `dist/client`. Новые загрузки EmDash лежат в постоянном `uploads`. Поддержка Range остаётся у штатного Node/EmDash media handler.
- Ключ шифрования EmDash монтируется только приложению как secret. Существующий ключ переносится вместе с базой; при обновлениях не генерируется заново.
- `/healthz` проверяет запрос к CMS-базе. Caddy закрывает этот технический адрес снаружи. На старте проверяются ключ, домен, целостность CMS и завершённый импорт. Пустой сайт не создаётся автоматически.

Доступ поисковиков остаётся закрытым: HTML/robots сохраняют текущий режим, Caddy добавляет `X-Robots-Tag: noindex, nofollow`. Открытие индексации — отдельный шаг запуска. Форма в этой полной сборке сохраняет заявки в приватную БД; уведомления на почту/в мессенджеры пока не подключены.

## 1. Экспорт существующих данных

Нужен Node 24. Остановите запись в исходную CMS на время финального экспорта: SQLite snapshot консистентен даже при WAL, но БД и медиатека должны соответствовать одному состоянию. Не запускайте seed/reset/init.

Пример для текущего рабочего репозитория Олега в PowerShell, из каталога с этим скриптом:

```powershell
node deploy/data.mjs export `
  --project 'C:/Users/olegk/code/oj-emdash' `
  --out 'C:/private/el-bebe-transfer-2026-10-24'
```

Скрипт читает штатную `data.db` только на чтение, делает SQLite backup с учётом WAL, копирует всю `uploads`, проверяет наличие файлов из каталога media. Ключ и путь office берутся из окружения или локальных `.env*` исходного проекта. Если ключ хранится отдельным файлом, передайте `--key-file /private/existing-key`; для другого хранилища заявок — `--office-db /private/office.sqlite`. Если office-базы ещё нет, это явно сообщается; после импорта она создастся при первом обращении к офисным данным.

Результат: `data/`, `manifest.json` с SHA-256 и `emdash-encryption-key`. Файлы сессий не переносятся: потребуется штатный повторный вход. Экспорт не перезаписывает существующий каталог и отказывается писать пакет в исходный проект/медиатеку. Пакет содержит приватные данные и ключ: храните его вне сайта и Git, передавайте по SSH/SFTP.

```powershell
scp -r 'C:/private/el-bebe-transfer-2026-10-24' user@VPS:/srv/el-bebe-transfer
```

## 2. Подготовка VPS

На Linux VPS установите Docker Engine и Compose plugin по официальной инструкции. Домен должен указывать на VPS; входящие TCP 80/443 и, для HTTP/3, UDP 443 должны доходить до Caddy. Если эти порты уже занимает nginx/другая панель, сначала согласуйте схему проксирования. Установщик не меняет существующие сайты автоматически.

Исходники клонируются отдельно от пакета данных:

```bash
git clone https://github.com/JakuninOleg/ElBebe.git /srv/el-bebe
cd /srv/el-bebe
cp deploy/.env.example deploy/.env
```

В `deploy/.env` укажите свой `DOMAIN` без протокола/пути и `ACME_EMAIL`. `IMAGE_TAG` можно назначать равным версии релиза. Если Docker-подсеть занята, одновременно измените `DOCKER_SUBNET`, `DOCKER_PROXY_IP`, `DOCKER_APP_IP`; IP должны принадлежать этой подсети и отличаться от её шлюза. `DATA_VOLUME` не меняют при обычном обновлении.

Установите **существующий** ключ из пакета. Родительский каталог закрыт, файл доступен uid 1000 приложения:

```bash
sudo install -d -m 0700 deploy/secrets
sudo install -m 0400 -o 1000 -g 1000 \
  /srv/el-bebe-transfer/emdash-encryption-key \
  deploy/secrets/emdash-encryption-key
docker compose --env-file deploy/.env config --quiet
docker compose --env-file deploy/.env build --pull
```

Домен входит в настройки публичного origin и разрешённых forwarded headers при сборке. При его изменении образ нужно пересобрать; старт с другим доменом будет остановлен. Секреты в build arguments не передаются.

## 3. Первый импорт и запуск

Импорт разрешён только в пустой том. Это одноразовый служебный контейнер от root с двумя файловыми capabilities; публичное приложение продолжает запускаться от uid 1000 со всеми capabilities выключенными. Пакет на хосте может оставаться закрытым для обычных пользователей.

```bash
docker compose --env-file deploy/.env run --rm --no-deps \
  --user 0:0 --cap-add CHOWN --cap-add DAC_OVERRIDE \
  --entrypoint node \
  --volume /srv/el-bebe-transfer:/import:ro \
  app deploy/data.mjs restore --from /import

docker compose --env-file deploy/.env up -d --wait
docker compose --env-file deploy/.env ps
docker compose --env-file deploy/.env logs --tail 50 app proxy
```

Проверяются контрольные суммы, состав пакета, соответствие смонтированного ключа и целостность SQLite. Права тома устанавливаются для uid/gid 1000. Существующие данные никогда не заменяются. При прерванном импорте приложение не стартует без отметки завершения; не удаляйте содержимое рабочего тома для повторной попытки — используйте новый пустой `DATA_VOLUME`.

После успешного HTTPS:

```bash
curl -I https://ВАШ-ДОМЕН/
```

Проверьте реальные цены/фото, воспроизведение и перемотку видео, `/_emdash/admin`, изменение и публикацию одной записи, тестовую заявку в «Заявки родителей», сохранение/открытие документа для печати. Затем пересоздайте приложение и убедитесь, что запись и медиатека сохранились:

```bash
docker compose --env-file deploy/.env up -d --force-recreate --wait app
```

Учётные записи из CMS сохраняются. Passkey, созданный для `localhost`, нельзя использовать как passkey другого домена: перед окончательным переносом подготовьте штатный способ входа владельца для боевого домена и зарегистрируйте passkey на нём. Почта/OAuth, если используются для входа, должны быть настроены в штатной EmDash. Dev-bypass в production не включается. Проверьте также публичный URL в настройках CMS, если там был сохранён локальный адрес.

## 4. Бэкап и обновление

Для согласованного бэкапа CMS + файлов кратковременно остановите запись. Базы копируются SQLite backup API; копирование одного `data.db` при активном WAL не используется.

```bash
sudo install -d -m 0700 -o 1000 -g 1000 deploy/backups
docker compose --env-file deploy/.env stop proxy app
docker compose --env-file deploy/.env run --rm --no-deps \
  --entrypoint node \
  --volume "$PWD/deploy/backups:/backup" \
  app deploy/data.mjs export --out /backup/backup-2026-10-24
docker compose --env-file deploy/.env up -d --wait
```

Каждому бэкапу — новое имя. Копию с ключом храните также вне VPS. Перед обновлением сохраните предыдущий image tag и проверенный бэкап, затем обновите исходники, назначьте новый `IMAGE_TAG` в `deploy/.env` и выполните:

```bash
git pull --ff-only
docker compose --env-file deploy/.env build --pull
docker compose --env-file deploy/.env up -d --wait
```

Том данных и ключ остаются прежними. EmDash выполняет штатные миграции схемы; перед обновлением её версии сначала проверяйте восстановление на отдельной копии. Не запускайте starter seed.

Для восстановления после неудачного обновления: остановите стек командой `docker compose --env-file deploy/.env down` **без `-v`**, верните совместимый image tag/исходники, установите в `deploy/.env` новое имя `DATA_VOLUME`, импортируйте соответствующий бэкап как в разделе 3 и запустите стек. Старый том останется для проверки; импорт никогда не затирает его. Не используйте `down -v` или `docker volume prune` для штатного обновления.

## Проверки подготовки

- Тесты проверяют перенос открытой WAL-базы с пользователями/контентом, приватных записей и байтов фото/видео; восстановление, ключи, SHA-256, отказ от перезаписи и старт без импорта.
- Compose проверяется настоящим Docker Compose CLI. Проверяются типы и обе Astro-сборки.
- Linux Docker Engine на текущем компьютере отсутствует: сборка образа, права Linux-томов, выдача сертификата и реальное пересоздание контейнера должны пройти на Docker-хосте перед боевым запуском. Это не выдаётся за уже выполненный Docker smoke test.

Официальные источники: [Astro Node standalone](https://docs.astro.build/en/guides/integrations-guide/node/), [Docker Engine](https://docs.docker.com/engine/install/), [Compose](https://docs.docker.com/compose/), [тома Docker](https://docs.docker.com/engine/storage/volumes/), [secrets Compose](https://docs.docker.com/reference/compose-file/secrets/), [HTTPS Caddy](https://caddyserver.com/docs/quick-starts/https).
