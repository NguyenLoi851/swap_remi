import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SwapRemi } from "../target/types/swap_remi";
import * as spl from '@solana/spl-token';
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";

describe("swap_remi", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.SwapRemi as Program<SwapRemi>;

  let alice: anchor.web3.Keypair;
  let bob: anchor.web3.Keypair;
  let charlie: anchor.web3.Keypair;
  let david: anchor.web3.Keypair;
  let eva: anchor.web3.Keypair;

  let mintAccToken0: anchor.web3.PublicKey;
  let mintAccToken1: anchor.web3.PublicKey;
  let mintAccToken2: anchor.web3.PublicKey;

  let aliceTokenAcc0: anchor.web3.PublicKey;
  let aliceTokenAcc1: anchor.web3.PublicKey;
  let aliceTokenAcc2: anchor.web3.PublicKey;

  let bobTokenAcc0: anchor.web3.PublicKey;
  let bobTokenAcc1: anchor.web3.PublicKey;
  let bobTokenAcc2: anchor.web3.PublicKey;

  let poolStateAddr: anchor.web3.PublicKey;
  let poolWalletToken0: anchor.web3.PublicKey;
  let poolWalletToken1: anchor.web3.PublicKey;
  let poolWalletToken2: anchor.web3.PublicKey;

  const fundLamports = async () => {
    const user = new anchor.web3.Keypair();

    let txFund = new anchor.web3.Transaction();
    txFund.add(anchor.web3.SystemProgram.transfer({
      fromPubkey: provider.wallet.publicKey,
      toPubkey: user.publicKey,
      lamports: 5 * anchor.web3.LAMPORTS_PER_SOL
    }))
    const sigTxFund = await provider.sendAndConfirm(txFund)
    return [user]
  }

  const createMint = async () => {
    const mintTokenAcc = new anchor.web3.Keypair();
    const lamportsForMint = await provider.connection.getMinimumBalanceForRentExemption(spl.MintLayout.span)
    let tx = new anchor.web3.Transaction();

    tx.add(
      anchor.web3.SystemProgram.createAccount({
        programId: spl.TOKEN_PROGRAM_ID,
        space: spl.MintLayout.span,
        fromPubkey: provider.wallet.publicKey,
        newAccountPubkey: mintTokenAcc.publicKey,
        lamports: lamportsForMint,
      })
    )

    tx.add(
      spl.createInitializeMint2Instruction(
        mintTokenAcc.publicKey,
        6,
        provider.wallet.publicKey,
        provider.wallet.publicKey,
        spl.TOKEN_PROGRAM_ID
      )
    )

    const signature = await provider.sendAndConfirm(tx, [mintTokenAcc])
    return [mintTokenAcc.publicKey]
  }

  const getPoolStateAddr = async(mintAccToken0: anchor.web3.PublicKey, mintAccToken1: anchor.web3.PublicKey):Promise<[anchor.web3.PublicKey, number]> => {
    let [poolStateAddr, poolStateBump] = findProgramAddressSync(
      [Buffer.from("state"), mintAccToken0.toBuffer(), mintAccToken1.toBuffer()],
      program.programId
    )
    return [poolStateAddr, poolStateBump]
  }

  const getPoolWalletToken = async(mintAccToken: anchor.web3.PublicKey): Promise<[anchor.web3.PublicKey, number]> => {
    let [poolWalletToken, poolWalletBump] = findProgramAddressSync(
      [Buffer.from("wallet"), mintAccToken.toBuffer()],
      program.programId
    )
    return [poolWalletToken, poolWalletBump]
  }

  beforeEach(async () => {
    [alice] = await fundLamports();
    [bob] = await fundLamports();

    [mintAccToken0] = await createMint();
    [mintAccToken1] = await createMint();
    [mintAccToken2] = await createMint();

    [poolStateAddr, ] = await getPoolStateAddr(mintAccToken0, mintAccToken1);
    [poolWalletToken0, ] = await getPoolWalletToken(mintAccToken0);
    [poolWalletToken1, ] = await getPoolWalletToken(mintAccToken1);
    [poolWalletToken2, ] = await getPoolWalletToken(mintAccToken2);
  })

  it("Initialize pool", async () => {
    const price = new anchor.BN(10)
    const tx1 = await program.methods.initialize(price).accounts({
      mintAccToken0: mintAccToken0 < mintAccToken1 ? mintAccToken0 : mintAccToken1,
      mintAccToken1: mintAccToken0 < mintAccToken1 ? mintAccToken1 : mintAccToken0,
      poolState: poolStateAddr,
      poolWalletToken0: poolWalletToken0,
      poolWalletToken1: poolWalletToken1,
      sender: alice.publicKey,

      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: spl.TOKEN_PROGRAM_ID
    }).signers([alice]).rpc()


  })
});
