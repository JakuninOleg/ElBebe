# Временные изображения Эльбебе

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

Логотип нужно заменить исходником владельца вместе с реальными фотографиями. Фотографии воспитателей и отзывы не генерировались.


## Правки по референсам, 15 октября 2026

- `bunny-v2.webp` — отдельный прозрачный маскот: белый зайчик с розовыми ушами и круглыми чёрными очками, выглядывает двумя лапками. Ориентир персонажа — временный логотип проекта.
- `camera-v2.webp` — прозрачная иллюстрация комнатной камеры с фиолетовым объективом, коралловым сердечком и мятными листьями. Палитра и мягкая рисованная фактура согласованы с сайтом.
- `hello-portrait-v2.webp` — вымышленная девочка в жёлтой футболке за столом, подбородок на сложенных руках. Отдельный портрет для фигурного баннера знакомства.

Все три файла созданы встроенным ImageGen, просмотрены перед использованием, преобразованы Sharp в WebP без изменения содержания. Прозрачность маскота и камеры сохранена. Пути к исходным PNG и размеры вывода добавлены в `scripts/image-sources.json`. Маски фотографий, подложки и декор сделаны в SVG/CSS.

Точное задание для портрета:

> Use case: photorealistic-natural. Create a warm candid kindergarten website portrait photograph, square composition. A cheerful preschool girl aged around four, curly light brown hair loosely tied back, gentle bright smile, wearing a plain warm yellow cotton shirt. She sits behind a low pale wooden table and rests her chin comfortably on her two folded hands. Show her entire head and hair with generous space above, both hands together in one natural resting pose with anatomically correct fingers, shoulders and upper chest. Her face is near the horizontal center with a slight leftward bias. Soft natural window daylight, sunlit ivory classroom background with green plants and wooden furniture blurred softly. Realistic skin texture, real fabric, natural proportions, calm kind expression, authentic lifestyle photography. Only one person. No other children, no toys in foreground, no logos, no text, no jewelry, no watermark. This is a fictional temporary illustration for a prototype, not a photograph of an actual school's child. Keep the entire hair and face within the central 65% of the frame so the photo can be masked into an organic rounded shape.


Для повторного преобразования задайте EL_BEBE_IMAGE_SOURCE_DIR — локальный каталог исходных PNG. В scripts/image-sources.json сохранены имена файлов; машинные абсолютные пути не публикуются. В готовой Vercel-сборке используются уже подготовленные WebP.
