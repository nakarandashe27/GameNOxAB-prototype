# Улучшение визуализаций: 10 промптов студии «Нейро Отличник»

Промпты для нейросетей, которые редактируют картинку по тексту. На входе — ваш рендер. На выходе — тот же дом, но со светом, материалами и жизнью, как в кадрах студии.

**Где запускать.** Nano Banana (Gemini), ChatGPT, Flux Kontext в Krea AI, Midjourney Edit. Короткие правки — в Generative Fill Photoshop.

**Правила**

1. Всегда прикладывайте исходный рендер. В каждом промпте уже есть строка, которая защищает геометрию: её не удаляйте.
2. Один проход — одна задача. Сначала свет, потом материалы, потом детали.
3. Делайте 3–4 варианта и собирайте лучшее маской в Photoshop — это «Нейро Отличный метод» из чек-листа.
4. Промпты на английском: так модели понимают точнее. Свои вставки в [скобках] тоже пишите по-английски.

## 01. Фотореализм без потери геометрии

*Когда:* Первый проход для любого рендера

```text
Enhance this architectural render into a photorealistic architectural photograph. Keep the building geometry, proportions, window and door layout, roof shape, camera angle and framing exactly as in the original. Improve only the lighting, material textures, vegetation and sky: soft natural daylight, physically correct shadows, realistic glass with reflections, subtle imperfections on surfaces. No plastic CGI look. Professional architectural photography, 35mm lens, high detail.
```

*Совет:* Если нейросеть всё же сдвинула окна, уменьшите силу изменений (strength или creativity) и повторите.

## 02. Золотой час

*Когда:* Тёплый кадр для обложки и портфолио

```text
Relight this scene to golden hour, about 40 minutes before sunset. Warm low sun from the side, long soft shadows across the facade and the lawn, warm glow on the materials, gentle haze in the air, sky graded from warm peach to soft blue. Turn on warm 2700K interior lights so the rooms glow through the glass. Keep the building geometry, materials, camera angle and framing exactly as in the original.
```

*Совет:* Хороший рендер — это на 80% свет. Меняйте время суток отдельным проходом, не вместе с материалами.

## 03. Синий час с тёплыми окнами

*Когда:* Вечерняя пара к дневному кадру

```text
Turn this scene into blue hour dusk. Deep blue evening sky with a faint warm band at the horizon, interiors lit with warm 2700K light glowing through all windows, linear LED strips under the eaves and soffits, soft landscape uplights on trees and paths. Low ambient light, cool and slightly dark exterior surfaces, glass showing both reflections and the lit interior. Keep the building geometry, window layout, camera angle and framing unchanged.
```

*Совет:* Сделайте вечерний кадр из того же ракурса, что и дневной. Пара «день и вечер» показывает, что проект живёт в любое время.

## 04. Живые отражения в стекле

*Когда:* Окна выглядят чёрными или пустыми

```text
Make all glazing photorealistic: reflections of the sky, clouds and surrounding trees on the glass, slight transparency so the furnished interior with curtains and lamps is visible inside, correct Fresnel effect with stronger reflections at grazing angles. Keep the thin window frames, mullions and their spacing exactly as they are. Do not change anything else in the image.
```

*Совет:* Пустое чёрное или голубое стекло — главный признак учебного рендера. Этот промпт чинит именно его.

## 05. Ландшафт и озеленение

*Когда:* Дом стоит на голом газоне

```text
Add mature, natural landscaping around the building: ornamental grasses, ferns and flowering shrubs along the foundation, a stone stepping path with groundcover between the stones, a few young trees at the edges of the frame, a lawn with natural color variation. Layered, slightly wild planting typical of the temperate climate of central Russia. Do not cover the windows, the entrance or the main facade. Keep the building and the camera unchanged.
```

*Совет:* Ставьте растения в передний план: так у кадра появляется глубина. Для юга замените климат на «Black Sea coast».

## 06. Фактура материалов

*Когда:* Материалы плоские, как пластик

```text
Increase the realism of the materials without changing their color or layout: [vertical larch planks] with visible wood grain and thin shadow gaps, [board-formed concrete] with subtle pores and formwork marks, matte black metal flashings and parapet with crisp edges, natural stone with color variation. Add slight weathering and imperfections. Keep the building geometry, camera angle and lighting unchanged.
```

*Совет:* Замените примеры в скобках на свои материалы. Порода дерева важна: larch, oak и pine дают разную фактуру.

## 07. Жизнь в кадре

*Когда:* Кадр для соцсетей и портфолио

```text
Add subtle signs of life without distracting from the architecture: two people walking along the path at correct human scale, a dog on the lawn, a few fallen leaves on the paving, a small bird on the roof edge. All additions are small, lit consistently with the scene and do not overlap the windows or the entrance. Keep everything else unchanged.
```

*Совет:* Одного-двух акцентов достаточно. Стаффаж показывает масштаб, а не спорит с домом. Для строгой подачи делайте кадр без сюжета.

## 08. Первый снег

*Когда:* Сезонный кадр для серии

```text
Turn the season into early winter with the first snow: a thin, even layer of fresh snow on the roof, terrace, railings and tree branches, a light dusting on the lawn with grass showing through, overcast soft daylight, a cool palette, warm 2700K light in the windows, a faint trail of footprints on the path. Keep the building geometry, materials, camera angle and framing exactly as in the original.
```

*Совет:* Вместо снега попробуйте «wet paving after rain with reflections» или «light morning mist between the trees».

## 09. Чистка ИИ-артефактов

*Когда:* После любого улучшения

```text
Fix AI rendering artifacts while keeping the image otherwise identical: straighten all vertical and horizontal architectural lines, make the window mullions evenly spaced and consistent, restore clean sharp edges on the roof, parapet and slabs, remove melted, duplicated or floating objects, remove any text, signs or watermarks. Do not add new elements and do not change the lighting, materials or composition.
```

*Совет:* Потом проверьте кадр в масштабе 100%: окна, перила, углы кровли. Остатки артефактов уберите в Generative Fill.

## 10. Скриншот модели → визуализация

*Когда:* Есть только модель, рендера нет

```text
Turn this 3D model screenshot into a photorealistic architectural visualization. Preserve the exact massing, roof shape, number of floors, window and door openings and their positions; do not add or remove any volumes. Materials: [facade material], [roof material], [window frames]. Setting: [pine forest on a gentle slope]. Time: [golden hour]. Eye-level camera, 28mm lens, perfectly vertical lines, natural light, architectural photography.
```

*Совет:* В Prome AI и Leonardo AI ставьте влияние исходника на максимум и добавьте картинку-референс по настроению.

## Порядок проходов

Как студия проводит рендер через набор: от сырого кадра к готовому. Пропускайте шаги, которые вашему кадру не нужны.

10 Скриншот модели → визуализация → 01 Фотореализм без потери геометрии → 02 Золотой час → 04 Живые отражения в стекле → 05 Ландшафт и озеленение → 06 Фактура материалов → 07 Жизнь в кадре → 09 Чистка ИИ-артефактов

Вместо 02 можно взять 03 или 08 — но только один из них: время суток и сезон меняйте одним проходом. После каждого шага сохраняйте вариант и собирайте лучшее маской.
