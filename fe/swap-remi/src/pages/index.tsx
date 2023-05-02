import type { NextPage } from "next";
import Head from "next/head";
import { HomeView } from "../views/home";

const Home: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Solana Swap Remi</title>
        <meta
          name="description"
          content="Solana Swap Remi"
        />
      </Head>
      <HomeView />
    </div>
  );
};

export default Home;
