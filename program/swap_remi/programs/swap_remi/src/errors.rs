use anchor_lang::error_code;

#[error_code]
pub enum SwapError {
    #[msg("Invalid radio")]
    InvalidRadio,
    #[msg("Invalid swap direction")]
    InvalidSwapDirection,
    #[msg("Not enough liquidity to swap")]
    NotEnoughLiquidity
}