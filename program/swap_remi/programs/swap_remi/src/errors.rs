use anchor_lang::error_code;

#[error_code]
pub enum SwapError {
    #[msg("Invalid deposit amount")]
    InvalidDepositAmount,
    #[msg("Invalid swap direction")]
    InvalidSwapDirection,
    #[msg("Pool does not enough SOL liquidity to swap (include rent exemption)")]
    PoolNotEnoughSolLiquidity,
    #[msg("Pool does not enough token liquidity to swap")]
    PoolNotEnoughTokenLiquidity,
    #[msg("User does not enough SOL balance (include rent exemption)")]
    UserNotEnoughSolBalance,
    #[msg("User does not enough token amount")]
    UserNotEnoughTokenAmount
}
