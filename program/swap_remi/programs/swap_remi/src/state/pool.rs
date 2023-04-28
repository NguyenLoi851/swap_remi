use crate::constants::*;
use anchor_lang::prelude::*;

#[account]
pub struct PoolState {
    pub mint_acc_token_1: Pubkey,
    pub price: u64,
    pub pool_wallet_token_1: Pubkey,
    pub state_bump: u8,
    pub wallet_sol_bump: u8,
    pub pool_wallet_sol: Pubkey,
    pub decimal_token_1: u8
}

impl PoolState {
    pub const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH
        + U64_LENGTH
        + PUBLIC_KEY_LENGTH
        + U8_LENGTH
        + U8_LENGTH 
        + PUBLIC_KEY_LENGTH
        + U8_LENGTH;
}
