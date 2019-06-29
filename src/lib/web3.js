import Web3 from 'web3'
let web3 = new Web3('ws://192.168.1.250:8546')
const provider = web3.currentProvider
provider.on('error', () => {
    console.error(`web3 not connect!`)
    web3 = new Web3('ws://192.168.1.250:8546')
})
export default web3