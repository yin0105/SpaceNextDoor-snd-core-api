'use strict';
const AWS = require('aws-sdk');
const FS = require('fs');
const pipefy = require('pipefy');
const Uploader = require('s3-streaming-upload').Uploader;
const configS3 = require(`../../config/${process.env.NODE_ENV || 'development'}.json`).s3;
let s3bucket = new AWS.S3();

const upload = (file, key, mimeType, cb) => {
  s3bucket.putObject({
    ACL: 'public-read',
    Body: file,
    Key: key,
    ContentType: mimeType,
    Bucket: configS3.bucket,
  }, (err, data) => {
    console.log(err);
    cb(err, data);
  });
};

const deleteFile = (key) => {
  const promise = new Promise((resolve, reject) => {
    s3bucket.deleteObject({
      Key: key,
      Bucket: configS3.bucket
    }, (err, data) => {
      console.log(err, data);
      if (err) return reject(err);
      return resolve(data);
    });
  });
  return promise;
};

const uploadViaParts = (key, stream, mimeType, cb) => {
  const upload = new Uploader({
    // credentials to access AWS
    secretKey:  'WIfZvvMbY0zQ2NCeRSMbC3EewprbEsfpeMu7nEZO',
    accessKey:  'AKIAI2ONCRPTYX7JQZFA',
    bucket:     configS3.bucket,
    objectName: key,
    stream:     stream,
    debug:      false,
    objectParams: {
      ACL: 'public-read'
    }
  });
  
  upload.send(cb);
};

const uploadFromStream = (key, mimeType, cb) => {
  return pipefy(mapBody);

  function mapBody(buffer) {
    s3bucket.putObject({
      ACL: 'public-read',
      Body: buffer,
      Key: key,
      ContentType: mimeType,
      Bucket: configS3.bucket,
    }, cb);
  }
};

let Service = {
  upload, 
  delete: deleteFile,
  uploadFromStream,
  uploadViaParts
};

module.exports = Service;
