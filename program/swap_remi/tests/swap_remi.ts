import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SwapRemi } from "../target/types/swap_remi";
import * as spl from '@solana/spl-token';
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { expect } from "chai";

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

  let charlieTokenAcc0: anchor.web3.PublicKey;
  let charlieTokenAcc1: anchor.web3.PublicKey;
  let charlieTokenAcc2: anchor.web3.PublicKey;

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

  const getPoolStateAddr = async (mintAccToken0: anchor.web3.PublicKey, mintAccToken1: anchor.web3.PublicKey): Promise<[anchor.web3.PublicKey, number]> => {
    let [poolStateAddr, poolStateBump] = findProgramAddressSync(
      [Buffer.from("state"), mintAccToken0.toBuffer(), mintAccToken1.toBuffer()],
      program.programId
    )
    return [poolStateAddr, poolStateBump]
  }

  const getPoolWalletToken = async (mintAccToken: anchor.web3.PublicKey): Promise<[anchor.web3.PublicKey, number]> => {
    let [poolWalletToken, poolWalletBump] = findProgramAddressSync(
      [Buffer.from("wallet"), mintAccToken.toBuffer()],
      program.programId
    )
    return [poolWalletToken, poolWalletBump]
  }

  const createAssociatedTokenAccountAndFundToken = async (connection: anchor.web3.Connection, user: anchor.web3.Keypair, amount: number, mintTokenAcc: anchor.web3.PublicKey) => {
    const userAssociatedTokenAccount = await spl.getAssociatedTokenAddress(
      mintTokenAcc,
      user.publicKey,
      true,
      spl.TOKEN_PROGRAM_ID,
      spl.ASSOCIATED_TOKEN_PROGRAM_ID
    )

    const txFundTokenAccount = new anchor.web3.Transaction();
    txFundTokenAccount.add(spl.createAssociatedTokenAccountInstruction(
      user.publicKey,
      userAssociatedTokenAccount,
      user.publicKey,
      mintTokenAcc,
      spl.TOKEN_PROGRAM_ID,
      spl.ASSOCIATED_TOKEN_PROGRAM_ID
    ))
    txFundTokenAccount.add(spl.createMintToInstruction(
      mintTokenAcc,
      userAssociatedTokenAccount,
      provider.wallet.publicKey,
      amount,
      [],
      spl.TOKEN_PROGRAM_ID
    ))
    const txFundTokenSig = await provider.sendAndConfirm(txFundTokenAccount, [user])

    return userAssociatedTokenAccount
  }

  beforeEach(async () => {
    [alice] = await fundLamports();
    [bob] = await fundLamports();
    [charlie] = await fundLamports();
    [david] = await fundLamports();
    [eva] = await fundLamports();

    [mintAccToken0] = await createMint();
    [mintAccToken1] = await createMint();
    [mintAccToken2] = await createMint();

    // console.log(mintAccToken0, mintAccToken1, mintAccToken2)
    const [_mintAccToken0, _mintAccToken1, _mintAccToken2] = [mintAccToken0, mintAccToken1, mintAccToken2].sort()
    mintAccToken0 = _mintAccToken0;
    mintAccToken1 = _mintAccToken1;
    mintAccToken2 = _mintAccToken2;

    aliceTokenAcc0 = await createAssociatedTokenAccountAndFundToken(provider.connection, alice, 1000, mintAccToken0);
    aliceTokenAcc1 = await createAssociatedTokenAccountAndFundToken(provider.connection, alice, 1000, mintAccToken1);
    aliceTokenAcc2 = await createAssociatedTokenAccountAndFundToken(provider.connection, alice, 1000, mintAccToken2);

    bobTokenAcc0 = await createAssociatedTokenAccountAndFundToken(provider.connection, bob, 1000, mintAccToken0);
    bobTokenAcc1 = await createAssociatedTokenAccountAndFundToken(provider.connection, bob, 1000, mintAccToken1);
    bobTokenAcc2 = await createAssociatedTokenAccountAndFundToken(provider.connection, bob, 1000, mintAccToken2);

    charlieTokenAcc0 = await createAssociatedTokenAccountAndFundToken(provider.connection, charlie, 1000, mintAccToken0);
    charlieTokenAcc1 = await createAssociatedTokenAccountAndFundToken(provider.connection, charlie, 1000, mintAccToken1);
    charlieTokenAcc2 = await createAssociatedTokenAccountAndFundToken(provider.connection, charlie, 1000, mintAccToken2);

    // const x = await spl.getAccount(provider.connection, aliceTokenAcc0);
    // console.log(x);

    [poolStateAddr,] = await getPoolStateAddr(mintAccToken0, mintAccToken1);
    [poolWalletToken0,] = await getPoolWalletToken(mintAccToken0);
    [poolWalletToken1,] = await getPoolWalletToken(mintAccToken1);
    [poolWalletToken2,] = await getPoolWalletToken(mintAccToken2);
  })

  it("Initialize pool", async () => {
    const price = new anchor.BN(10)
    const tx1 = await program.methods.initialize(price).accounts({
      mintAccToken0: mintAccToken0,
      mintAccToken1: mintAccToken1,
      poolState: poolStateAddr,
      poolWalletToken0: poolWalletToken0,
      poolWalletToken1: poolWalletToken1,
      sender: alice.publicKey,

      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: spl.TOKEN_PROGRAM_ID
    }).signers([alice]).rpc()
  })

  it("Initialize pool and Alice deposit", async () => {

    // Initialize
    const price = new anchor.BN(10)
    const tx1 = await program.methods.initialize(price).accounts({
      mintAccToken0: mintAccToken0,
      mintAccToken1: mintAccToken1,
      poolState: poolStateAddr,
      poolWalletToken0: poolWalletToken0,
      poolWalletToken1: poolWalletToken1,
      sender: alice.publicKey,

      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: spl.TOKEN_PROGRAM_ID
    }).signers([alice]).rpc()

    // Account info before Alice deposit token 0
    const balanceOfAliceTokenAcc0Before = (await spl.getAccount(
      provider.connection,
      aliceTokenAcc0
    )).amount;

    const balanceOfAliceTokenAcc1Before = (await spl.getAccount(
      provider.connection,
      aliceTokenAcc1
    )).amount;

    const balanceOfPoolWalletToken0Before = (await spl.getAccount(
      provider.connection,
      poolWalletToken0
    )).amount;

    const balanceOfPoolWalletToken1Before = (await spl.getAccount(
      provider.connection,
      poolWalletToken1
    )).amount;

    // Alice deposit token 0 and token 1
    const amount0Alice = new anchor.BN(100)
    const amount1Alice = new anchor.BN(200)
    const tx2 = await program.methods.deposit(amount0Alice, amount1Alice).accounts({
      poolState: poolStateAddr,
      poolWalletToken0: poolWalletToken0,
      poolWalletToken1: poolWalletToken1,
      sender: alice.publicKey,
      tokenAcc0: aliceTokenAcc0,
      tokenAcc1: aliceTokenAcc1,
      tokenProgram: spl.TOKEN_PROGRAM_ID
    }).signers([alice]).rpc()

    // Account info after Alice deposit token 0
    const balanceOfAliceTokenAcc0After = (await spl.getAccount(
      provider.connection,
      aliceTokenAcc0
    )).amount

    const balanceOfAliceTokenAcc1After = (await spl.getAccount(
      provider.connection,
      aliceTokenAcc1
    )).amount;

    const balanceOfPoolWalletToken0After = (await spl.getAccount(
      provider.connection,
      poolWalletToken0
    )).amount;

    const balanceOfPoolWalletToken1After = (await spl.getAccount(
      provider.connection,
      poolWalletToken1
    )).amount;

    // expect
    expect(Number(balanceOfAliceTokenAcc0Before - balanceOfAliceTokenAcc0After)).to.be.equal(amount0Alice.toNumber())
    expect(Number(balanceOfAliceTokenAcc1Before - balanceOfAliceTokenAcc1After)).to.be.equal(amount1Alice.toNumber())
    expect(Number(balanceOfPoolWalletToken0After - balanceOfPoolWalletToken0Before)).to.be.equal(amount0Alice.toNumber())
    expect(Number(balanceOfPoolWalletToken1After - balanceOfPoolWalletToken1Before)).to.be.equal(amount1Alice.toNumber())
  })

  it("Initialize, Alice deposit 100 token0, Bob deposit 200 token1, and Charlie swap from 10 token0 to get 100 token1", async () => {
    // Initialize
    const price = new anchor.BN(10)
    const tx1 = await program.methods.initialize(price).accounts({
      mintAccToken0: mintAccToken0,
      mintAccToken1: mintAccToken1,
      poolState: poolStateAddr,
      poolWalletToken0: poolWalletToken0,
      poolWalletToken1: poolWalletToken1,
      sender: alice.publicKey,

      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: spl.TOKEN_PROGRAM_ID
    }).signers([alice]).rpc()

    // Alice deposit token 0
    const amount0Alice = new anchor.BN(100)
    const tx2 = await program.methods.deposit(amount0Alice, new anchor.BN(0)).accounts({
      poolState: poolStateAddr,
      poolWalletToken0: poolWalletToken0,
      poolWalletToken1: poolWalletToken1,
      sender: alice.publicKey,
      tokenAcc0: aliceTokenAcc0,
      tokenAcc1: aliceTokenAcc1,
      tokenProgram: spl.TOKEN_PROGRAM_ID
    }).signers([alice]).rpc()

    // Bob deposit token 1
    const amount1Bob = new anchor.BN(200)
    const tx3 = await program.methods.deposit(new anchor.BN(0), amount1Bob).accounts({
      poolState: poolStateAddr,
      poolWalletToken0: poolWalletToken0,
      poolWalletToken1: poolWalletToken1,
      sender: bob.publicKey,
      tokenAcc0: bobTokenAcc0,
      tokenAcc1: bobTokenAcc1,
      tokenProgram: spl.TOKEN_PROGRAM_ID
    }).signers([bob]).rpc()

    let balanceOfPoolWalletToken0After = (await spl.getAccount(
      provider.connection,
      poolWalletToken0
    )).amount;

    let balanceOfPoolWalletToken1After = (await spl.getAccount(
      provider.connection,
      poolWalletToken1
    )).amount;

    expect(Number(balanceOfPoolWalletToken0After)).to.be.equal(amount0Alice.toNumber());
    expect(Number(balanceOfPoolWalletToken1After)).to.be.equal(amount1Bob.toNumber());

    // Account info before Charlie swap token
    const balanceOfCharlieTokenAcc0Before = (await spl.getAccount(
      provider.connection,
      charlieTokenAcc0
    )).amount

    const balanceOfCharlieTokenAcc1Before = (await spl.getAccount(
      provider.connection,
      charlieTokenAcc1
    )).amount;

    const balanceOfPoolWalletToken0Before = (await spl.getAccount(
      provider.connection,
      poolWalletToken0
    )).amount;

    const balanceOfPoolWalletToken1Before = (await spl.getAccount(
      provider.connection,
      poolWalletToken1
    )).amount;

    // Charlie swap 10 token0 to 100 token1
    const amount0InCharlie = new anchor.BN(10)
    const tx4 = await program.methods.swap(amount0InCharlie, new anchor.BN(0)).accounts({
      poolState: poolStateAddr,
      poolWalletToken0: poolWalletToken0,
      poolWalletToken1: poolWalletToken1,
      sender: charlie.publicKey,
      tokenAcc0: charlieTokenAcc0,
      tokenAcc1: charlieTokenAcc1,
      tokenProgram: spl.TOKEN_PROGRAM_ID
    }).signers([charlie]).rpc()

    // Account info after Charlie swap token
    const balanceOfCharlieTokenAcc0After = (await spl.getAccount(
      provider.connection,
      charlieTokenAcc0
    )).amount

    const balanceOfCharlieTokenAcc1After = (await spl.getAccount(
      provider.connection,
      charlieTokenAcc1
    )).amount;

    balanceOfPoolWalletToken0After = (await spl.getAccount(
      provider.connection,
      poolWalletToken0
    )).amount;

    balanceOfPoolWalletToken1After = (await spl.getAccount(
      provider.connection,
      poolWalletToken1
    )).amount;

    expect(Number(balanceOfCharlieTokenAcc0Before - balanceOfCharlieTokenAcc0After)).to.be.equal(amount0InCharlie.toNumber())
    expect(Number(balanceOfCharlieTokenAcc1After - balanceOfCharlieTokenAcc1Before)).to.be.equal(amount0InCharlie.toNumber()*(price.toNumber()))
    expect(Number(balanceOfPoolWalletToken0After - balanceOfPoolWalletToken0Before)).to.be.equal(amount0InCharlie.toNumber())
    expect(Number(balanceOfPoolWalletToken1Before - balanceOfPoolWalletToken1After)).to.be.equal(amount0InCharlie.toNumber()*(price.toNumber()))
  })
});
