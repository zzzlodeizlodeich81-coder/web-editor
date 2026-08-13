const fs = require('fs');
const { execSync } = require('child_process');

const rawData = process.env.PROJECT_DATA;
if (!rawData) {
  console.error('Ошибка: Не передан PROJECT_DATA');
  process.exit(1);
}

const project = JSON.parse(rawData);
console.log('Старт сборки проекта, клипов:', project.clips.length);

let inputFilesList = '';
project.clips.forEach((clip, index) => {
  const localName = `input_${index}.mp4`;
  console.log(`Скачиваем ${clip.src} -> ${localName}`);
  execSync(`curl -L "${clip.src}" -o ${localName}`);
  
  execSync(`ffmpeg -i ${localName} -ss ${clip.start} -to ${clip.end} -c:v libx264 -c:a aac temp_trimmed_${index}.mp4`);
  inputFilesList += `file 'temp_trimmed_${index}.mp4'\n`;
});

fs.writeFileSync('mylist.txt', inputFilesList);

console.log('Склейка видео...');
execSync('ffmpeg -f concat -safe 0 -i mylist.txt -c copy merged.mp4');

let filterComplex = '';
if (project.texts && project.texts.length > 0) {
  const t = project.texts[0];
  filterComplex = `-vf "drawtext=text='${t.text}':x=(w-text_w)*(${t.x}/100):y=(h-text_h)*(${t.y}/100):fontsize=${t.size}:fontcolor=${t.color}"`;
}

console.log('Финальный рендеринг...');
execSync(`ffmpeg -i merged.mp4 ${filterComplex} -c:v libx264 -pix_fmt yuv420p output.mp4`);
console.log('Рендеринг завершен: output.mp4');
