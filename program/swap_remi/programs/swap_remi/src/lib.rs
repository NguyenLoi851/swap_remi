use anchor_lang::prelude::*;
pub mod instructions;
pub mod state;
pub mod constants;
pub mod errors;

use instructions::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod swap_remi {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, price: u128) -> Result<()> {
        instructions::initialize(ctx, price)?;
        Ok(())
    }
}

// #[derive(Accounts)]
// pub struct Initialize {}
