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
    const mintTokenAcc = new anchor.web3.Keypair();
    let tx = new anchor.web3.Transaction();
    tx.add(
        anchor.web3.SystemProgram.createAccount({
            programId: spl.TOKEN_PROGRAM_ID,
            space: spl.MintLayout.span,
            fromPubkey: admin.publicKey,
            newAccountPubkey: mintTokenAcc.publicKey,
            lamports: lamports,
        })
    )
    tx.add(
        spl.createInitializeMint2Instruction(
            mintTokenAcc.publicKey,
            6,
            admin.publicKey,
            admin.publicKey,
            spl.TOKEN_PROGRAM_ID
        )
    )
    const signature = await program.provider.sendAndConfirm(tx, [mintTokenAcc])
    console.log(`Mint Token at tx: ${signature}`)
    console.log(`Mint Token Acc: ${mintTokenAcc.publicKey.toBase58()}`)
})();

// Mint Token at tx: 4E2Wq3MfKPSSWr6Jbdqsh8SURGpGsKhTFSqsPzJom12zpi6k2DAhsi8b83ozoDE6DNj938PAMMM1a8BH7FBLWh55
// Mint Token Acc: DQcBo1bqW799kN6PnNVHyDDWToMp4C2vrLJgwMLDqtPZ