import * as anchor from "@project-serum/anchor";
import { AnchorError, Program } from "@project-serum/anchor";
import { SwapRemi } from "../target/types/swap_remi";
import * as spl from '@solana/spl-token';
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { assert, expect } from "chai";

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

  let davidTokenAcc0: anchor.web3.PublicKey;
  let davidTokenAcc1: anchor.web3.PublicKey;
  let davidTokenAcc2: anchor.web3.PublicKey;

  let poolStateAddr: anchor.web3.PublicKey;
  let poolWalletSolAddr: anchor.web3.PublicKey;
  let poolWalletToken0: anchor.web3.PublicKey;
  let poolWalletToken1: anchor.web3.PublicKey;
  let poolWalletToken2: anchor.web3.PublicKey;

  const fundLamports = async () => {
    const user = new anchor.web3.Keypair();

    let txFund = new anchor.web3.Transaction();
    txFund.add(anchor.web3.SystemProgram.transfer({
      fromPubkey: provider.wallet.publicKey,
      toPubkey: user.publicKey,
      lamports: 20 * anchor.web3.LAMPORTS_PER_SOL
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

  const getPoolStateAddr = async (mintAccToken1: anchor.web3.PublicKey): Promise<[anchor.web3.PublicKey, number]> => {
    let [poolStateAddr, poolStateBump] = findProgramAddressSync(
      [Buffer.from("state"), mintAccToken1.toBuffer()],
      program.programId
    )
    return [poolStateAddr, poolStateBump]
  }

  const getWalletSolAddr = async (): Promise<[anchor.web3.PublicKey, number]> => {
    let [poolWalletSolAddr, poolWalletSolBump] = findProgramAddressSync(
      [Buffer.from("wallet_sol")],
      program.programId
    )
    return [poolWalletSolAddr, poolWalletSolBump]
  }

  const getPoolWalletToken = async (mintAccToken: anchor.web3.PublicKey): Promise<[anchor.web3.PublicKey, number]> => {
    let [poolWalletToken, poolWalletBump] = findProgramAddressSync(
      [Buffer.from("wallet"), mintAccToken.toBuffer()],
      program.programId
    )
    return [poolWalletToken, poolWalletBump]
  }

  const createAssociatedTokenAccountAndFundToken = async (user: anchor.web3.Keypair, amount: number, mintTokenAcc: anchor.web3.PublicKey) => {
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

    const [_mintAccToken0, _mintAccToken1, _mintAccToken2] = [mintAccToken0, mintAccToken1, mintAccToken2].sort()
    mintAccToken0 = _mintAccToken0;
    mintAccToken1 = _mintAccToken1;
    mintAccToken2 = _mintAccToken2;

    aliceTokenAcc0 = await createAssociatedTokenAccountAndFundToken(alice, 1000 * Math.pow(10, 6), mintAccToken0);
    aliceTokenAcc1 = await createAssociatedTokenAccountAndFundToken(alice, 1000 * Math.pow(10, 6), mintAccToken1);
    aliceTokenAcc2 = await createAssociatedTokenAccountAndFundToken(alice, 1000 * Math.pow(10, 6), mintAccToken2);

    bobTokenAcc0 = await createAssociatedTokenAccountAndFundToken(bob, 1000 * Math.pow(10, 6), mintAccToken0);
    bobTokenAcc1 = await createAssociatedTokenAccountAndFundToken(bob, 1000 * Math.pow(10, 6), mintAccToken1);
    bobTokenAcc2 = await createAssociatedTokenAccountAndFundToken(bob, 1000 * Math.pow(10, 6), mintAccToken2);

    charlieTokenAcc0 = await createAssociatedTokenAccountAndFundToken(charlie, 1000 * Math.pow(10, 6), mintAccToken0);
    charlieTokenAcc1 = await createAssociatedTokenAccountAndFundToken(charlie, 1000 * Math.pow(10, 6), mintAccToken1);
    charlieTokenAcc2 = await createAssociatedTokenAccountAndFundToken(charlie, 1000 * Math.pow(10, 6), mintAccToken2);

    davidTokenAcc0 = await createAssociatedTokenAccountAndFundToken(david, 1000 * Math.pow(10, 6), mintAccToken0);
    davidTokenAcc1 = await createAssociatedTokenAccountAndFundToken(david, 1000 * Math.pow(10, 6), mintAccToken1);
    davidTokenAcc2 = await createAssociatedTokenAccountAndFundToken(david, 1000 * Math.pow(10, 6), mintAccToken2);

    // const x = await spl.getAccount(provider.connection, aliceTokenAcc0);
    // console.log(x);

    [poolStateAddr,] = await getPoolStateAddr(mintAccToken1);
    [poolWalletSolAddr,] = await getWalletSolAddr();
    [poolWalletToken0,] = await getPoolWalletToken(mintAccToken0);
    [poolWalletToken1,] = await getPoolWalletToken(mintAccToken1);
    [poolWalletToken2,] = await getPoolWalletToken(mintAccToken2);
  })

  it("Initialize pool", async () => {
    const price = new anchor.BN(10)
    const tx1 = await program.methods.initialize(price).accounts({
      mintAccToken1: mintAccToken1,
      poolState: poolStateAddr,
      poolWalletSol: poolWalletSolAddr,
      poolWalletToken1: poolWalletToken1,
      sender: alice.publicKey,

      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: spl.TOKEN_PROGRAM_ID
    }).signers([alice]).rpc()
  })

  it("Initialize pool and Alice deposits", async () => {

    // Initialize
    const price = new anchor.BN(10)
    const tx1 = await program.methods.initialize(price).accounts({
      mintAccToken1: mintAccToken1,
      poolState: poolStateAddr,
      poolWalletToken1: poolWalletToken1,
      sender: alice.publicKey,
      poolWalletSol: poolWalletSolAddr,

      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: spl.TOKEN_PROGRAM_ID
    }).signers([alice]).rpc()

    // Account info before Alice deposit SOL and token 1
    const balanceOfAliceBefore = await provider.connection.getBalance(alice.publicKey);

    const balanceOfAliceTokenAcc1Before = Number((await spl.getAccount(
      provider.connection,
      aliceTokenAcc1
    )).amount);

    const balanceOfPoolWalletSolBefore = await provider.connection.getBalance(poolWalletSolAddr);

    const balanceOfPoolWalletToken1Before = Number((await spl.getAccount(
      provider.connection,
      poolWalletToken1
    )).amount);

    // Alice deposit SOL and token 1
    const amount0Alice = new anchor.BN(anchor.web3.LAMPORTS_PER_SOL * 5)
    const amount1Alice = new anchor.BN(200 * Math.pow(10, 6))
    const tx2 = await program.methods.deposit(amount0Alice, amount1Alice).accounts({
      poolState: poolStateAddr,
      poolWalletToken1: poolWalletToken1,
      sender: alice.publicKey,
      tokenAcc1: aliceTokenAcc1,
      tokenProgram: spl.TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      poolWalletSol: poolWalletSolAddr
    }).signers([alice]).rpc()

    // Account info after Alice deposit SOL and token 1
    const balanceOfAliceAfter = await provider.connection.getBalance(alice.publicKey);

    const balanceOfAliceTokenAcc1After = Number((await spl.getAccount(
      provider.connection,
      aliceTokenAcc1
    )).amount);

    const balanceOfPoolWalletSolAfter = await provider.connection.getBalance(poolWalletSolAddr);

    const balanceOfPoolWalletToken1After = Number((await spl.getAccount(
      provider.connection,
      poolWalletToken1
    )).amount);

    // expect
    expect(balanceOfAliceBefore - balanceOfAliceAfter).to.be.greaterThanOrEqual(amount0Alice.toNumber())
    expect(balanceOfAliceTokenAcc1Before - balanceOfAliceTokenAcc1After).to.be.equal(amount1Alice.toNumber())
    expect(balanceOfPoolWalletSolAfter - balanceOfPoolWalletSolBefore).to.be.equal(amount0Alice.toNumber())
    expect(balanceOfPoolWalletToken1After - balanceOfPoolWalletToken1Before).to.be.equal(amount1Alice.toNumber())
  })

  it("Initialize, Alice deposit 5 SOL, Bob deposits 200 token1, Charlie swaps from 10 SOL to get 100 token1, and David swaps from 10 token1 to get 1 SOL", async () => {
    // Initialize
    const price = new anchor.BN(10)
    const tx1 = await program.methods.initialize(price).accounts({
      mintAccToken1: mintAccToken1,
      poolState: poolStateAddr,
      poolWalletToken1: poolWalletToken1,
      sender: alice.publicKey,
      poolWalletSol: poolWalletSolAddr,

      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: spl.TOKEN_PROGRAM_ID
    }).signers([alice]).rpc()

    // Alice deposit SOL
    const amount0Alice = new anchor.BN(anchor.web3.LAMPORTS_PER_SOL * 5)
    const tx2 = await program.methods.deposit(amount0Alice, new anchor.BN(0)).accounts({
      poolState: poolStateAddr,
      poolWalletToken1: poolWalletToken1,
      sender: alice.publicKey,
      tokenAcc1: aliceTokenAcc1,
      tokenProgram: spl.TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      poolWalletSol: poolWalletSolAddr
    }).signers([alice]).rpc()

    // Bob deposit token 1
    const amount1Bob = new anchor.BN(200 * Math.pow(10, 6))
    const tx3 = await program.methods.deposit(new anchor.BN(0), amount1Bob).accounts({
      poolState: poolStateAddr,
      poolWalletToken1: poolWalletToken1,
      sender: bob.publicKey,
      tokenAcc1: bobTokenAcc1,
      tokenProgram: spl.TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      poolWalletSol: poolWalletSolAddr
    }).signers([bob]).rpc()

    let balanceOfPoolWalletSolAfter = await provider.connection.getBalance(poolWalletSolAddr);

    let balanceOfPoolWalletToken1After = Number((await spl.getAccount(
      provider.connection,
      poolWalletToken1
    )).amount);

    expect(balanceOfPoolWalletSolAfter).to.be.greaterThanOrEqual(amount0Alice.toNumber());
    expect(balanceOfPoolWalletToken1After).to.be.equal(amount1Bob.toNumber());

    // Account info before Charlie swap token
    const balanceOfCharlieBefore = await provider.connection.getBalance(charlie.publicKey)

    const balanceOfCharlieTokenAcc1Before = Number((await spl.getAccount(
      provider.connection,
      charlieTokenAcc1
    )).amount);

    let balanceOfPoolWalletSolBefore = await provider.connection.getBalance(poolWalletSolAddr)

    let balanceOfPoolWalletToken1Before = Number((await spl.getAccount(
      provider.connection,
      poolWalletToken1
    )).amount);

    // Charlie swap 10 SOL to 100 token1
    const amount0InCharlie = new anchor.BN(10 * anchor.web3.LAMPORTS_PER_SOL)
    const tx4 = await program.methods.swap(amount0InCharlie, new anchor.BN(0)).accounts({
      poolState: poolStateAddr,
      poolWalletToken1: poolWalletToken1,
      sender: charlie.publicKey,
      tokenAcc1: charlieTokenAcc1,
      tokenProgram: spl.TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      poolWalletSol: poolWalletSolAddr
    }).signers([charlie]).rpc()

    // Account info after Charlie swap token
    const balanceOfCharlieAfter = await provider.connection.getBalance(charlie.publicKey)

    const balanceOfCharlieTokenAcc1After = Number((await spl.getAccount(
      provider.connection,
      charlieTokenAcc1
    )).amount);

    balanceOfPoolWalletSolAfter = await provider.connection.getBalance(poolWalletSolAddr)

    balanceOfPoolWalletToken1After = Number((await spl.getAccount(
      provider.connection,
      poolWalletToken1
    )).amount);
    const amount1OutCharlie = Number(amount0InCharlie) / Math.pow(10, 9) * price.toNumber() * Math.pow(10, 6)
    expect(Number(balanceOfCharlieBefore - balanceOfCharlieAfter)).to.be.greaterThanOrEqual(amount0InCharlie.toNumber())
    expect(Number(balanceOfCharlieTokenAcc1After - balanceOfCharlieTokenAcc1Before)).to.be.equal(amount1OutCharlie)
    expect(Number(balanceOfPoolWalletSolAfter - balanceOfPoolWalletSolBefore)).to.be.equal(amount0InCharlie.toNumber())
    expect(Number(balanceOfPoolWalletToken1Before - balanceOfPoolWalletToken1After)).to.be.equal(amount1OutCharlie)

    // Account info before David swap token
    const balanceOfDavidBefore = await provider.connection.getBalance(david.publicKey)

    const balanceOfDavidTokenAcc1Before = Number((await spl.getAccount(
      provider.connection,
      davidTokenAcc1
    )).amount);

    balanceOfPoolWalletSolBefore = await provider.connection.getBalance(poolWalletSolAddr)

    balanceOfPoolWalletToken1Before = Number((await spl.getAccount(
      provider.connection,
      poolWalletToken1
    )).amount);

    // David swap 10 token1 to 1 SOL
    const amount1InDavid = new anchor.BN(10 * Math.pow(10, 6))
    const tx5 = await program.methods.swap(new anchor.BN(0), amount1InDavid).accounts({
      poolState: poolStateAddr,
      poolWalletToken1: poolWalletToken1,
      sender: david.publicKey,
      tokenAcc1: davidTokenAcc1,
      tokenProgram: spl.TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      poolWalletSol: poolWalletSolAddr
    }).signers([david]).rpc()

    // Account info after David swap token
    const balanceOfDavidAfter = await provider.connection.getBalance(david.publicKey)

    const balanceOfDavidTokenAcc1After = Number((await spl.getAccount(
      provider.connection,
      davidTokenAcc1
    )).amount);

    balanceOfPoolWalletSolAfter = await provider.connection.getBalance(poolWalletSolAddr)

    balanceOfPoolWalletToken1After = Number((await spl.getAccount(
      provider.connection,
      poolWalletToken1
    )).amount);
    const amount0OutDavid = Number(amount1InDavid) / Math.pow(10, 6) / price.toNumber() * Math.pow(10, 9)
    expect(balanceOfDavidAfter - balanceOfDavidBefore).to.be.lessThanOrEqual(amount0OutDavid)
    expect(balanceOfDavidAfter - balanceOfDavidBefore).to.be.greaterThan(amount0OutDavid / 2)
    expect(balanceOfDavidTokenAcc1Before - balanceOfDavidTokenAcc1After).to.be.equal(amount1InDavid.toNumber())
    expect(balanceOfPoolWalletSolBefore - balanceOfPoolWalletSolAfter).to.be.equal(amount0OutDavid)
    expect(balanceOfPoolWalletToken1After - balanceOfPoolWalletToken1Before).to.be.equal(amount1InDavid.toNumber())

  })

  it("Initialize pool and revert when Alice deposits 0 token and 0 SOL", async () => {

    // Initialize
    const price = new anchor.BN(10)
    const tx1 = await program.methods.initialize(price).accounts({
      mintAccToken1: mintAccToken1,
      poolState: poolStateAddr,
      poolWalletToken1: poolWalletToken1,
      sender: alice.publicKey,
      poolWalletSol: poolWalletSolAddr,

      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: spl.TOKEN_PROGRAM_ID
    }).signers([alice]).rpc()

    // Alice deposit 0 SOL and 0 token 1
    try {
      const amount0Alice = new anchor.BN(0)
      const amount1Alice = new anchor.BN(0)
      const tx2 = await program.methods.deposit(amount0Alice, amount1Alice).accounts({
        poolState: poolStateAddr,
        poolWalletToken1: poolWalletToken1,
        sender: alice.publicKey,
        tokenAcc1: aliceTokenAcc1,
        tokenProgram: spl.TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        poolWalletSol: poolWalletSolAddr
      }).signers([alice]).rpc()
      assert(false, "Should have failed but did not");
    } catch (error) {
      expect(error).instanceOf(AnchorError)
      expect((error as AnchorError).error.errorMessage).to.be.equal("Invalid deposit amount");
      expect((error as AnchorError).error.errorCode.code).to.be.equal("InvalidDepositAmount")
    }

  })

  it("Initialize pool and revert when Alice deposits SOL much more than account's balance", async () => {

    // Initialize
    const price = new anchor.BN(10)
    const tx1 = await program.methods.initialize(price).accounts({
      mintAccToken1: mintAccToken1,
      poolState: poolStateAddr,
      poolWalletToken1: poolWalletToken1,
      sender: alice.publicKey,
      poolWalletSol: poolWalletSolAddr,

      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: spl.TOKEN_PROGRAM_ID
    }).signers([alice]).rpc()

    // Account info before Alice deposit SOL and token 1
    const balanceOfAliceBefore = await provider.connection.getBalance(alice.publicKey);

    // Alice deposit SOL and token 1
    try {
      const amount0Alice = new anchor.BN(balanceOfAliceBefore + 10)
      const amount1Alice = new anchor.BN(200 * Math.pow(10, 6))
      const tx2 = await program.methods.deposit(amount0Alice, amount1Alice).accounts({
        poolState: poolStateAddr,
        poolWalletToken1: poolWalletToken1,
        sender: alice.publicKey,
        tokenAcc1: aliceTokenAcc1,
        tokenProgram: spl.TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        poolWalletSol: poolWalletSolAddr
      }).signers([alice]).rpc()
      assert(false, "Should have failed but did not")
    } catch (error) {
      expect(error).instanceOf(AnchorError)
      expect((error as AnchorError).error.errorMessage).to.be.equal("User does not enough SOL balance (include rent exemption)")
      expect((error as AnchorError).error.errorCode.code).to.be.equal("UserNotEnoughSolBalance")
    }
  })

  it("Initialize pool and revert when Alice deposits token much more than account's balance", async () => {

    // Initialize
    const price = new anchor.BN(10)
    const tx1 = await program.methods.initialize(price).accounts({
      mintAccToken1: mintAccToken1,
      poolState: poolStateAddr,
      poolWalletToken1: poolWalletToken1,
      sender: alice.publicKey,
      poolWalletSol: poolWalletSolAddr,

      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: spl.TOKEN_PROGRAM_ID
    }).signers([alice]).rpc()

    // Account info before Alice deposit SOL and token 1
    const balanceOfAliceTokenAcc1Before = Number((await spl.getAccount(
      provider.connection,
      aliceTokenAcc1
    )).amount);

    // Alice deposit SOL and token 1
    try {
      const amount0Alice = new anchor.BN(anchor.web3.LAMPORTS_PER_SOL * 5)
      const amount1Alice = new anchor.BN(balanceOfAliceTokenAcc1Before + 10)
      const tx2 = await program.methods.deposit(amount0Alice, amount1Alice).accounts({
        poolState: poolStateAddr,
        poolWalletToken1: poolWalletToken1,
        sender: alice.publicKey,
        tokenAcc1: aliceTokenAcc1,
        tokenProgram: spl.TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        poolWalletSol: poolWalletSolAddr
      }).signers([alice]).rpc()
      assert(false, "Should have failed but did not")
    } catch (error) {
      expect(error).instanceOf(AnchorError)
      expect((error as AnchorError).error.errorMessage).to.be.equal("User does not enough token amount")
      expect((error as AnchorError).error.errorCode.code).to.be.equal("UserNotEnoughTokenAmount")
    }
  })

  it("Initialize, Alice deposit 5 SOL, Bob deposits 200 token1 and revert when Charlie and David swap without valid arguments to determine direction swap", async () => {
    // Initialize
    const price = new anchor.BN(10)
    const tx1 = await program.methods.initialize(price).accounts({
      mintAccToken1: mintAccToken1,
      poolState: poolStateAddr,
      poolWalletToken1: poolWalletToken1,
      sender: alice.publicKey,
      poolWalletSol: poolWalletSolAddr,

      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: spl.TOKEN_PROGRAM_ID
    }).signers([alice]).rpc()

    // Alice deposit SOL
    const amount0Alice = new anchor.BN(anchor.web3.LAMPORTS_PER_SOL * 5)
    const tx2 = await program.methods.deposit(amount0Alice, new anchor.BN(0)).accounts({
      poolState: poolStateAddr,
      poolWalletToken1: poolWalletToken1,
      sender: alice.publicKey,
      tokenAcc1: aliceTokenAcc1,
      tokenProgram: spl.TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      poolWalletSol: poolWalletSolAddr
    }).signers([alice]).rpc()

    // Bob deposit token 1
    const amount1Bob = new anchor.BN(200 * Math.pow(10, 6))
    const tx3 = await program.methods.deposit(new anchor.BN(0), amount1Bob).accounts({
      poolState: poolStateAddr,
      poolWalletToken1: poolWalletToken1,
      sender: bob.publicKey,
      tokenAcc1: bobTokenAcc1,
      tokenProgram: spl.TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      poolWalletSol: poolWalletSolAddr
    }).signers([bob]).rpc()

    let balanceOfPoolWalletSolAfter = await provider.connection.getBalance(poolWalletSolAddr);

    let balanceOfPoolWalletToken1After = Number((await spl.getAccount(
      provider.connection,
      poolWalletToken1
    )).amount);

    expect(balanceOfPoolWalletSolAfter).to.be.greaterThanOrEqual(amount0Alice.toNumber());
    expect(balanceOfPoolWalletToken1After).to.be.equal(amount1Bob.toNumber());

    try {
      const amount0InCharlie = new anchor.BN(10 * anchor.web3.LAMPORTS_PER_SOL)
      const tx4 = await program.methods.swap(amount0InCharlie, new anchor.BN(10)).accounts({
        poolState: poolStateAddr,
        poolWalletToken1: poolWalletToken1,
        sender: charlie.publicKey,
        tokenAcc1: charlieTokenAcc1,
        tokenProgram: spl.TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        poolWalletSol: poolWalletSolAddr
      }).signers([charlie]).rpc()
      assert(false, "Should have failed but did not")
    } catch (error) {
      expect(error).instanceOf(AnchorError)
      expect((error as AnchorError).error.errorMessage).to.be.equal("Invalid swap direction")
      expect((error as AnchorError).error.errorCode.code).to.be.equal("InvalidSwapDirection")
    }


    try {
      const tx5 = await program.methods.swap(new anchor.BN(0), new anchor.BN(0)).accounts({
        poolState: poolStateAddr,
        poolWalletToken1: poolWalletToken1,
        sender: david.publicKey,
        tokenAcc1: davidTokenAcc1,
        tokenProgram: spl.TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        poolWalletSol: poolWalletSolAddr
      }).signers([david]).rpc()
      assert(false, "Should have failed but did not")
    } catch (error) {
      expect(error).instanceOf(AnchorError)
      expect((error as AnchorError).error.errorMessage).to.be.equal("Invalid swap direction")
      expect((error as AnchorError).error.errorCode.code).to.be.equal("InvalidSwapDirection")
    }
  })

  it("Initialize, Alice deposit 5 SOL, Bob deposits 20 token1 and revert when Charlie swaps from 10 SOL to get 100 token1; or revert when David swaps from 500 tokens to get 50 SOL, which is more than pool's token liquidity", async () => {
    // Initialize
    const price = new anchor.BN(10)
    const tx1 = await program.methods.initialize(price).accounts({
      mintAccToken1: mintAccToken1,
      poolState: poolStateAddr,
      poolWalletToken1: poolWalletToken1,
      sender: alice.publicKey,
      poolWalletSol: poolWalletSolAddr,

      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: spl.TOKEN_PROGRAM_ID
    }).signers([alice]).rpc()

    // Alice deposit SOL
    const amount0Alice = new anchor.BN(anchor.web3.LAMPORTS_PER_SOL * 5)
    const tx2 = await program.methods.deposit(amount0Alice, new anchor.BN(0)).accounts({
      poolState: poolStateAddr,
      poolWalletToken1: poolWalletToken1,
      sender: alice.publicKey,
      tokenAcc1: aliceTokenAcc1,
      tokenProgram: spl.TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      poolWalletSol: poolWalletSolAddr
    }).signers([alice]).rpc()

    // Bob deposit token 1
    const amount1Bob = new anchor.BN(20 * Math.pow(10, 6))
    const tx3 = await program.methods.deposit(new anchor.BN(0), amount1Bob).accounts({
      poolState: poolStateAddr,
      poolWalletToken1: poolWalletToken1,
      sender: bob.publicKey,
      tokenAcc1: bobTokenAcc1,
      tokenProgram: spl.TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      poolWalletSol: poolWalletSolAddr
    }).signers([bob]).rpc()

    let balanceOfPoolWalletSolAfter = await provider.connection.getBalance(poolWalletSolAddr);

    let balanceOfPoolWalletToken1After = Number((await spl.getAccount(
      provider.connection,
      poolWalletToken1
    )).amount);

    expect(balanceOfPoolWalletSolAfter).to.be.greaterThanOrEqual(amount0Alice.toNumber());
    expect(balanceOfPoolWalletToken1After).to.be.equal(amount1Bob.toNumber());

    // Charlie swap 10 SOL to 100 token1
    try {
      const amount0InCharlie = new anchor.BN(10 * anchor.web3.LAMPORTS_PER_SOL)
      const tx4 = await program.methods.swap(amount0InCharlie, new anchor.BN(0)).accounts({
        poolState: poolStateAddr,
        poolWalletToken1: poolWalletToken1,
        sender: charlie.publicKey,
        tokenAcc1: charlieTokenAcc1,
        tokenProgram: spl.TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        poolWalletSol: poolWalletSolAddr
      }).signers([charlie]).rpc()
      assert(false, "Should have failed but did not")
    } catch (error) {
      expect(error).instanceOf(AnchorError)
      expect((error as AnchorError).error.errorMessage).to.be.equal("Pool does not enough token liquidity to swap")
      expect((error as AnchorError).error.errorCode.code).to.be.equal("PoolNotEnoughTokenLiquidity")
    }

    // David swap 500 token1 to 50 SOL
    try {
      const amount1InDavid = new anchor.BN(500 * Math.pow(10, 6))
      const tx5 = await program.methods.swap(new anchor.BN(0), amount1InDavid).accounts({
        poolState: poolStateAddr,
        poolWalletToken1: poolWalletToken1,
        sender: david.publicKey,
        tokenAcc1: davidTokenAcc1,
        tokenProgram: spl.TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        poolWalletSol: poolWalletSolAddr
      }).signers([david]).rpc()
      assert(false, "Should have failed but did not")
    } catch (error) {
      expect(error).instanceOf(AnchorError)
      expect((error as AnchorError).error.errorMessage).to.be.equal("Pool does not enough SOL liquidity to swap (include rent exemption)")
      expect((error as AnchorError).error.errorCode.code).to.be.equal("PoolNotEnoughSolLiquidity")
    }

  })

  it("Initialize, Alice deposit 5 SOL, Bob deposits 200 token1 and revert when Charlie or David swaps amount of token much more than they own", async () => {
    // Initialize
    const price = new anchor.BN(10)
    const tx1 = await program.methods.initialize(price).accounts({
      mintAccToken1: mintAccToken1,
      poolState: poolStateAddr,
      poolWalletToken1: poolWalletToken1,
      sender: alice.publicKey,
      poolWalletSol: poolWalletSolAddr,

      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: spl.TOKEN_PROGRAM_ID
    }).signers([alice]).rpc()

    // Alice deposit SOL
    const amount0Alice = new anchor.BN(anchor.web3.LAMPORTS_PER_SOL * 5)
    const tx2 = await program.methods.deposit(amount0Alice, new anchor.BN(0)).accounts({
      poolState: poolStateAddr,
      poolWalletToken1: poolWalletToken1,
      sender: alice.publicKey,
      tokenAcc1: aliceTokenAcc1,
      tokenProgram: spl.TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      poolWalletSol: poolWalletSolAddr
    }).signers([alice]).rpc()

    // Bob deposit token 1
    const amount1Bob = new anchor.BN(200 * Math.pow(10, 6))
    const tx3 = await program.methods.deposit(new anchor.BN(0), amount1Bob).accounts({
      poolState: poolStateAddr,
      poolWalletToken1: poolWalletToken1,
      sender: bob.publicKey,
      tokenAcc1: bobTokenAcc1,
      tokenProgram: spl.TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      poolWalletSol: poolWalletSolAddr
    }).signers([bob]).rpc()

    let balanceOfPoolWalletSolAfter = await provider.connection.getBalance(poolWalletSolAddr);

    let balanceOfPoolWalletToken1After = Number((await spl.getAccount(
      provider.connection,
      poolWalletToken1
    )).amount);

    expect(balanceOfPoolWalletSolAfter).to.be.greaterThanOrEqual(amount0Alice.toNumber());
    expect(balanceOfPoolWalletToken1After).to.be.equal(amount1Bob.toNumber());

    // Account info before Charlie swap token
    const balanceOfCharlieBefore = await provider.connection.getBalance(charlie.publicKey)

    // Charlie swap SOL to token1
    try {
      const amount0InCharlie = new anchor.BN(balanceOfCharlieBefore + 10)
      const tx4 = await program.methods.swap(amount0InCharlie, new anchor.BN(0)).accounts({
        poolState: poolStateAddr,
        poolWalletToken1: poolWalletToken1,
        sender: charlie.publicKey,
        tokenAcc1: charlieTokenAcc1,
        tokenProgram: spl.TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        poolWalletSol: poolWalletSolAddr
      }).signers([charlie]).rpc()
      assert(false, "Should have failed but did not")
    } catch (error) {
      expect(error).instanceOf(AnchorError)
      expect((error as AnchorError).error.errorMessage).to.be.equal("User does not enough SOL balance (include rent exemption)")
      expect((error as AnchorError).error.errorCode.code).to.be.equal("UserNotEnoughSolBalance")
    }

    // Account info before David swap token
    const balanceOfDavidTokenAcc1Before = Number((await spl.getAccount(
      provider.connection,
      davidTokenAcc1
    )).amount);

    // David swap token1 to SOL
    try {
      const amount1InDavid = new anchor.BN(balanceOfDavidTokenAcc1Before + 10)
      const tx5 = await program.methods.swap(new anchor.BN(0), amount1InDavid).accounts({
        poolState: poolStateAddr,
        poolWalletToken1: poolWalletToken1,
        sender: david.publicKey,
        tokenAcc1: davidTokenAcc1,
        tokenProgram: spl.TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        poolWalletSol: poolWalletSolAddr
      }).signers([david]).rpc()
      assert(false, "Should have failed but did not")
    } catch (error) {
      expect(error).instanceOf(AnchorError)
      expect((error as AnchorError).error.errorMessage).to.be.equal("User does not enough token amount")
      expect((error as AnchorError).error.errorCode.code).to.be.equal("UserNotEnoughTokenAmount")
    }
  })
});
