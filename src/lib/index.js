import crypto from 'crypto'
import wordlist from './wordlist_eng'
import sjcl from './sjcl-bip39'
import bitcoinjs from './bitcoinjs-3.3.2'
import ethUtil from './ethereumjs-util'
import coinlist from './coinlist'
import bchaddr from './bchaddrjs-0.2.1'
import * as bip39 from 'bip39'
import * as bip32 from 'bip32'
import tronweb from 'tronweb'
import web3 from './web3'

const PBKDF2_ROUNDS = 2048


// === PRIVATE METHODS
const mnemonicToSeed = (mnemonic, passphrase = '') => {
    mnemonic = mnemonic.join(' ')
    const mnemonicNormalized = mnemonic.normalize('NFKD')

    passphrase = passphrase.normalize('NFKD')
    passphrase = "mnemonic" + passphrase

    const mnemonicBits = sjcl.codec.utf8String.toBits(mnemonicNormalized)

    const passphraseBits = sjcl.codec.utf8String.toBits(passphrase)

    const result = sjcl.misc.pbkdf2(mnemonicBits, passphraseBits, PBKDF2_ROUNDS, 512, hmacSHA512)

    const hashHex = sjcl.codec.hex.fromBits(result)

    return hashHex
}

const generatePath = (coin) => {
    const purpose = 44
    const account = 0
    const change = 0
    const coin_id = coinlist[coin].id
    const path = `m/${purpose}'/${coin_id}'/${account}'/${change}`
    return path
}

const hmacSHA512 = function (key) {
    const hasher = new sjcl.misc.hmac(key, sjcl.hash.sha512)
    this.encrypt = function () {
        return hasher.encrypt.apply(hasher, arguments);
    }
}

const calcBip32RootKeyFromSeed = (seed, coin) => {
    const rootKey = bitcoinjs.bitcoin.HDNode.fromSeedHex(seed, coinlist[coin].network)
    return rootKey
}

const calcBip32ExtendedKey = (bip32RootKey, path) => {
    if (!bip32RootKey) {
        return bip32RootKey;
    }
    var extendedKey = bip32RootKey;
    // Derive the key from the path
    var pathBits = path.split("/");
    for (var i = 0; i < pathBits.length; i++) {
        var bit = pathBits[i];
        var index = parseInt(bit);
        if (isNaN(index)) {
            continue;
        }
        var hardened = bit[bit.length - 1] == "'";
        var isPriv = !(extendedKey.isNeutered());
        var invalidDerivationPath = hardened && !isPriv;
        if (invalidDerivationPath) {
            extendedKey = null;
        }
        else if (hardened) {
            extendedKey = extendedKey.deriveHardened(index);
        }
        else {
            extendedKey = extendedKey.derive(index);
        }
    }
    return extendedKey
}

const mnemonicToKeyPair = (mnemonic, coin, index) => {
    const seed = mnemonicToSeed(mnemonic)
    const bip32RootKey = calcBip32RootKeyFromSeed(seed, coin)
    const path = generatePath(coin)
    const bip32ExtendedKey = calcBip32ExtendedKey(bip32RootKey, path)
    const key = bip32ExtendedKey.derive(index)
    return key.keyPair
}

const mnemonicToBTCAccount = (mnemonic, index) => {
    const keyPair = mnemonicToKeyPair(mnemonic, 'btc', index)
    const address = keyPair.getAddress().toString();
    const pubkey = keyPair.getPublicKeyBuffer().toString('hex');
    const privkey = keyPair.toWIF()

    return { address, pubkey, privkey }
}

const mnemonicToETHAccount = (mnemonic, index) => {
    const keyPair = mnemonicToKeyPair(mnemonic, 'eth', index)
    const hexPubkey = keyPair.getPublicKeyBuffer().toString('hex')
    const privKeyBuffer = keyPair.d.toBuffer(32)
    const hexPrivkey = privKeyBuffer.toString('hex')
    const addressBuffer = ethUtil.privateToAddress(privKeyBuffer)
    const hexAddress = addressBuffer.toString('hex')
    const checksumAddress = ethUtil.toChecksumAddress(hexAddress)
    const address = ethUtil.addHexPrefix(checksumAddress)
    const privkey = ethUtil.addHexPrefix(hexPrivkey)
    const pubkey = ethUtil.addHexPrefix(hexPubkey)

    return { address, pubkey, privkey }
}

