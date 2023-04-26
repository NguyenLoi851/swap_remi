import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SwapRemi } from "../target/types/swap_remi";

describe("swap_remi", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.SwapRemi as Program<SwapRemi>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
