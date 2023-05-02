const IDL = require("../target/idl/swap_remi.json");
const anchor = require('@project-serum/anchor');
const spl = require('@solana/spl-token');

const PROGRAM_ID = IDL.metadata.address
const bs58 = require('bs58');
const { MINT_SIZE } = require("@solana/spl-token");
const { findProgramAddressSync } = require("@project-serum/anchor/dist/cjs/utils/pubkey");

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

const getPoolStateAddr = async (mintAccToken1) => {
    let [poolStateAddr, poolStateBump] = findProgramAddressSync(
      [Buffer.from("state"), mintAccToken1.toBuffer()],
      new anchor.web3.PublicKey(PROGRAM_ID)
    )
    return [poolStateAddr, poolStateBump]
  }

  const getWalletSolAddr = async () => {
    let [poolWalletSolAddr, poolWalletSolBump] = findProgramAddressSync(
      [Buffer.from("wallet_sol")],
      new anchor.web3.PublicKey(PROGRAM_ID)
    )
    return [poolWalletSolAddr, poolWalletSolBump]
  }

  const getPoolWalletToken = async (mintAccToken) => {
    let [poolWalletToken, poolWalletBump] = findProgramAddressSync(
      [Buffer.from("wallet"), mintAccToken.toBuffer()],
      new anchor.web3.PublicKey(PROGRAM_ID)
    )
    return [poolWalletToken, poolWalletBump]
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

    let tx = new anchor.web3.Transaction();
    const price = new anchor.BN(10)
    const mintTokenAcc = new anchor.web3.PublicKey('DQcBo1bqW799kN6PnNVHyDDWToMp4C2vrLJgwMLDqtPZ');
    let poolStateAddr;
    [poolStateAddr,] = await getPoolStateAddr(mintTokenAcc);
    let poolWalletSolAddr;
    [poolWalletSolAddr,] = await getWalletSolAddr();
    let poolWalletToken1;
    [poolWalletToken1,] = await getPoolWalletToken(mintTokenAcc);

    let initialize_ix = await program.methods.initialize(price).accounts({
        mintAccToken1: mintTokenAcc,
        poolState: poolStateAddr,
        poolWalletSol: poolWalletSolAddr,
        poolWalletToken1: poolWalletToken1,
        sender: admin.publicKey,
  
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: spl.TOKEN_PROGRAM_ID
    }).instruction()

    tx.add(initialize_ix)

    const signature = await program.provider.sendAndConfirm(tx, [adminKeyPair])
    console.log(`Tx: ${signature}`)
})();

// Tx: njp2HUsmD5iV2adeEbkXaoAW4cWinQqxzYAf6pXYTa65UvXYTMwDYo1ieJ6QdU1i8uNwypPimFoyKBB2xQMS3kw