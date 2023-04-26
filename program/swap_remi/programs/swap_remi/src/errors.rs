use anchor_lang::error_code;

#[error_code]
pub enum SwapError {
    #[msg("Invalid radio")]
    InvalidRadio,
}