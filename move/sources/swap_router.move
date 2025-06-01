module swap_manager::swap_router;

use std::string::{Self, String};
use std::vector;
use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::tx_context::TxContext;
use swap_manager::cetus_integration::USDC;
use swap_manager::swap_manager::SwapManager;

// -----------------------------------------------------------------------------
// Entry swap wrappers
// -----------------------------------------------------------------------------

/// Simple SUI → USDC swap via Cetus (demo)
public entry fun swap_sui_for_usdc(
    manager: &mut SwapManager,
    sui_coins: vector<Coin<SUI>>,
    min_usdc_out: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    swap_manager::swap_manager::cetus_swap_sui_to_usdc(
        manager,
        sui_coins,
        min_usdc_out,
        100, // 1% default slippage
        clock,
        ctx,
    );
}

/// Simple USDC → SUI swap via Cetus (demo)
public entry fun swap_usdc_for_sui(
    manager: &mut SwapManager,
    usdc_coins: vector<Coin<USDC>>,
    min_sui_out: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    swap_manager::swap_manager::cetus_swap_usdc_to_sui(
        manager,
        usdc_coins,
        min_sui_out,
        100, // 1% default slippage
        clock,
        ctx,
    );
}

// -----------------------------------------------------------------------------
// View helpers
// -----------------------------------------------------------------------------

public fun get_sui_to_usdc_quote(manager: &SwapManager, amount_in: u64): u64 {
    swap_manager::swap_manager::get_swap_quote_sui_to_usdc(manager, amount_in)
}

public fun get_usdc_to_sui_quote(manager: &SwapManager, amount_in: u64): u64 {
    swap_manager::swap_manager::get_swap_quote_usdc_to_sui(manager, amount_in)
}

public fun is_pair_supported(manager: &SwapManager, pair_name: vector<u8>): bool {
    let s = string::utf8(pair_name);
    swap_manager::swap_manager::is_pair_supported(manager, s)
}

public fun get_available_trading_pairs(manager: &SwapManager): vector<String> {
    swap_manager::swap_manager::get_available_pairs(manager)
}
