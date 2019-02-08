This is an Electron application for resizing, naming, ordering, and versioning product images for eCommerce websites.

- The app allows you to convert all images to either PNG or JPG.

Select a image source and output directory then click "Run Resize Process".

- While processing, all the images within the source directory will be copied and resized into 3 specific sizes before saving them to their appropriate subfolder within the output directory.

- The application is hardcoded to save the following resolutions to the specified subfolders: largeImage (800px), thumb (400px), and smallThumb (100px).

- If an image of the same name and type is detected then the current version is renamed and time stamped before a new copy is saved.

- If any errors occur then the output will be saved in a timestamped JSON file within the source directory.
