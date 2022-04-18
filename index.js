const { ethers } = require('ethers'); // Require the ethers library

process.on('exit', (code) => {
    const message = {
        1001: '未输入接收地址',
        1002: '未输入私钥或助记词'
    }
    code && console.log(message[code]);
});

/**
 * Sweep the balance of the wallet to the given address
 * @param {string} newAddress // 接收地址
 * @param {string} privateKey // 私钥/助记词
 * @param {string} mul // 支付gas的倍数 加速交易
 */

async function sweep(newAddress, privateKey, mul = 1) {
    if (!newAddress) process.exit(1001)
    if (!privateKey) process.exit(1002)
    
    const pKey = ''
    if (privateKey.split(' ').length == 12) {
        try {
            let walletPath = "m/44'/60'/0'/0/0"
            let account = ethers.utils.HDNode.fromMnemonic(privateKey);
            let node = account.derivePath(walletPath);
            pKey = node.privateKey;
        } catch (error) {
            console.log('助记词错误');
            process.exit()
        }
    }

    try {
        let url = "https://data-seed-prebsc-1-s1.binance.org:8545"; // bsc测试网rpc地址
        let provider = new ethers.providers.JsonRpcProvider(url); // 使用rpc地址
        
        // let provider = ethers.getDefaultProvider(); // 主网
        // let provider = ethers.getDefaultProvider('ropsten'); // ropsten测试网

        let wallet = new ethers.Wallet(pKey || privateKey, provider);

        // Make sure we are sweeping to an EOA, not a contract. The gas required
        // to send to a contract cannot be certain, so we may leave dust behind
        // or not set a high enough gas limit, in which case the transaction will
        // fail.
        let code = await provider.getCode(newAddress);
        if (code !== '0x') { throw new Error('Cannot sweep to a contract'); }

        // Get the current balance
        let balance = await wallet.getBalance();

        // Normally we would let the Wallet populate this for us, but we
        // need to compute EXACTLY how much value to send
        let gasPrice = await provider.getGasPrice();

        // The exact cost (in gas) to send to an Externally Owned Account (EOA)
        let gasLimit = 21000;

        // The balance less exactly the txfee in wei
        let value = balance.sub(gasPrice.mul(mul).mul(gasLimit))

        let tx = await wallet.sendTransaction({
            gasLimit: gasLimit,
            gasPrice: gasPrice.mul(mul),
            to: newAddress,
            value: value
        });
        
        console.log('Sent in Transaction: ' + tx.hash);
        process.exit()
    } catch (error) {
        console.log(error);
    }
}


const toAddress = null // 接收地址
const privateKey = null // 私钥 或 助记词 (单词用空格分割)

sweep(toAddress, privateKey)