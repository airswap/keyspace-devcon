const _ = require('lodash')

function formatErrorMessage(error) {
  if (_.isObject(error) && error.message) {
    return error.message.split('\n')[0] // sometimes metamask returns stacktraces and this removes them
  } else if (_.isString(error)) {
    return error
  }
  return ''
}

function storeSignedSeedForAddress({ address, signedSeed }) {
  const obj = JSON.stringify({ address, signedSeed })
  localStorage.setItem('signedSeed', obj)
}

function getSignedSeedForAddress(address) {
  const signedSeedObj = localStorage.getItem('signedSeed')
  if(signedSeedObj) {
    const parsedObj = JSON.parse(signedSeedObj)
    if(parsedObj.address === address) {
      return parsedObj.signedSeed
    }
  }
  return undefined
}

module.exports = { formatErrorMessage, storeSignedSeedForAddress, getSignedSeedForAddress }
