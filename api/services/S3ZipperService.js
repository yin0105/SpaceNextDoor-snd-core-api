const AWS = require('aws-sdk');
const s3Config = require(`../../config/${process.env.NODE_ENV || 'development'}.json`).s3;
const s3Zip = require('s3-zip');
const XmlStream = require('xml-stream');
 
const bucket = s3Config.bucket;

const s3 = new AWS.S3({ region: s3Config.region });


/**
 * @param  String: folder
 */
function zipWithStream(folder) {
  const promise = new Promise((resolve, reject) => {
    const params = {
      Bucket: bucket,
      Prefix: folder
    };
     
    const filesArray = [];
    const files = s3.listObjects(params).createReadStream();
    const xml = new XmlStream(files);
    xml.collect('Key');
    xml.on('endElement: Key', function(item) {
      if (!item) {
        reject('Error parsing XML from S3');
      } else {
        filesArray.push(item['$text'].substr(folder.length));
      }
    });
    
    xml
      .on('end', function () {
        if (!filesArray || !filesArray.length) {
          reject('No files to zip');
        } else {
          resolve(zip(filesArray, folder));
        }
      });
  });

  return promise;
}
 
/**
 * @param  {} files
 * @param  {} folder
 * return Stream
 */
function zip(files, folder) {
  files = files.filter(path => path.indexOf('/1200') < 0);
  console.log('Zipping',files.length, 'files');
  return s3Zip
   .archive(
    {
      region: s3Config.region,
      bucket: bucket,
      preserveFolderStructure: false,
    },
    folder,
    files
  );
}

module.exports = {
  zipWithStream
};