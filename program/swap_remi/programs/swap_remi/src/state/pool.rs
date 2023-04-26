use anchor_lang::prelude::*;
use crate::constants::*;

#[account]
pub struct PoolState {
    pub mint_acc_token_0: Pubkey,
    pub mint_acc_token_1: Pubkey,
    pub price: u128,
    pub pool_wallet_token_0: Pubkey,
    pub pool_wallet_token_1: Pubkey
}

impl PoolState {
    pub const LEN: usize = 
        DISCRIMINATOR_LENGTH +
        PUBLIC_KEY_LENGTH +
        PUBLIC_KEY_LENGTH +
        U128_LENGTH +
        PUBLIC_KEY_LENGTH +
        PUBLIC_KEY_LENGTH;
}