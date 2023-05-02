use anchor_lang::{prelude::*, system_program};

use crate::errors::SwapError;
use crate::state::PoolState;
use anchor_spl::token::{Token, TokenAccount, Transfer};

pub fn deposit(ctx: Context<Deposit>, amount_0: u64, amount_1: u64) -> Result<()> {
    if amount_0 == 0 && amount_1 == 0 {
        return Err(SwapError::InvalidDepositAmount.into());
    }
    // ============ transfer sol ============
    if amount_0 > 0 {
        if ctx.accounts.sender.lamports() <= amount_0 {
            return Err(SwapError::UserNotEnoughSolBalance.into())
        }

        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.sender.to_account_info(),
                to: ctx.accounts.pool_wallet_sol.to_account_info(),
            },
        );
        system_program::transfer(cpi_ctx, amount_0)?;
    }

    // ============ transfer token 1 ============
    if amount_1 > 0 {
        if ctx.accounts.token_acc_1.amount < amount_1 {
            return Err(SwapError::UserNotEnoughTokenAmount.into())
        }

        let transfer_instruction = Transfer {
            from: ctx.accounts.token_acc_1.to_account_info(),
            to: ctx.accounts.pool_wallet_token_1.to_account_info(),
            authority: ctx.accounts.sender.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
        );

        anchor_spl::token::transfer(cpi_ctx, amount_1 as u64)?;
    }

    Ok(())
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    sender: Signer<'info>,

    #[account(mut)]
    pool_state: Account<'info, PoolState>,

    #[account(
        mut,
        constraint = pool_wallet_sol.key() == pool_state.pool_wallet_sol
    )]
    pool_wallet_sol: SystemAccount<'info>,

    #[account(mut)]
    token_acc_1: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = pool_wallet_token_1.key() == pool_state.pool_wallet_token_1
    )]
    pool_wallet_token_1: Account<'info, TokenAccount>,

    token_program: Program<'info, Token>,

    system_program: Program<'info, System>,
}
