use crate::constants::*;
use anchor_lang::prelude::*;

#[account]
pub struct PoolState {
    pub mint_acc_token_1: Pubkey,
    pub price: u64,
    pub pool_wallet_token_1: Pubkey,
    pub bump: u8,
}

impl PoolState {
    pub const LEN: usize =
        DISCRIMINATOR_LENGTH + PUBLIC_KEY_LENGTH + U64_LENGTH + PUBLIC_KEY_LENGTH + U8_LENGTH;
}
