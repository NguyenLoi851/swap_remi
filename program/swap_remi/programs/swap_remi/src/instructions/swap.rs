use anchor_lang::{prelude::*, system_program};
use anchor_spl::token::{Token, TokenAccount, Transfer};

use crate::errors::SwapError;
use crate::state::PoolState;

// If amount_0 > 0, swap from SOL to token_1
// and vice versa
// 1 (SOL) = 1 (token_1) * price
pub fn swap(ctx: Context<Swap>, amount_0: u64, amount_1: u64) -> Result<()> {
    // Check valid swap direction
    if (amount_0 == 0 && amount_1 == 0) || (amount_0 > 0 && amount_1 > 0) {
        return Err(SwapError::InvalidSwapDirection.into());
    }
    let pool_state = &ctx.accounts.pool_state;

    // Set swap direction
    let price = pool_state.price;
    let amount_in = if amount_0 > 0 { amount_0 } else { amount_1 };
    let amount_out = if amount_in == amount_0 {
        amount_in * price * (10_i32.pow(pool_state.decimal_token_1.into()) as u64) / (10_i32.pow(9)) as u64
    } else {
        amount_in * (10_i32.pow(9)) as u64 / (10_i32.pow(pool_state.decimal_token_1.into()) as u64) / price
    };

    // swap from SOL to token
    if amount_in == amount_0 {
        // sender transfer SOL to pool_state

        //check liquidity amount
        if ctx.accounts.sender.lamports() <= amount_in {
            return Err(SwapError::UserNotEnoughSolBalance.into())
        }
        if ctx.accounts.pool_wallet_token_1.amount < amount_out {
            return Err(SwapError::PoolNotEnoughTokenLiquidity.into())
        }

        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.sender.to_account_info(),
                to: ctx.accounts.pool_wallet_sol.to_account_info(),
            },
        );

        system_program::transfer(cpi_ctx, amount_in)?;

        // pool transfer token to sender
        let transfer_instruction = Transfer {
            from: ctx.accounts.pool_wallet_token_1.to_account_info(),
            to: ctx.accounts.token_acc_1.to_account_info(),
            authority: pool_state.to_account_info(),
        };

        let bump_vector = pool_state.state_bump.to_le_bytes();

        let signer_seeds = vec![
            b"state".as_ref(),
            pool_state.mint_acc_token_1.as_ref(),
            bump_vector.as_ref(),
        ];

        let signer_seeds_vector = vec![signer_seeds.as_slice()];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
            signer_seeds_vector.as_slice(),
        );

        anchor_spl::token::transfer(cpi_ctx, amount_out)?;
    }
    // swap from token to SOL
    else {
        // sender transfer token to pool_state
        // check liquidity condition
        // msg!("{}", ctx.accounts.rent.minimum_balance(ctx.accounts.pool_wallet_sol.to_account_info().data_len()));
        let rent_exempt_amount = ctx.accounts.rent.minimum_balance(ctx.accounts.pool_wallet_sol.to_account_info().data_len());
        if ctx.accounts.token_acc_1.amount < amount_in {
            return Err(SwapError::UserNotEnoughTokenAmount.into())
        }
        
        if ctx.accounts.pool_wallet_sol.lamports() - rent_exempt_amount < amount_out {
            return Err(SwapError::PoolNotEnoughSolLiquidity.into())
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

        anchor_spl::token::transfer(cpi_ctx, amount_in)?;

        // pool transfer SOL to sender

        let bump_vector = pool_state.wallet_sol_bump.to_le_bytes();

        let signer_seeds = vec![
            b"wallet_sol".as_ref(),
            bump_vector.as_ref(),
        ];
        
        let signer_seeds_vector = vec![signer_seeds.as_slice()];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.pool_wallet_sol.to_account_info(),
                to: ctx.accounts.sender.to_account_info(),
            },
            signer_seeds_vector.as_slice(),
        );

        system_program::transfer(cpi_ctx, amount_out)?;
    }

    Ok(())
}

#[derive(Accounts)]
pub struct Swap<'info> {
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
    rent: Sysvar<'info, Rent>,
}
