import { AnchorWallet, useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import React, { FC, useEffect, useState } from "react";
import idl from "../../idl.json"
import { AnchorProvider, BN, Program, web3 } from "@project-serum/anchor"
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAccount, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useRouter } from 'next/router'

const getProvider = (wallet: AnchorWallet | undefined): AnchorProvider | undefined => {
    if (!wallet) {
        return;
    }
    const connection = new Connection(clusterApiUrl(WalletAdapterNetwork.Testnet), "confirmed");
    return new AnchorProvider(connection, wallet, {
        // preflightCommitment: "",
    });
};

export const HomeView: FC = ({ }) => {
    const router = useRouter()
    const wallet = useWallet()
    const anchorWallet = useAnchorWallet()
    const { connection } = useConnection();
    const [userBalance, setUserBalance] = useState(0)
    const [userTokenAccBalance, setUserTokenAccBalance] = useState(0)
    const [poolStateAddr, setPoolStateAddr] = useState(new web3.PublicKey('DQcBo1bqW799kN6PnNVHyDDWToMp4C2vrLJgwMLDqtPZ'))
    const [poolWalletSolAddr, setPoolWalletSolAddr] = useState(new web3.PublicKey('DQcBo1bqW799kN6PnNVHyDDWToMp4C2vrLJgwMLDqtPZ'))
    const [poolWalletSolBalance, setPoolWalletSolBalance] = useState(0)
    const [poolWalletToken1, setPoolWalletToken1] = useState(new web3.PublicKey('DQcBo1bqW799kN6PnNVHyDDWToMp4C2vrLJgwMLDqtPZ'))
    const [poolWalletTokenAmount, setPoolWalletTokenAmount] = useState(0)
    const [swapTokenInOut, setSwapTokenInOut] = useState(["SOL", "MOVE"])
    const [swapTokenAmountInOut, setSwapTokenAmountInOut] = useState([0, 0])
    const [userTokenAcc, setUserTokenAcc] = useState(new web3.PublicKey('DQcBo1bqW799kN6PnNVHyDDWToMp4C2vrLJgwMLDqtPZ'))
    const [tokenDecimals, setTokenDecimals] = useState(0)

    const PROGRAM_ID = idl.metadata.address
    const mintTokenAcc = new web3.PublicKey('DQcBo1bqW799kN6PnNVHyDDWToMp4C2vrLJgwMLDqtPZ')
    const provider = getProvider(anchorWallet)
    const [solLiquidityAmount, setSolLiquidityAmount] = useState(0)
    const [tokenLiquidityAmount, setTokenLiquidityAmount] = useState(0)

    const handleChangeSolLiquidityAmount = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSolLiquidityAmount(Number(event.target.value));
    }

    const handleChangeTokenlLiquidityAmount = async (event: React.ChangeEvent<HTMLInputElement>) => {
        setTokenLiquidityAmount(Number(event.target.value));
    }

    const getPoolStateAddr = async (mintAccToken1: web3.PublicKey) => {
        let [poolStateAddr, poolStateBump] = findProgramAddressSync(
            [Buffer.from("state"), mintAccToken1.toBuffer()],
            new web3.PublicKey(PROGRAM_ID)
        )

        return [poolStateAddr, poolStateBump]
    }

    const getPoolWalletSolAddr = async () => {
        let [poolWalletSolAddr, poolWalletSolBump] = findProgramAddressSync(
            [Buffer.from("wallet_sol")],
            new web3.PublicKey(PROGRAM_ID)
        )
        return [poolWalletSolAddr, poolWalletSolBump]
    }

    const getPoolWalletSolBalance = async () => {
        if (poolWalletSolAddr.toBase58() != 'DQcBo1bqW799kN6PnNVHyDDWToMp4C2vrLJgwMLDqtPZ') {
            return connection.getBalance(poolWalletSolAddr)
        } else {
            return 0;
        }
    }

    const getPoolWalletTokenAddr = async (mintAccToken: web3.PublicKey) => {
        let [poolWalletToken, poolWalletBump] = findProgramAddressSync(
            [Buffer.from("wallet"), mintAccToken.toBuffer()],
            new web3.PublicKey(PROGRAM_ID)
        )
        return [poolWalletToken, poolWalletBump]
    }

    const getPoolWalletTokenAmount = async () => {
        if (poolWalletToken1.toBase58() != 'DQcBo1bqW799kN6PnNVHyDDWToMp4C2vrLJgwMLDqtPZ') {
            return (await getAccount(connection, poolWalletToken1)).amount
        } else {
            return 0
        }
    }

    const getProgram = async (idl: any, programAddress: string, provider: AnchorProvider) => {
        return new Program(idl, programAddress, provider)
    }

    const getUserBalance = async () => {
        if (wallet.publicKey != null) {
            setUserBalance((await connection.getBalance(wallet.publicKey)) / LAMPORTS_PER_SOL)
        }
    }

    useEffect(() => {
        console.log(wallet.publicKey)
        try {
            getUserBalance()
        } catch (error) {
            console.log(error)
        }

        try {
            // user token balance
            const getUserTokenAcc = async () => {
                if (wallet.publicKey != null) {
                    const userTokenAcc = (await getAssociatedTokenAddress(
                        mintTokenAcc,
                        wallet.publicKey,
                        true,
                        TOKEN_PROGRAM_ID,
                        ASSOCIATED_TOKEN_PROGRAM_ID
                    ))
                    const mintTokenAccInfo = (await connection.getParsedAccountInfo(mintTokenAcc))
                    const decimals = ((mintTokenAccInfo.value?.data) as any).parsed.info.decimals
                    setTokenDecimals(decimals)
                    setUserTokenAcc(userTokenAcc)
                    try {
                        setUserTokenAccBalance(Number((await getAccount(connection, userTokenAcc)).amount) / Math.pow(10, Number(decimals)))
                    } catch (error) {
                        setUserTokenAccBalance(-1);
                    }
                }
            }
            getUserTokenAcc()
        } catch (error) {
            // console.log(error)
        }

        getPoolStateAddr(mintTokenAcc).then((e) => {
            if (typeof e[0] != "number") {
                setPoolStateAddr(e[0]);
            }
        });

        getPoolWalletTokenAddr(mintTokenAcc).then((e) => {
            if (typeof e[0] != "number") {
                setPoolWalletToken1(e[0])
            }
        })

        getPoolWalletSolAddr().then((e) => {
            if (typeof e[0] != "number") {
                setPoolWalletSolAddr(e[0])
            }
        })
        setSolLiquidityAmount(0);
        setTokenLiquidityAmount(0);

        getPoolWalletSolBalance().then((e) => setPoolWalletSolBalance(e / LAMPORTS_PER_SOL));
        getPoolWalletTokenAmount().then(async (e) => {
            const mintTokenAccInfo = (await connection.getParsedAccountInfo(mintTokenAcc))
            const decimals = ((mintTokenAccInfo.value?.data) as any).parsed.info.decimals
            setTokenDecimals(decimals)
            setPoolWalletTokenAmount(Number(e) / Math.pow(10, Number(decimals)))
        })
    }, [wallet.publicKey])

    const handleAddLiquidity = async () => {
        if (solLiquidityAmount == 0 && tokenLiquidityAmount == 0) {
            return;
        }
        if (provider == null) {
            return;
        }
        const program = await getProgram(idl, PROGRAM_ID, provider);

        let userTokenAcc
        if (wallet.publicKey != null) {
            userTokenAcc = await getAssociatedTokenAddress(
                mintTokenAcc,
                wallet.publicKey,
                true,
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID
            )
        }

        const tx = new web3.Transaction().add(
            await program.methods.deposit(
                new BN(solLiquidityAmount * LAMPORTS_PER_SOL),
                new BN(tokenLiquidityAmount * Math.pow(10, tokenDecimals))
            ).accounts({
                poolState: poolStateAddr,
                poolWalletToken1: poolWalletToken1,
                sender: wallet.publicKey,
                tokenAcc1: userTokenAcc,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                poolWalletSol: poolWalletSolAddr
            } as any).instruction()
        )

        const recentBlockhash = await connection.getLatestBlockhash("finalized")
        tx.recentBlockhash = recentBlockhash.blockhash;
        if (wallet.publicKey != null) {
            tx.feePayer = wallet.publicKey;
        }
        const timeout = (ms: number) => {
            return new Promise(r => setTimeout(r, ms))
        }
        if (wallet.signTransaction != null) {
            try {
                const signedTx = await wallet.signTransaction(tx);
                const txId = await connection.sendRawTransaction(signedTx.serialize())
                connection.onSignatureWithOptions(txId, ()=>{
                    router.reload()
                })
            } catch (error) {
                try {
                    const errorObject = JSON.parse(JSON.stringify(error));
                    const errorMessageFullLog = errorObject.logs.find((e: any) => e.includes("Error Message"));
                    try {
                        const errorMessage = errorMessageFullLog.split("Error Message: ")[1]
                        alert(errorMessage)
                    } catch (error) {
                        console.log(error)
                    }
                } catch (e) {
                    console.log(e)
                }

            }
        }
    }

    const handleSetSwapTokenInOut = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSwapTokenInOut([event.target.value, event.target.value == "SOL" ? "MOVE" : "SOL"])
        setSwapTokenAmountInOut([0, 0])
    }

    const handleSetSwapTokenAmountInOut = (event: React.ChangeEvent<HTMLInputElement>) => {
        swapTokenInOut[0] == "SOL" ?
            setSwapTokenAmountInOut([Number(event.target.value), Number(event.target.value) * 10]) :
            setSwapTokenAmountInOut([Number(event.target.value), Number(event.target.value) / 10])
    }

    const handleSwap = async () => {
        if (swapTokenAmountInOut[0] == 0 || swapTokenAmountInOut[1] == 0) {
            return
        }
        if (provider == null) {
            return;
        }
        const program = await getProgram(idl, PROGRAM_ID, provider);

        const tx = new web3.Transaction()

        if (userTokenAccBalance < 0) {
            if (wallet.publicKey == null) {
                return;
            }
            tx.add(createAssociatedTokenAccountInstruction(
                wallet.publicKey,
                userTokenAcc,
                wallet.publicKey,
                mintTokenAcc,
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID
            )
            )
        }

        tx.add(
            await program.methods.swap(
                swapTokenInOut[0] == "SOL" ? new BN(swapTokenAmountInOut[0] * Math.pow(10, 9)) : new BN(0),
                swapTokenInOut[0] == "SOL" ? new BN(0) : new BN(swapTokenAmountInOut[0] * Math.pow(10, tokenDecimals))
            ).accounts({
                poolState: poolStateAddr,
                poolWalletToken1: poolWalletToken1,
                sender: wallet.publicKey,
                tokenAcc1: userTokenAcc,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                poolWalletSol: poolWalletSolAddr
            } as any).instruction()
        )

        const recentBlockhash = await connection.getLatestBlockhash("finalized")
        tx.recentBlockhash = recentBlockhash.blockhash;
        if (wallet.publicKey != null) {
            tx.feePayer = wallet.publicKey;
        }
        const timeout = (ms: number) => {
            return new Promise(r => setTimeout(r, ms))
        }
        if (wallet.signTransaction != null) {
            try {
                const signedTx = await wallet.signTransaction(tx);
                const txId = await connection.sendRawTransaction(signedTx.serialize())
                connection.onSignatureWithOptions(txId, ()=>{
                    router.reload()
                })
            } catch (error) {
                const errorObject = JSON.parse(JSON.stringify(error));
                const errorMessageFullLog = errorObject.logs.find((e: any) => e.includes("Error Message"));
                try {
                    const errorMessage = errorMessageFullLog.split("Error Message: ")[1]
                    alert(errorMessage)
                } catch (e) {
                    if ((error as TypeError).message.includes("without insufficient funds for rent")) {
                        alert("This can make pool wallet of SOL does not enough funds for rent")
                    }
                }
            }
        }
    }

    return (
        <div>
            {wallet.publicKey &&
                <div className="flex flex-row relative">
                    <div className="m-20 absolute left-20">
                        <div className="grid gap-4">
                            <div className="text-center font-bold text-2xl">Pool Swap Info</div>
                            <div>Swap program id: {PROGRAM_ID}</div>
                            <div>Pool State Addr: {poolStateAddr.toBase58()}</div>
                            <br />
                            <div>Pool Wallet SOL Addr: {poolWalletSolAddr.toBase58()}</div>
                            <div>Pool Wallet SOL Balance: <span className="text-yellow-600 font-bold">{poolWalletSolBalance} SOL</span></div>
                            <br />
                            <div>Pool Wallet Of MOVE Token: {poolWalletToken1.toBase58()}</div>
                            <div>Pool Wallet Of MOVE Token Amount: <span className="text-yellow-600 font-bold">{poolWalletTokenAmount} MOVE</span></div>
                        </div>
                        <div className="m-20"></div>
                        <div>
                            <div className="text-2xl font-bold text-center">User Info</div>
                            <div>User Account: {wallet.publicKey?.toBase58()}</div>
                            <div>User's SOL Balance: <span className="text-yellow-600 font-bold">{userBalance} SOL</span></div>
                            <br />
                            <div>User Associated Token Account: {userTokenAcc.toBase58()}</div>
                            {
                                userTokenAccBalance != -1 ?
                                    <div>User's Token Balance: <span className="text-yellow-600 font-bold">{userTokenAccBalance} MOVE</span></div> :
                                    <div>User's Token Balance: HAVE NOT BEEN CREATED</div>
                            }
                        </div>
                    </div>
                    <div className="m-20 absolute right-20">
                        <div className="grid gap-10 border-2 border-gray-900 p-5">
                            <div className="font-bold text-center text-2xl">Add Token Liquidity</div>
                            <div><input className="border-teal-700 border-2" type="number" value={solLiquidityAmount} onChange={handleChangeSolLiquidityAmount}></input> SOL</div>
                            <div><input className="border-teal-700 border-2" type="number" value={tokenLiquidityAmount} onChange={handleChangeTokenlLiquidityAmount}></input> MOVE</div>
                            <button onClick={handleAddLiquidity} className="bg-amber-300">ADD LIQUIDITY</button>
                        </div>
                        <div className="m-20"></div>
                        <div className="grid gap-8 border-2 border-gray-900 p-5">
                            <div className="font-bold text-center text-2xl">Swap Token</div>
                            <div>
                                <input className="border-teal-700 border-2" type="number" value={swapTokenAmountInOut[0]} onChange={(e) => handleSetSwapTokenAmountInOut(e)}></input>
                                <select
                                    value={swapTokenInOut[0]}
                                    onChange={(e) => handleSetSwapTokenInOut(e)}
                                    className="select max-w-xs m-5"
                                >
                                    <option value="SOL">SOL</option>
                                    <option value="MOVE">MOVE</option>
                                </select>
                            </div>
                            <div>You will receive <span className="font-bold text-yellow-600">{swapTokenAmountInOut[1]} {swapTokenInOut[1]}</span></div>
                            <button onClick={handleSwap} className="bg-amber-300">SWAP</button>
                        </div>
                    </div>
                </div>
            }

        </div>
    )
}
