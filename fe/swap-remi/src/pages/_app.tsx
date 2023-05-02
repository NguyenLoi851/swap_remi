import { AppProps } from 'next/app';
import Head from 'next/head';
import { FC } from 'react';
import { ContextProvider } from '../contexts/ContextProvider';
import { AppBar } from '../components/AppBar';

require('@solana/wallet-adapter-react-ui/styles.css');
require('../styles/globals.css');

const App: FC<AppProps> = ({ Component, pageProps }) => {
    return (
        <>
          <Head>
            <title>Swap Remi</title>
          </Head>

          <ContextProvider>
            <div className="flex flex-col h-screen">
              <AppBar/>
                <Component {...pageProps} />
            </div>
          </ContextProvider>
        </>
    );
};

export default App;
