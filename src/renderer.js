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
  const os = require('os');
  const { nativeImage } = require('electron');
  const moment = require('moment');

  const systemOS = os.platform();

  let fileFormat = 'png';
  fileFormat = document.querySelector('input[name="file-type"]:checked').value;

  const srcDir = document.getElementById('selected-source').innerHTML;
  const outputDir = document.getElementById('selected-output').innerHTML;

  let largeImageDir = null;
  let thumbImageDir = null;
  let smallThumbDir = null;
  if (systemOS == 'win32') {
    largeImageDir = `${outputDir}\\largeImage`;
    thumbImageDir = `${outputDir}\\thumb`;
    smallThumbDir = `${outputDir}\\smallThumb`;
  } else {
    largeImageDir = `${outputDir}/largeImage`;
    thumbImageDir = `${outputDir}/thumb`;
    smallThumbDir = `${outputDir}/smallThumb`;
  }

  fs.accessSync(outputDir, fs.constants.W_OK, (error) => {
    if (error) {
      console.error('Error: Output directory is not accessible.');
      process.exit(1);
    }
  });

  if (!(fs.existsSync(largeImageDir))) {
    try {
      fs.mkdirSync(largeImageDir);
      console.log(`Created largeImage directory: ${largeImageDir}`);
    } catch (err) {
      console.error('Error: Unable to create largeImage directory.');
      process.exit(1);
    }
  }

  if (!(fs.existsSync(thumbImageDir))) {
    try {
      fs.mkdirSync(thumbImageDir);
      console.log(`Created thumbImage directory: ${thumbImageDir}`);
    } catch (err) {
      console.error('Error: Unable to create thumbImage directory.');
      process.exit(1);
    }
  }

  if (!(fs.existsSync(smallThumbDir))) {
    try {
      fs.mkdirSync(smallThumbDir);
      console.log(`Created smallThumbImage directory: ${smallThumbDir}`);
    } catch (err) {
      console.error('Error: Unable to create smallThumbImage directory.');
      process.exit(1);
    }
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
      
      let fileDir = null;
      if (systemOS == 'win32') {
        fileDir = `${srcDir}\\${file}`;
      } else {
        fileDir = `${srcDir}/${file}`;
      }

      const fileNameExt = path.basename(file);

      let largeImageOutput = null;
      let thumbImageOutput = null;
      let smallThumbOutput = null;
      if (systemOS == 'win32') {
        largeImageOutput = `${largeImageDir}\\${fileName}-800px.${fileFormat}`;
        thumbImageOutput = `${thumbImageDir}\\${fileName}-400px.${fileFormat}`;
        smallThumbOutput = `${smallThumbDir}\\${fileName}-100px.${fileFormat}`;
      } else {
        largeImageOutput = `${largeImageDir}/${fileName}-800px.${fileFormat}`;
        thumbImageOutput = `${thumbImageDir}/${fileName}-400px.${fileFormat}`;
        smallThumbOutput = `${smallThumbDir}/${fileName}-100px.${fileFormat}`;
      }

      const existingLargeImage = fs.existsSync(largeImageOutput);
      if (existingLargeImage) {
        let renamedLargeImageOutput = null;
        if (systemOS == 'win32') {
          renamedLargeImageOutput = `${largeImageDir}\\${fileName}-800px-${syncTime}.${fileFormat}`;
        } else {
          renamedLargeImageOutput = `${largeImageDir}/${fileName}-800px-${syncTime}.${fileFormat}`;
        }
        try {
          fs.renameSync(largeImageOutput, renamedLargeImageOutput);
          console.log(`LargeImage of ${fileNameExt} exists, so it was renamed.`);
        } catch (err) { return errors.push(`Error: Failed renaming previous largeImage of ${fileNameExt}. ${err}`); }
      }

      const existingThumbImage = fs.existsSync(thumbImageOutput);
      if (existingThumbImage) {
        let renamedThumbImageOutput = null;
        if (systemOS == 'win32') {
          renamedThumbImageOutput = `${thumbImageDir}\\${fileName}-400px-${syncTime}.${fileFormat}`;
        } else {
          renamedThumbImageOutput = `${thumbImageDir}/${fileName}-400px-${syncTime}.${fileFormat}`;
        }
        try {
          fs.renameSync(thumbImageOutput, renamedThumbImageOutput);
          console.log(`ThumbImage of ${fileNameExt} exists, so it was renamed.`);
        } catch (err) { return errors.push(`Error: Failed renaming previous thumbImage of ${fileNameExt}. ${err}`); }
      }

      const existingSmallThumbImage = fs.existsSync(smallThumbOutput);
      if (existingSmallThumbImage) {
        let renamedSmallThumbImageOutput = null;
        if (systemOS == 'win32') {
          renamedSmallThumbImageOutput = `${smallThumbDir}\\${fileName}-100px-${syncTime}.${fileFormat}`;
        } else {
          renamedSmallThumbImageOutput = `${smallThumbDir}/${fileName}-100px-${syncTime}.${fileFormat}`;
        }
        try {
          fs.renameSync(smallThumbOutput, renamedSmallThumbImageOutput);
          console.log(`SmallThumb of ${fileNameExt} exists, so it was renamed.`);
        } catch (err) { return errors.push(`Error: Failed renaming previous smallThumbImage of ${fileNameExt}. ${err}`); }
      }

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