const mnemonicToETCAccount = (mnemonic, index) => {
    const keyPair = mnemonicToKeyPair(mnemonic, 'etc', index)
    const hexPubkey = keyPair.getPublicKeyBuffer().toString('hex')
    const privKeyBuffer = keyPair.d.toBuffer(32)
    const hexPrivkey = privKeyBuffer.toString('hex')
    const addressBuffer = ethUtil.privateToAddress(privKeyBuffer)
    const hexAddress = addressBuffer.toString('hex')
    const checksumAddress = ethUtil.toChecksumAddress(hexAddress)
    const address = ethUtil.addHexPrefix(checksumAddress)
    const privkey = ethUtil.addHexPrefix(hexPrivkey)
    const pubkey = ethUtil.addHexPrefix(hexPubkey)

    return { address, pubkey, privkey }
}

const mnemonicToTRXAccount = (mnemonic, index) => {
    mnemonic = mnemonic.join(' ')
    const seed = bip39.mnemonicToSeedSync(mnemonic).toString('hex')
    const node = bip32.fromSeed(new Buffer.from(seed, 'hex'))
    const child = node.derivePath(`m/44'/195'/${index}'/0/0`)
    const privkey = child.privateKey.toString('hex')
    const pubkey = tronweb.address.fromPrivateKey(privkey)
    const address = pubkey
    return { address, pubkey, privkey }
}

const mnemonicToBCHAccount = (mnemonic, index, option) => {
    const keyPair = mnemonicToKeyPair(mnemonic, 'bch', index)
    let address = keyPair.getAddress().toString();
    const pubkey = keyPair.getPublicKeyBuffer().toString('hex');
    const privkey = keyPair.toWIF()

    switch (option) {
        case 'cashaddr':
            address = bchaddr.toCashAddress(address)
            break
        case 'bitpay':
            address = bchaddr.toBitpayAddress(address)
            break
        default:
            break
    }
    return { address, pubkey, privkey }
}

const mnemonicToLTCAccount = (mnemonic, index) => {
    const keyPair = mnemonicToKeyPair(mnemonic, 'ltc', index)
    const address = keyPair.getAddress().toString();
    const pubkey = keyPair.getPublicKeyBuffer().toString('hex');
    const privkey = keyPair.toWIF()

    return { address, pubkey, privkey }
}

const getAccountBalance = async (address, coin) => {
    switch (coin) {
        case 'eth':
            const balance = await web3.eth.getBalance(address)
            return balance === '0' ? 0 : parseInt(balance)
        default:
            return 0
    }
}

const searchActiveAccounts = async (mnemonic, coin) => {
    const accounts = []

    for (let index = 0; index < 20; index++) {
        const account = addNewAccount(mnemonic, { coin }, index)

        const balance = await getAccountBalance(account.address, coin)

        if (balance !== 0) {
            accounts.push({ account, balance })
        }
    }

    return { coin, accounts }
}

// === PUBLIC METHODS

const createMnemonic = () => {
    const quantity = 24
    let randoms = []
    while (randoms.length < quantity) {
        const random = crypto.randomBytes(2).toString('hex')
        const number = parseInt(random, 16) % 2048
        randoms = randoms.includes(number) ? randoms : [...randoms, number]
    }
    return randoms.map(random => wordlist[random])
}


const addNewAccount = (mnemonic, { coin, option }, index) => {
    switch (coin) {
        case 'bch':
            return mnemonicToBCHAccount(mnemonic, index, option)
        case 'etc':
            return mnemonicToETCAccount(mnemonic, index)
        case 'eth':
            return mnemonicToETHAccount(mnemonic, index)
        case 'trx':
            return mnemonicToTRXAccount(mnemonic, index)
        case 'ltc':
            return mnemonicToLTCAccount(mnemonic, index)
        default:
            return mnemonicToBTCAccount(mnemonic, index)

    }
}

const recoveryAccounts = (mnemonic) => {
    const coins = Object.keys(coinlist)

    return Promise.all(coins.map(coin => searchActiveAccounts(mnemonic, coin)))
}

export { createMnemonic, addNewAccount, recoveryAccounts }