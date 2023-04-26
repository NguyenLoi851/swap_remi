use anchor_lang::prelude::*;

use crate::state::PoolState;
use crate::errors::SwapError;
use anchor_spl::token::{Transfer, TokenAccount, Token};

// pub fn deposit(
//     ctx: Context<Deposit>,
//     amount_0: u128,
//     amount_1: u128
// ) -> Result<()>{
//     let state = &ctx.accounts.pool_state;

//     // let price = state.price;
//     // if amount_0 * price != amount_1 {
//     //     Err(SwapError::InvalidRadio.into())
//     // }

//     // ============ transfer token 0 ============
//     if amount_0 > 0 {
//         let transfer_instruction = Transfer{
//             from: ctx.accounts.token_acc_0.to_account_info(),
//             to: ctx.accounts.pool_wallet_token_0.to_account_info(),
//             authority: ctx.accounts.sender.to_account_info()
//         };

//         let cpi_ctx = CpiContext::new(
//             ctx.accounts.token_program.to_account_info(),
//             transfer_instruction
//         );

//         anchor_spl::token::transfer(cpi_ctx, amount_0 as u64)?;

//     }

//     // ============ transfer token 1 ============
//     if amount_1 > 0 {
//         let transfer_instruction = Transfer{
//             from: ctx.accounts.token_acc_1.to_account_info(),
//             to: ctx.accounts.pool_wallet_token_1.to_account_info(),
//             authority: ctx.accounts.sender.to_account_info()
//         };

//         let cpi_ctx = CpiContext::new(
//             ctx.accounts.token_program.to_account_info(),
//             transfer_instruction,
//         );

//         anchor_spl::token::transfer(cpi_ctx, amount_1 as u64)?;
//     }

//     Ok(())

// }

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    sender: Signer<'info>,

    pool_state: Account<'info, PoolState>,

    #[account(mut)]
    token_acc_0: Account<'info, TokenAccount>,

    #[account(mut)]
    token_acc_1: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = pool_wallet_token_0.key() == pool_state.pool_wallet_token_0
    )]
    pool_wallet_token_0: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = pool_wallet_token_1.key() == pool_state.pool_wallet_token_1
    )]
    pool_wallet_token_1: Account<'info, TokenAccount>,

    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
}
