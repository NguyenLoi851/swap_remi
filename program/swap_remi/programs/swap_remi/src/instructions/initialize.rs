use anchor_lang::prelude::*;

use crate::state::PoolState;
use anchor_spl::token::{Mint, Token, TokenAccount};

pub fn initialize(ctx: Context<Initialize>, price: u64) -> Result<()> {
    let state = &mut ctx.accounts.pool_state;
    state.mint_acc_token_1 = ctx.accounts.mint_acc_token_1.key().clone();
    state.price = price;
    state.pool_wallet_token_1 = ctx.accounts.pool_wallet_token_1.key().clone();
    state.bump = *ctx.bumps.get("pool_state").unwrap();
    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = sender,
        seeds = [b"state".as_ref(), mint_acc_token_1.key().as_ref()],
        bump,
        space = PoolState::LEN
    )]
    pool_state: Account<'info, PoolState>,

    #[account(mut)]
    sender: Signer<'info>,

    mint_acc_token_1: Account<'info, Mint>,

    #[account(
        init,
        payer = sender,
        seeds = [b"wallet".as_ref(), mint_acc_token_1.key().as_ref()],
        bump,
        token::mint = mint_acc_token_1,
        token::authority = pool_state
    )]
    pool_wallet_token_1: Account<'info, TokenAccount>,

    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    rent: Sysvar<'info, Rent>,
}
