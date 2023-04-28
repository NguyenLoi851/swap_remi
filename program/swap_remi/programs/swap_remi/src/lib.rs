use anchor_lang::prelude::*;
pub mod instructions;
pub mod state;
pub mod constants;
pub mod errors;

use instructions::*;

declare_id!("2FJyhaV6H11ZexBUXtAZtYiaDmtqZBrKWVpFDRoCEWBt");

#[program]
pub mod swap_remi {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, price: u64) -> Result<()> {
        instructions::initialize(ctx, price)?;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount_0: u64, amount_1: u64) -> Result<()> {
        instructions::deposit(ctx, amount_0, amount_1)?;
        Ok(())
    }

    pub fn swap(ctx: Context<Swap>, amount_0: u64, amount_1: u64) -> Result<()>{
        instructions::swap(ctx, amount_0, amount_1)?;
        Ok(())
    }
}
