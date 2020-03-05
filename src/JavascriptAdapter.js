const ejs = require('ejs')
const stream = require('stream')
const fs = require('fs')

class _ {
  constructor(props) {
    this._props = { ...props, ...{} }
  }

  get props() {
    return this._props
  }

  process(javascriptFile, options = {}, data = {}) {
    if (!(javascriptFile instanceof stream.Stream)) {
      return Promise.reject(
        new Error(_.ERRORS.CANNOT_PROCESS(_.MESSAGES.WRONG_JAVASCRIPT_FORMAT))
      )
    }

    let javascriptData = ''

    return new Promise((resolve, reject) => {
      try {
        javascriptFile.on('data', chunk => {
          javascriptData = chunk.toString()

          const compiledJavascript = ejs.compile(javascriptData, options)

          const output = compiledJavascript(data)

          const writeableJavascriptFile = stream.Writable()

          try {
            const outputStream = fs.createWriteStream(javascriptFile.path)

            outputStream.write(output)

            resolve(outputStream)
          } catch (error) {
            reject(new Error(_.ERRORS.CANNOT_PROCESS(error.message)))
          }

          writeableJavascriptFile.data = output
        })
      } catch (error) {
        reject(new Error(_.ERRORS.CANNOT_PROCESS(error.message)))
      }
    })
  }
}

_.ERRORS = {
  CANNOT_PROCESS: reason =>
    reason
      ? `Cannot process javascript file because ${reason}`
      : `Cannot process javascript file`
}

_.MESSAGES = {
  WRONG_JAVASCRIPT_FORMAT: 'wrong javascript file format. Expected a stream'
}

module.exports = _
