// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// Adding an event listener to an html button which will send open-dir-dialog to the main process
const ipc = require('electron').ipcRenderer;
// const { remote } = require('electron');

const selectSourceBtn = document.getElementById('select-source');
selectSourceBtn.addEventListener('click', (event) => {
  ipc.send('open-src-dialog');
});

ipc.on('select-source', (event, path) => {
  document.getElementById('selected-source').innerHTML = path;
});

const selectOutputBtn = document.getElementById('select-output');
selectOutputBtn.addEventListener('click', (event) => {
  ipc.send('open-output-dialog');
});

ipc.on('select-output', (event, path) => {
  document.getElementById('selected-output').innerHTML = path;
});

ipc.on('select-output', (event, path) => {
  document.getElementById('selected-output').innerHTML = path;
});

const processImages = () => {
  const fs = require('fs');
  const path = require('path');
  const { nativeImage } = require('electron');
  const moment = require('moment');

  let fileFormat = 'png';
  fileFormat = document.querySelector('input[name="file-type"]:checked').value;

  const srcDir = document.getElementById('selected-source').innerHTML;
  const outputDir = document.getElementById('selected-output').innerHTML;

  const largeImageDir = `${outputDir}/largeImage`;
  const thumbImageDir = `${outputDir}/thumb`;
  const smallThumbDir = `${outputDir}/smallThumb`;

  try {
    fs.accessSync(outputDir, fs.constants.W_OK);
    console.log('Output directory is writable.');
  } catch (err) {
    console.error('Error: Output directory is not accessible.');
    process.exit(1);
  }

  try {
    fs.accessSync(largeImageDir, fs.constants.F_OK);
    console.log('LargeImage output directory exists.');
  } catch (err) {
    console.log(`Creating largeImage directory: ${largeImageDir}`);
    fs.mkdirSync(largeImageDir);
  }

  try {
    fs.accessSync(thumbImageDir, fs.constants.F_OK);
    console.log('Thumb output directory exists.');
  } catch (err) {
    console.log(`Creating thumb directory: ${thumbImageDir}`);
    fs.mkdirSync(thumbImageDir);
  }

  try {
    fs.accessSync(smallThumbDir, fs.constants.F_OK);
    console.log('SmallThumb output directory exists.');
  } catch (err) {
    console.log(`Creating smallThumb directory: ${smallThumbDir}`);
    fs.mkdirSync(smallThumbDir);
  }

  fs.readdir(srcDir, (err, files) => {
    if (err) {
      console.error('Error: Source directory is not accessible.', err);
      process.exit(1);
    }

    const maxValue = files.length;
    ipc.send('show-progressbar', [maxValue]);

    const syncTime = moment().format('YYYYMMDDHHmmss');
    let i = 0;
    const errors = [];

    files.forEach((file) => {
      const fileName = path.parse(file).name;
      const fileDir = `${srcDir}/${file}`;

      const fileNameExt = path.basename(file);

      const largeImageOutput = `${largeImageDir}/${fileName}-800px.${fileFormat}`;
      const thumbImageOutput = `${thumbImageDir}/${fileName}-400px.${fileFormat}`;
      const smallThumbOutput = `${smallThumbDir}/${fileName}-100px.${fileFormat}`;

      try {
        fs.accessSync(largeImageOutput, fs.constants.F_OK);
        const renamedLargeImageOutput = `${largeImageDir}/${fileName}-800px-${syncTime}.${fileFormat}`;
        fs.renameSync(largeImageOutput, renamedLargeImageOutput);
        console.log(`LargeImage of ${fileNameExt} exists, so it was renamed.`);
      } catch (error) { return errors.push(`Error: Failed renaming previous largeImage of ${fileNameExt}. ${error}`); }

      try {
        fs.accessSync(thumbImageOutput, fs.constants.F_OK);
        const renamedThumbImageOutput = `${thumbImageDir}/${fileName}-400px-${syncTime}.${fileFormat}`;
        fs.renameSync(thumbImageOutput, renamedThumbImageOutput);
        console.log(`ThumbImage of ${fileNameExt} exists, so it was renamed.`);
      } catch (error) { return errors.push(`Error: Failed renaming previous thumbImage of ${fileNameExt}. ${error}`); }


      try {
        fs.accessSync(smallThumbOutput, fs.constants.F_OK);
        const renamedSmallThumbImageOutput = `${smallThumbDir}/${fileName}-100px-${syncTime}.${fileFormat}`;
        fs.renameSync(smallThumbOutput, renamedSmallThumbImageOutput);
        console.log(`SmallThumb of ${fileNameExt} exists, so it was renamed.`);
      } catch (error) { return errors.push(`Error: Failed renaming previous smallThumbImage of ${fileNameExt}. ${error}`); }

      const image = nativeImage.createFromPath(fileDir);

      if (image.isEmpty()) {
        errors.push(`Error: Source image ${fileNameExt} is empty.`);
      } else {
        const resizedLargeImage = image.resize({ height: '800', quality: 'best' });
        const resizedThumbImage = image.resize({ height: '400', quality: 'best' });
        const resizedSmallThumbImage = image.resize({ height: '100', quality: 'best' });

        let largeImage = null;
        let thumbImage = null;
        let smallThumbImage = null;

        if (fileFormat === 'jpg') {
          largeImage = resizedLargeImage.toJPEG(100);
          thumbImage = resizedThumbImage.toJPEG(100);
          smallThumbImage = resizedSmallThumbImage.toJPEG(100);
        } else {
          largeImage = resizedLargeImage.toPNG(1.0);
          thumbImage = resizedThumbImage.toPNG(1.0);
          smallThumbImage = resizedSmallThumbImage.toPNG(1.0);
        }

        fs.writeFile(largeImageOutput, largeImage, (error) => { if (error) errors.push(`Error: Failed saving largeImage of ${fileNameExt}. ${error}`); });
        fs.writeFile(thumbImageOutput, thumbImage, (error) => { if (error) errors.push(`Error: Failed saving thumbImage of ${fileNameExt}. ${error}`); });
        fs.writeFile(smallThumbOutput, smallThumbImage, (error) => { if (error) errors.push(`Error: Failed saving smallThumbImage of ${fileNameExt}. ${error}`); });
      }
      i += 1;
      ipc.send('process-progressbar');
    });
    return console.error(errors);
  });

  setTimeout(() => {
    ipc.send('set-progressbar-completed');
  }, 5000);
}

document.querySelector('#start-process').addEventListener('click', () => {
  processImages();
});
