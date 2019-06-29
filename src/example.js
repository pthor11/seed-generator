import {createMnemonic, addNewAccount, recoveryAccounts} from './lib'

// const mnemonic = createMnemonic()
const mnemonic = [
    'lounge',
    'devote',
    'ten',
    'tennis',
    'title',
    'medal',
    'similar',
    'badge',
    'steel',
    'boy',
    'cotton',
    'fringe',
    'gesture',
    'sock',
    'club',
    'slide',
    'tornado',
    'easy',
    'weird',
    'want',
    'face',
    'victory',
    'father',
    'sleep'
]
console.log({mnemonic})

// const btc = addNewAccount(mnemonic, {coin: 'btc'}, 0)
// console.log(btc)

// const testnet = addNewAccount(mnemonic, {coin: 'testnet'}, 0)
// console.log(testnet)

// const eth = addNewAccount(mnemonic, {coin: 'eth'}, 0)
// console.log(eth)

// const etc = addNewAccount(mnemonic, {coin: 'etc'}, 0)
// console.log(etc)

const trx = addNewAccount(mnemonic, {coin: 'trx'}, 0)
console.log({trx})

// const bch = addNewAccount(mnemonic, {coin: 'bch', option: 'bitpay'}, 0)
// console.log(bch)

// const ltc = addNewAccount(mnemonic, {coin: 'ltc'}, 0)
// console.log(ltc)


// const accounts = recoveryAccounts(mnemonic)
// console.log(accounts)

const recovery = async () => {
    const results =  await recoveryAccounts(mnemonic)
    console.log({results})
}

recovery()

