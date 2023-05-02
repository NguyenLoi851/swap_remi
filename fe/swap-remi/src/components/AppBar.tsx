import { FC } from 'react';
import Link from "next/link";
import dynamic from 'next/dynamic';
import React, { useState } from "react";
import { useAutoConnect } from '../contexts/AutoConnectProvider';
import NetworkSwitcher from './NetworkSwitcher';

const WalletMultiButtonDynamic = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false }
);

export const AppBar: React.FC = () => {

    return (
        <div className='bg-purple-600'>
            <div className='flex flex-row relative m-20'>
                <div className='text-7xl font-bold'>
                    Swap Remi
                </div>
                <div className='text-center absolute top-0 right-0'>
                    <div>
                        <WalletMultiButtonDynamic className="rounded-btn text-lg mr-6 color: #000 bg-black"/>
                    </div>
                    <div>
                        <NetworkSwitcher />
                    </div>
                </div>
            </div>
        </div>
    );
};
