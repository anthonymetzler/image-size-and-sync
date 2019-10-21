// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const ipc = require('electron').ipcRenderer;

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

const processImages = async () => {
  const fs = require('fs');
  const path = require('path');
  const os = require('os');
  const { nativeImage } = require('electron');
  const moment = require('moment');
  const Jimp = require('jimp');

  const systemOS = os.platform();

  let fileFormat = 'png';
  fileFormat = document.querySelector('input[name="file-type"]:checked').value;

  const srcDir = document.getElementById('selected-source').innerHTML;
  const outputDir = document.getElementById('selected-output').innerHTML;

  let largeImageDir = null;
  let thumbImageDir = null;
  let smallThumbDir = null;

  if (systemOS === 'win32') {
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
      ipc.send('show-error-dialog', ['Error: Output directory is not accessible.', `Directory: ${outputDir}`]);
      process.exit(1);
    }
  });

  if (!(fs.existsSync(largeImageDir))) {
    try {
      fs.mkdirSync(largeImageDir);
    } catch (error) {
      ipc.send('show-error-dialog', ['Error: Unable to create largeImage directory.', `Directory: ${largeImageDir}`]);
      process.exit(1);
    }
  }

  if (!(fs.existsSync(thumbImageDir))) {
    try {
      fs.mkdirSync(thumbImageDir);
    } catch (error) {
      ipc.send('show-error-dialog', ['Error: Unable to create thumbImage directory.', `Directory: ${thumbImageDir}`]);
      process.exit(1);
    }
  }

  if (!(fs.existsSync(smallThumbDir))) {
    try {
      fs.mkdirSync(smallThumbDir);
    } catch (error) {
      ipc.send('show-error-dialog', ['Error: Unable to create smallThumbImage directory.', `Directory: ${smallThumbDir}`]);
      process.exit(1);
    }
  }

  const files = fs.readdirSync(srcDir);

  if (!files) {
    ipc.send('show-error-dialog', ['Error: Source directory is not accessible.', `Error: ${error}`]);
    process.exit(1);
  }

  const maxValue = files.length;
  ipc.send('show-progressbar', [maxValue]);

  const syncTime = moment().format('YYYYMMDDHHmmss');
  let filesProcessed = 0;
  const errors = [];

  // files.forEach((file) => {
  for (let j = 0; j < files.length; j++) {
    const acceptedImageFormats = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tif'];
    const fileExt = path.extname(files[j]);
    const renameExistingFileErrors = 0;

    if (!(acceptedImageFormats.includes(fileExt))) {
      filesProcessed += 1;
      ipc.send('process-progressbar');
      continue;
    }

    const fileNameExt = path.basename(files[j]);
    const fileName = path.parse(files[j]).name;

    let fileDir = null;
    if (systemOS === 'win32') {
      fileDir = `${srcDir}\\${files[j]}`;
    } else {
      fileDir = `${srcDir}/${files[j]}`;
    }

    let largeImageOutput = null;
    let thumbImageOutput = null;
    let smallThumbOutput = null;

    if (systemOS === 'win32') {
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
      if (systemOS === 'win32') {
        renamedLargeImageOutput = `${largeImageDir}\\${fileName}-800px-${syncTime}.${fileFormat}`;
      } else {
        renamedLargeImageOutput = `${largeImageDir}/${fileName}-800px-${syncTime}.${fileFormat}`;
      }
      try {
        fs.renameSync(largeImageOutput, renamedLargeImageOutput);
      } catch (err) { renameExistingFileErrors.push(`Error: Failed renaming previous largeImage of ${fileNameExt} so the file was skipped entirely from the size/sync process. ${err}`); }
    }

    const existingThumbImage = fs.existsSync(thumbImageOutput);
    if (existingThumbImage) {
      let renamedThumbImageOutput = null;
      if (systemOS === 'win32') {
        renamedThumbImageOutput = `${thumbImageDir}\\${fileName}-400px-${syncTime}.${fileFormat}`;
      } else {
        renamedThumbImageOutput = `${thumbImageDir}/${fileName}-400px-${syncTime}.${fileFormat}`;
      }
      try {
        fs.renameSync(thumbImageOutput, renamedThumbImageOutput);
      } catch (err) { renameExistingFileErrors.push(`Error: Failed renaming previous thumbImage of ${fileNameExt} so the file was skipped entirely from the size/sync process. ${err}`); }
    }

    const existingSmallThumbImage = fs.existsSync(smallThumbOutput);
    if (existingSmallThumbImage) {
      let renamedSmallThumbImageOutput = null;
      if (systemOS === 'win32') {
        renamedSmallThumbImageOutput = `${smallThumbDir}\\${fileName}-100px-${syncTime}.${fileFormat}`;
      } else {
        renamedSmallThumbImageOutput = `${smallThumbDir}/${fileName}-100px-${syncTime}.${fileFormat}`;
      }
      try {
        fs.renameSync(smallThumbOutput, renamedSmallThumbImageOutput);
      } catch (err) { renameExistingFileErrors.push(`Error: Failed renaming previous smallThumbImage of ${fileNameExt} so the file was skipped entirely from the size/sync process. ${err}`); }
    }

    if (renameExistingFileErrors.length > 0) {
      errors.concat(renameExistingFileErrors);
      filesProcessed += 1;
      ipc.send('process-progressbar');
      continue;
    }

    const srcImg = await Jimp.read(fileDir);

    if (fileFormat === 'jpg') {
      try {
        await srcImg.background(0xFFFFFFFF).resize(Jimp.AUTO, 800).quality(100).writeAsync(largeImageOutput);
      } catch (err) {
        errors.push(`Error: Failed saving largeImage of ${fileNameExt}. ${err}`);
      }

      try {
        await srcImg.background(0xFFFFFFFF).resize(Jimp.AUTO, 400).quality(100).writeAsync(thumbImageOutput);
      } catch (err) {
        errors.push(`Error: Failed saving thumbImage of ${fileNameExt}. ${err}`);
      }

      try {
        await srcImg.background(0xFFFFFFFF).resize(Jimp.AUTO, 100).quality(100).writeAsync(smallThumbOutput);
      } catch (err) {
        errors.push(`Error: Failed saving smallThumbImage of ${fileNameExt}. ${err}`);
      }
    } else {
      try {
        await srcImg.resize(Jimp.AUTO, 800).writeAsync(largeImageOutput);
      } catch (err) {
        errors.push(`Error: Failed saving largeImage of ${fileNameExt}. ${err}`);
      }

      try {
        await srcImg.resize(Jimp.AUTO, 400).writeAsync(thumbImageOutput);
      } catch (err) {
        errors.push(`Error: Failed saving thumbImage of ${fileNameExt}. ${err}`);
      }

      try {
        await srcImg.resize(Jimp.AUTO, 100).writeAsync(smallThumbOutput);
      } catch (err) {
        errors.push(`Error: Failed saving smallThumbImage of ${fileNameExt}. ${err}`);
      }
    }

    // const image = nativeImage.createFromPath(fileDir);

    // if (image.isEmpty()) {
    //   errors.push(`Error: Source image ${fileNameExt} is empty.`);
    // } else {
    //   const resizedLargeImage = image.resize({ height: 800, quality: 'best' });
    //   const resizedThumbImage = image.resize({ height: 400, quality: 'best' });
    //   const resizedSmallThumbImage = image.resize({ height: 100, quality: 'best' });

    //   let largeImage = null;
    //   let thumbImage = null;
    //   let smallThumbImage = null;

    //   if (fileFormat === 'jpg') {
    //     largeImage = resizedLargeImage.toJPEG(100);
    //     thumbImage = resizedThumbImage.toJPEG(100);
    //     smallThumbImage = resizedSmallThumbImage.toJPEG(100);
    //   } else {
    //     largeImage = resizedLargeImage.toPNG(1.0);
    //     thumbImage = resizedThumbImage.toPNG(1.0);
    //     smallThumbImage = resizedSmallThumbImage.toPNG(1.0);
    //   }

    //   fs.writeFile(largeImageOutput, largeImage, (err) => { if (err) errors.push(`Error: Failed saving largeImage of ${fileNameExt}. ${err}`); });
    //   fs.writeFile(thumbImageOutput, thumbImage, (err) => { if (err) errors.push(`Error: Failed saving thumbImage of ${fileNameExt}. ${err}`); });
    //   fs.writeFile(smallThumbOutput, smallThumbImage, (err) => { if (err) errors.push(`Error: Failed saving smallThumbImage of ${fileNameExt}. ${err}`); });
    // }

    filesProcessed += 1;
    ipc.send('process-progressbar');
  }

  if (errors.length > 0) {
    let logDir = null;
    if (systemOS === 'win32') {
      logDir = `${srcDir}\\errorLog-${syncTime}.json`;
    } else {
      logDir = `${srcDir}/errorLog-${syncTime}.json`;
    }

    const errorJSON = JSON.stringify(errors);
    fs.writeFile(logDir, errorJSON, (err) => { if (err) ipc.send('show-error-dialog', ['Writing Error Log Failed!', `Tried writing the Error Log here: ${logDir}`]); });
    ipc.send('show-error-dialog', ['Process completed with errors!', `Check Error Log here: ${logDir}`]);
  }

  setTimeout(() => {
    ipc.send('set-progressbar-completed');
  }, 5000);
};

document.querySelector('#start-process').addEventListener('click', async () => {
  await processImages();
});
