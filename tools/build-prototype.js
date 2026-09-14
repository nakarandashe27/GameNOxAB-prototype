/*
 * Собирает прототип в один HTML-файл (ядро core.js встраивается в страницу).
 * Запуск: node tools/build-prototype.js
 *   prototype/dist/soberi-proekt.html — самостоятельный файл, можно переслать сторонам и открыть двойным кликом
 *   prototype/dist/artifact.html      — то же без <head>, для публикации ссылкой (обёртку добавляет хостинг)
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'prototype');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const core = fs.readFileSync(path.join(root, 'core.js'), 'utf8');

const tag = '<script src="core.js"></script>';
if (!html.includes(tag)) throw new Error('В index.html не найден тег подключения core.js');

const body = html.replace(tag, () => '<script>\n' + core + '\n</script>');
const standalone =
  '<!doctype html>\n<html lang="ru">\n<head>\n<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
  body.replace('<meta name="description"', '</head>\n<body>\n<meta name="description"') + '\n</body>\n</html>\n';

// <title>, <link> и <style> должны оказаться в <head>: переносим границу head/body после </style>
const fixed = standalone.replace('</head>\n<body>\n', '').replace('</style>\n', '</style>\n</head>\n<body>\n');

const dist = path.join(root, 'dist');
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(path.join(dist, 'soberi-proekt.html'), fixed);
fs.writeFileSync(path.join(dist, 'artifact.html'), body);
console.log('Собрано: dist/soberi-proekt.html', (fixed.length / 1024).toFixed(1), 'КБ; dist/artifact.html', (body.length / 1024).toFixed(1), 'КБ');
