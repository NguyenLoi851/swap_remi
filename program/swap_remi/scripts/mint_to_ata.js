const IDL = require("../target/idl/swap_remi.json");
const anchor = require('@project-serum/anchor');
const spl = require('@solana/spl-token');

const PROGRAM_ID = IDL.metadata.address
const bs58 = require('bs58');
const { MINT_SIZE } = require("@solana/spl-token");

function getProgramInstance(connection, wallet) {
    if (!wallet.publicKey) return;
    const provider = new anchor.AnchorProvider(
        connection,
        wallet,
        anchor.AnchorProvider.defaultOptions()
    );
    // Read the generated IDL.
    const idl = IDL;
    // Address of the deployed program.
    const programId = PROGRAM_ID;
    // Generate the program client from IDL.
    const program = new anchor.Program(idl, programId, provider);
    return program;
}

(async () => {
    const adminKeyPair = anchor.web3.Keypair.fromSecretKey(
        Uint8Array.from(
            [28, 186, 213, 226, 48, 22, 62, 190, 182, 136, 200, 126, 231, 153, 33, 27, 160, 69, 147, 27, 190, 133, 92, 71, 2, 68, 47, 225, 113, 14, 174, 73, 109, 101, 162, 20, 140, 16, 236, 109, 160, 129, 139, 229, 151, 236, 56, 157, 157, 219, 245, 21, 14, 254, 199, 78, 200, 115, 67, 139, 112, 70, 175, 220]
        )
    )
    const connection = new anchor.web3.Connection(anchor.web3.clusterApiUrl("testnet"), "confirmed");
    const admin = new anchor.Wallet(adminKeyPair);

    const program = getProgramInstance(connection, admin);

    const lamports = await program.provider.connection.getMinimumBalanceForRentExemption(MINT_SIZE);
    const mintTokenAcc = new anchor.web3.PublicKey('DQcBo1bqW799kN6PnNVHyDDWToMp4C2vrLJgwMLDqtPZ');

    // ========================================
    // const userKeypair = anchor.web3.Keypair.fromSecretKey(
    //     bs58.decode('4jgEkH5UajjQUMXobGxXM5kwq5TqNbaxysLKTvbqt7wu8rvQFjCZdTF5t23wB95PE3gf67fqCUcWn4cUmEp57um')
    // );

    // const user = new anchor.Wallet(userKeypair)
    
    const user = {
        publicKey: new anchor.web3.PublicKey('3tfLbi7bAJZfCJPM1UAB8Qq62HmoFWjmXAyBEkv3obLw')
    }
    const amount = 10000 * Math.pow(10, 6)
    const userAssociatedTokenAccount = await spl.getAssociatedTokenAddress(
        mintTokenAcc,
        user.publicKey,
        true,
        spl.TOKEN_PROGRAM_ID,
        spl.ASSOCIATED_TOKEN_PROGRAM_ID
    )

    // const userAssociatedTokenAccount = await spl.getOrCreateAssociatedTokenAccount(
    //     program.provider.connection,
    //     user.publicKey,
    //     mintTokenAcc,
    //     user.publicKey,
    //     true,
    //     'finalized',
    //     undefined,
    //     spl.TOKEN_PROGRAM_ID,
    //     spl.ASSOCIATED_TOKEN_PROGRAM_ID
    // )
    
    const txFundTokenAccount = new anchor.web3.Transaction();
    // txFundTokenAccount.add(spl.createAssociatedTokenAccountInstruction(
    //     admin.publicKey,
    //     userAssociatedTokenAccount,
    //     user.publicKey,
    //     mintTokenAcc,
    //     spl.TOKEN_PROGRAM_ID,
    //     spl.ASSOCIATED_TOKEN_PROGRAM_ID
    // ))
    txFundTokenAccount.add(spl.createMintToInstruction(
        mintTokenAcc,
        userAssociatedTokenAccount,
        admin.publicKey,
        amount,
        [],
        spl.TOKEN_PROGRAM_ID
    ))
    const txFundTokenSig = await program.provider.sendAndConfirm(txFundTokenAccount, [adminKeyPair])

    console.log(`Tx: ${txFundTokenSig}`)
    console.log(`userAssociatedTokenAccount: ${userAssociatedTokenAccount}`)

})();

// Mint Token at tx: 4E2Wq3MfKPSSWr6Jbdqsh8SURGpGsKhTFSqsPzJom12zpi6k2DAhsi8b83ozoDE6DNj938PAMMM1a8BH7FBLWh55
// Mint Token Acc: DQcBo1bqW799kN6PnNVHyDDWToMp4C2vrLJgwMLDqtPZ