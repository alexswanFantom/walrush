// Import necessary modules from the Sui SDK and other libraries
const { getFullnodeUrl, SuiClient } = require('@mysten/sui/client');
const { getFaucetHost, requestSuiFromFaucetV1 } = require('@mysten/sui/faucet');
const { MIST_PER_SUI } = require('@mysten/sui/utils');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const bip39 = require('bip39');
const fs = require('fs');

async function main() {
    // Generate a new mnemonic phrase
    const mnemonic = bip39.generateMnemonic();
    console.log("Generated Mnemonic Phrase:", mnemonic);

    // Derive keypair from the mnemonic
    const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
    const MY_ADDRESS = keypair.getPublicKey().toSuiAddress();
    
    console.log("Derived Wallet Address:", MY_ADDRESS);

    // Export the private key
    const privateKey = keypair.getSecretKey().toString('hex');
    console.log("Private Key:", privateKey);

    // Create a new SuiClient object pointing to the Devnet
    const suiClient = new SuiClient({ url: getFullnodeUrl('devnet') });

    // Convert MIST to SUI
    const balance = (balance) => {
        return Number.parseInt(balance.totalBalance) / Number(MIST_PER_SUI);
    };

    // Store the JSON representation for the SUI the address owns before using the faucet
    const suiBefore = await suiClient.getBalance({ owner: MY_ADDRESS });

    // Request SUI from the faucet
    await requestSuiFromFaucetV1({
        host: getFaucetHost('devnet'),
        recipient: MY_ADDRESS,
    });

    // Store the JSON representation for the SUI the address owns after using the faucet
    const suiAfter = await suiClient.getBalance({ owner: MY_ADDRESS });

    // Output result to console
    console.log(
        `Balance before faucet: ${balance(suiBefore)} SUI. Balance after: ${balance(suiAfter)} SUI. Hello, SUI!`
    );

    // Prepare the wallet data to save
    const walletData = {
        address: MY_ADDRESS,
        mnemonic: mnemonic,
        privateKey: privateKey,
    };

    // Load existing wallets from file or initialize an empty array
    let wallets = [];
    if (fs.existsSync('wallets.json')) {
        const data = fs.readFileSync('wallets.json');
        wallets = JSON.parse(data);
    }

    // Add the new wallet data to the array
    wallets.push(walletData);

    // Save the updated wallets array back to the file
    fs.writeFileSync('wallets.json', JSON.stringify(wallets, null, 2));
    console.log('Wallet saved to wallets.json');
}

// Execute the main function and handle any errors
main().catch(console.error);
