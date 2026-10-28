# Пролёты из одного кадра: 10 промптов студии «Нейро Отличник»

Промпты для нейросетей, которые оживляют картинку в видео. На входе — одна ваша визуализация. На выходе — клип на 5–10 секунд для защиты, портфолио и сторис.

**Где запускать.** Runway — точнее всех управляет камерой. Также Kling, Veo, Luma, Hailuo. Для шаблонных эффектов — Pika.

**Правила**

1. Описывайте движение камеры, а не дом: дом уже есть на картинке.
2. Один ход камеры — один клип на 5 секунд. Длинный ролик соберите из клипов в CapCut или Premiere, переходы — простое затемнение.
3. Фразу «The building is static and rigid» не удаляйте: она держит геометрию. Если есть поле negative prompt, добавьте: morphing, warping, melting, bending lines, extra windows, text, watermark.
4. Исходник — от 1920 px, лучше 16:9. Готовый клип проверьте по кадрам: окна и углы кровли не должны «дышать».

## 01. Медленный наезд к входу

*Когда:* Самый надёжный первый клип

```text
Slow, smooth dolly-in toward the entrance of the house at eye level, about 2 meters of travel over 5 seconds. Steady gimbal movement, no shake. Leaves and grass move gently in a light breeze. The building is static and rigid: no warping, no morphing, all lines stay straight. Photorealistic, cinematic architectural film.
```

*Совет:* Ракурс почти не меняется, поэтому нейросети почти нечего придумывать. Начинайте с этого хода.

## 02. Облёт по дуге

*Когда:* Показать объём дома

```text
Smooth orbit to the right around the house, about 20–30 degrees, keeping the building centered in the frame. Camera at eye level, constant speed, gimbal-stabilized. Parallax between the foreground plants, the house and the background trees. The building is static and rigid and keeps its exact shape and proportions: no warping, no morphing. Natural daylight, cinematic architectural film.
```

*Совет:* Не просите больше 30°: обратную сторону дома нейросеть не видела и придумает сама. Для полного облёта нужна 3D-модель.

## 03. Подъём дрона

*Когда:* Показать кровлю и участок

```text
The camera rises slowly and vertically from eye level to a low drone height, tilting down slightly to reveal the roof and the site around the house. Smooth, constant speed. The building is static and rigid, roof lines stay straight, no morphing. Trees sway gently. Aerial architectural cinematography.
```

*Совет:* Лучше всего работает, когда на исходном кадре видна часть кровли. Иначе крышу нейросеть нарисует сама — сверьте её с проектом.

## 04. Отъезд с раскрытием

*Когда:* Финальный общий план

```text
Slow pull-back from the facade: the camera moves backward and slightly up, gradually revealing more of the garden and the trees in the foreground. Smooth constant speed, gimbal-stabilized. The building is static and rigid, keeps its exact shape, all lines stay straight, no morphing. Natural light, cinematic architectural film.
```

*Совет:* Если сервис принимает первый и последний кадр (Kling, Runway, Luma), поставьте первым крупный план фасада, а последним — общий вид.

## 05. Боковой проезд с параллаксом

*Когда:* Длинный фасад, есть передний план

```text
Lateral tracking shot moving slowly from left to right along the facade, camera at eye level and parallel to the house. Foreground trees and grasses pass in front of the camera, creating depth and parallax. Smooth constant speed. The building is static, rigid and undistorted; all verticals stay vertical. Calm, cinematic architectural film.
```

*Совет:* Без переднего плана ход не работает. Сначала добавьте растения промптом «Ландшафт и озеленение» из набора по улучшению.

## 06. Проход сквозь листву

*Когда:* Эффектное начало ролика

```text
The camera slowly pushes forward through out-of-focus foreground branches and leaves, which part and slide out of the frame to reveal the house. Focus pulls from the leaves to the building. Smooth movement at eye level. The building is static and rigid: no warping, no morphing. Natural light, cinematic depth of field.
```

*Совет:* Подходит для домов в саду или в лесу. На голом участке листве неоткуда взяться.

## 07. Таймлапс: день → вечер

*Когда:* Есть дневной и вечерний рендер

```text
Static locked-off camera. Time-lapse from late afternoon to blue hour: the sun sets, shadows lengthen and fade, the sky turns from warm to deep blue, warm lights inside the house switch on room by room, landscape lights turn on. Clouds drift across the sky. The building and the camera do not move at all, no morphing.
```

*Совет:* Загрузите дневной рендер первым кадром, а вечерний — последним. Так свет совпадёт с вашим проектом.

## 08. Живая статика

*Когда:* Сторис, обложка поста, фон для защиты

```text
Static camera, no camera movement. Only nature moves: leaves and grasses sway in a light breeze, clouds drift slowly, reflections shimmer softly on the glass and the water, a bird flies across the sky. The architecture stays perfectly still and sharp. Photorealistic, calm, seamless loop.
```

*Совет:* Самый надёжный формат: геометрия не «плывёт» совсем. Хорошо ставится фоном на слайд защиты.

## 09. Интерьер: плавная панорама

*Когда:* Рендер гостиной или кухни

```text
Slow horizontal pan from left to right across the living room at eye level, from the window wall toward the [kitchen]. Smooth, steady, constant speed. Sunlight from the windows, sheer curtains moving slightly, dust particles in the light beams. Furniture and walls are static and rigid, straight lines stay straight, no morphing. Photorealistic interior design film.
```

*Совет:* Не просите поворот больше 30–40°: дальше начинается комната, которой нет на рендере.

## 10. Подход к двери

*Когда:* Финальный кадр ролика

```text
First-person walk toward the front door along the path, slow and steady at eye level, with slight natural head movement. The door ahead stays sharp and grows in the frame; the camera stops just before the entrance. Plants along the path pass by on both sides. The house is static and rigid: no warping, no morphing, straight lines. Morning light, photorealistic.
```

*Совет:* Остановите камеру до двери. Проход внутрь нейросети пока придумывают плохо.

## Ролик на 25 секунд

Пять клипов по 5 секунд — и готовый ролик для защиты или портфолио. Каждый клип — из своего промпта.

06 Проход сквозь листву → 01 Медленный наезд к входу → 02 Облёт по дуге → 07 Таймлапс: день → вечер → 10 Подход к двери

Склейте клипы в CapCut или Premiere простым затемнением. Для таймлапса нужен вечерний кадр того же ракурса — его сделает промпт «Синий час» из набора по улучшению.
