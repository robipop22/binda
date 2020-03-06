const fs = require('fs')
const request = require('request')
const stream = require('stream')
const { getFileExtension } = require('../utils')

class _ {
  constructor(props) {
    this._props = { ...props, ...{} }
  }

  get props() {
    return this._props
  }

  download(url, fileName) {
    if (!fileName) {
      return Promise.reject(
        new Error(_.ERRORS.CANNOT_LOAD('fileName is a required argument'))
      )
    }

    if (!url) {
      return Promise.reject(
        new Error(_.ERRORS.CANNOT_LOAD('url is a required argument'))
      )
    }

    return new Promise((resolve, reject) => {
      request.head(url, (err, res, body) => {
        if (res.statusCode !== 200) {
          reject(new Error(_.ERRORS.CANNOT_LOAD(_.MESSAGES.BAD_STATUS_CODE)))
        }
        resolve(request(url).pipe(fs.createWriteStream(fileName)))
      })
    })
  }

  process(image) {
    if (!(image instanceof stream.Stream)) {
      return Promise.reject(
        new Error(_.ERRORS.CANNOT_PROCESS(_.MESSAGES.WRONG_IMAGE_FORMAT))
      )
    }

    if (_.TYPES.indexOf(getFileExtension(image.path)) === -1) {
      return Promise.reject(
        new Error(_.ERRORS.CANNOT_PROCESS(_.MESSAGES.WRONG_EXTENSION_FORMAT))
      )
    }

    const stringPathSplit = image.path ? image.path.split('.') : ''

    const imageExtension = getFileExtension(image.path)

    if (imageExtension === 'remote') {
      image.on('data', chunk => {
        const remoteImageUrl = chunk.toString()
        const imageName = stringPathSplit[stringPathSplit.length - 3]
        const imageType = stringPathSplit[stringPathSplit.length - 2]

        return this.download(remoteImageUrl, `${imageName}${imageType}`)
      })
    }

    const writeAbleImg = stream.Writable()

    return new Promise((resolve, reject) => {
      try {
        resolve(image.pipe(writeAbleImg))
      } catch (error) {
        reject(new Error(_.ERRORS.CANNOT_PROCESS(error.message)))
      }
    })
  }
}

_.ERRORS = {
  CANNOT_LOAD: reason =>
    reason ? `Cannot load image because ${reason}` : `Cannot load image`,
  CANNOT_PROCESS: reason =>
    reason ? `Cannot process image because ${reason}` : `Cannot process image`
}

_.TYPES = ['png', 'jpeg', 'remote', 'gif']

_.MESSAGES = {
  NO_IMAGE: 'no image retrieved',
  BAD_STATUS_CODE: 'the url returned a error code',
  WRONG_IMAGE_FORMAT: 'wrong format image. Expected a stream',
  WRONG_EXTENSION_FORMAT: `wrong file extension. Expected one of the following:${_.TYPES.map(
    type => ` ${type}`
  )}.`
}

module.exports = _
