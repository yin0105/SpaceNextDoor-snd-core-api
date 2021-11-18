const gm = require('gm');
const sharp = require('sharp');
const request = require('request');
const fs = require('fs');
const Duplex = require('stream').Duplex;  

const service = {};
const positions = {
  bottomRight: 'SouthEast'
};

service.fromImage = function (waterMarkerUrl, imageStream, position, overlayUrl) {
  const promise = new Promise((resolve, reject) => {
    request(waterMarkerUrl).pipe(fs.createWriteStream('tmp/logo.png')).on('close', (err) => {
      if (err) return reject(err);
      resolve(gm(imageStream)
      .composite(__dirname + '/../../tmp/logo.png')
      .gravity(positions[position] || 'SouthEast')
      .out('-geometry', '+50+50')
      .autoOrient()
      .setFormat('jpg')
      .stream());
    });
  });

  return promise;
};

service.watermarkWithOverlay = function (waterMarkerUrl, imageStream, position, overlayUrl) {
  const promise = new Promise((resolve, reject) => {
    streamToBuffer(imageStream).then((baseImageBuffer) => {
      request.get(waterMarkerUrl, {encoding: null}, (err, response, waterMarkerBuffer) => {
        if (err) return reject(err);

        let top = 0;
        let left = 0;

        const sharpObj = sharp(baseImageBuffer)
          .metadata((err, {height = 0, width = 0}) => { 
            console.log(err, height, width);
            if (err) return reject(err);
            top = height - 130;
            left = width - 130;

            sharpObj  
              .overlayWith(waterMarkerBuffer, { top, left } )
              .jpeg()
              .toBuffer()
              .then((waterMarkCompositeBuffer) => {

                // Checks if overlay url is provided, if not returns the watermakred image stream
                if (!overlayUrl) {
                  return resolve(bufferToStream(waterMarkCompositeBuffer));
                } else {
                  // if exist, first get the buffer from overlay image and then 
                  // overlay it with base image from water mark
                  request
                    .get(overlayUrl, {encoding: null}, (err, response, overlayBuffer) => {
                      if (err) return reject(err);

                      sharp(waterMarkCompositeBuffer)
                        .overlayWith(overlayBuffer, { gravity: sharp.gravity.center })
                        .jpeg()
                        .toBuffer()
                        .then((completedImageBuffer) => {
                          return resolve(bufferToStream(completedImageBuffer));
                        })
                        .catch(reject);

                    });
                }

              })
              .catch(reject);
          });
        
        
      });
    })
    .catch(reject);
  });
  return promise;
};

function streamToBuffer(stream) {  
  return new Promise((resolve, reject) => {
    let buffers = [];
    stream.on('error', reject);
    stream.on('data', (data) => buffers.push(data));
    stream.on('end', () => resolve(Buffer.concat(buffers)));
  });
}

function bufferToStream(buffer) {  
  let stream = new Duplex();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

module.exports = service;