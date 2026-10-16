# Временные изображения Эльбебе

16.10.2026 утверждённый мобильный эскиз перенесён в вёрстку. Коллаж с прозрачностью `hero-mobile-collage-v2.webp` подготовлен встроенным ImageGen из утверждённого изображения; задание сохранено в `docs/mobile-hero-collage-prompt.json`. В коллаж не входят интерфейсный текст, кнопка, логотип, навигация и иконки преимуществ. Это самостоятельные HTML/SVG-элементы. `picture/source` загружает коллаж на мобильных ширинах, а прежнее основное фото — на десктопе.

16.10.2026 по запросу пользователя выровнен логотип: `logo-straight-v2.webp` с прозрачным фоном, горизонтальным рядом пазлов и подписями. Новая версия подключена в шапке и подвале, прежний файл сохранён. Встроенным ImageGen создан и затем утверждён мобильный эскиз первого экрана `docs/design/mobile-hero-concept-v2.webp`: полноширинный текст и кнопка над фотоколлажем. Полные задания и исходные генерации записаны в `docs/mobile-hero-prompts.json`.

15.10.2026 добавлены `camera-phone.webp`, `family-capital.webp` и четыре `teacher-preview-*.webp`. Смартфон показывает иллюстративное занятие без интерфейса трансляции; это не подтверждение онлайн-доступа к камерам. Семейное фото и портреты также сгенерированы, не изображают клиентов или сотрудников сада. У блока команды есть явная подпись; временные портреты показываются только при отсутствии опубликованных сотрудников в EmDash. После добавления команды карточки берут имена, должности, фотографии и описания из CMS. Полные задания встроенному ImageGen сохранены в `docs/family-section-image-prompts.json`.

Созданы встроенным инструментом ImageGen по заданию пользователя. Исходники PNG находятся в локальном каталоге генераций Codex; точное соответствие сохранено в `scripts/image-sources.json`. `node scripts/prepare-images.mjs` уменьшает и переводит их в WebP с помощью Sharp. Содержание изображений этим скриптом не меняется. Кадрирование задаётся в CSS.

Направление: естественный дневной свет, тёплое дошкольное пространство, дерево, живые эмоции, мягкие цвета. Изображения не являются свидетельством условий конкретного сада. Все персонажи вымышлены. Надписи, бренды, водяные знаки и визуальные обещания услуг исключены.

Использованные задания по сюжетам:

- `hero.webp` — вертикальный фотографический портрет дошкольницы, рисующей кистью за столом; светлая комната, улыбающееся лицо, краски и естественная поза.
- `together.webp` — педагог и трое детей вместе строят из деревянного конструктора; горизонтальный кадр, тёплый дневной свет.
- `play.webp` — двое дошкольников увлечённо играют с цветными деревянными блоками.
- `garden.webp` — дети во дворе, девочка в жёлтой футболке радуется прогулке; зелень и солнце.
- `room.webp` — светлая комната детского сада с деревянной мебелью, открытыми полками, растениями и местом для игры; без людей.
- `speech.webp` — мальчик и педагог рассматривают книгу и разговаривают.
- `life.webp` — девочка поливает растение маленькой лейкой; бытовые навыки и забота.
- `playground.webp` — деревянный игровой комплекс в зелёном дворе; без людей.
- `logo.webp` — временный плоский логотип по референсу: зайчик в очках, цветные детали пазла, русское название «Эльбебе», подписи «Детский сад» и «Сочи», прозрачный фон.

До реализации также создан и просмотрен отдельный визуальный эскиз первого экрана по присланному референсу. Он использован как ориентир композиции, а не как фоновый скриншот страницы.

Логотип нужно заменить исходником владельца вместе с реальными фотографиями. Отзывы не генерировались.


## Правки по референсам, 15 октября 2026

- `bunny-v2.webp` — отдельный прозрачный маскот: белый зайчик с розовыми ушами и круглыми чёрными очками, выглядывает двумя лапками. Ориентир персонажа — временный логотип проекта.
- `camera-v2.webp` — прозрачная иллюстрация комнатной камеры с фиолетовым объективом, коралловым сердечком и мятными листьями. Палитра и мягкая рисованная фактура согласованы с сайтом.
- `hello-portrait-v2.webp` — вымышленная девочка в жёлтой футболке за столом, подбородок на сложенных руках. Отдельный портрет для фигурного баннера знакомства.

Все три файла созданы встроенным ImageGen, просмотрены перед использованием, преобразованы Sharp в WebP без изменения содержания. Прозрачность маскота и камеры сохранена. Пути к исходным PNG и размеры вывода добавлены в `scripts/image-sources.json`. Маски фотографий, подложки и декор сделаны в SVG/CSS.

Точное задание для портрета:

> Use case: photorealistic-natural. Create a warm candid kindergarten website portrait photograph, square composition. A cheerful preschool girl aged around four, curly light brown hair loosely tied back, gentle bright smile, wearing a plain warm yellow cotton shirt. She sits behind a low pale wooden table and rests her chin comfortably on her two folded hands. Show her entire head and hair with generous space above, both hands together in one natural resting pose with anatomically correct fingers, shoulders and upper chest. Her face is near the horizontal center with a slight leftward bias. Soft natural window daylight, sunlit ivory classroom background with green plants and wooden furniture blurred softly. Realistic skin texture, real fabric, natural proportions, calm kind expression, authentic lifestyle photography. Only one person. No other children, no toys in foreground, no logos, no text, no jewelry, no watermark. This is a fictional temporary illustration for a prototype, not a photograph of an actual school's child. Keep the entire hair and face within the central 65% of the frame so the photo can be masked into an organic rounded shape.


Для повторного преобразования задайте EL_BEBE_IMAGE_SOURCE_DIR — локальный каталог исходных PNG. В scripts/image-sources.json сохранены имена файлов; машинные абсолютные пути не публикуются. В готовой Vercel-сборке используются уже подготовленные WebP.


## Поза зайца для мобильного баннера, 15 октября 2026

`bunny-standing-v3.webp` — вариант существующего маскота в полный рост на прозрачном фоне. Получен встроенным ImageGen с `bunny-v2.webp` как референсом персонажа, просмотрен и преобразован Sharp в WebP шириной 500 px с сохранением прозрачности. В мобильной композиции расположен справа на жёлтой подложке; десктопный персонаж опирается на коралловую фигуру перед фотографией.

Точное задание:

> Use case: logo-brand character pose variation for a kindergarten website. Edit the supplied rabbit mascot reference to create a full-body standing pose of exactly the same white rabbit character. Preserve its recognisable cheerful face, large round black glasses, bright black eyes with highlights, pink cheeks, small coral pink nose, two prominent teeth, white fur, long white ears with pink inner ears, and crisp hand-drawn black outlines. The whole rabbit is visible from ear tips to both feet, with a small white round belly and compact child-friendly proportions. Pose: standing on both visible feet on one flat baseline, body turned slightly towards the left, head tilted affectionately towards the left as if looking at nearby website text. Both small front paws rest comfortably near its belly, one can touch the other; natural friendly pose with NO waving arm. Gently playful illustrated ink style with subtle soft pink shading, same style and character as reference, no accessories besides its existing glasses. Compose as a single isolated upright character, fill most of a portrait canvas, keep small transparent margins on all sides. It will sit at the bottom-right edge of a pale pink web banner. True transparent background. No scenery, no platform, no badge, no text, no letters, no numbers, no logos, no sticker border, no cast shadow outside the character. Keep outline thickness moderate so the mascot is refined and readable at 100 px wide.
