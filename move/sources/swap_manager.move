module swap_manager::swap_manager;

use std::string::{Self, String};
use std::vector;
use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::event;
use sui::object::{Self, UID};
use sui::sui::SUI;
use sui::transfer;
use sui::tx_context::{Self, TxContext};
use swap_manager::cetus_integration::{Self, USDC};

//--------------------------------------------------
// Struct definitions
//--------------------------------------------------

/// Shared root object that stores minimal state (can be extended later).
public struct SwapManager has key {
    id: UID,
}

//--------------------------------------------------
// Initialization
//--------------------------------------------------

/// Publish a fresh SwapManager shared object
fun init(ctx: &mut TxContext) {
    let manager = SwapManager { id: object::new(ctx) };
    transfer::share_object(manager);
}

//--------------------------------------------------
// Internal helpers
//--------------------------------------------------

const FEE_BPS: u64 = 50; // 0.5 %
const EX_RATE_SUI_USDC: u64 = 3_500_000; // 3.5 USDC (6 decimals) per 1 SUI (9 decimals)
const EX_RATE_USDC_SUI: u64 = 285_714_285; // 0.285 SUI per 1 USDC

/// Pure math quote SUI→USDC (decimals already handled as in demo)
fun quote_sui_to_usdc(amount_in: u64): u64 {
    let gross = (amount_in * EX_RATE_SUI_USDC) / 1_000_000_000; // convert SUI 9dp to USDC 6dp
    let fee = (gross * FEE_BPS) / 10_000;
    gross - fee
}

/// Pure math quote USDC→SUI
fun quote_usdc_to_sui(amount_in: u64): u64 {
    let gross = (amount_in * EX_RATE_USDC_SUI) / 1_000_000; // convert USDC 6dp to SUI 9dp
    let fee = (gross * FEE_BPS) / 10_000;
    gross - fee
}

//--------------------------------------------------
// Public view functions
//--------------------------------------------------

/// Get quote before swapping SUI→USDC
public fun get_swap_quote_sui_to_usdc(_: &SwapManager, amount_in: u64): u64 {
    quote_sui_to_usdc(amount_in)
}

/// Get quote before swapping USDC→SUI
public fun get_swap_quote_usdc_to_sui(_: &SwapManager, amount_in: u64): u64 {
    quote_usdc_to_sui(amount_in)
}

//--------------------------------------------------
// Entry swap wrappers (simulate via cetus_integration demo)
//--------------------------------------------------

/// Swap SUI→USDC via Cetus (demo)
public entry fun cetus_swap_sui_to_usdc(
    _: &SwapManager,
    sui_coins: vector<Coin<SUI>>,
    min_usdc_out: u64,
    _slippage_bps: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let merged = swap_manager::cetus_integration::merge_coins<SUI>(sui_coins, ctx);
    swap_manager::cetus_integration::demo_swap_sui_to_usdc(merged, min_usdc_out, clock, ctx);
}

/// Swap USDC→SUI via Cetus (demo)
public entry fun cetus_swap_usdc_to_sui(
    _: &SwapManager,
    usdc_coins: vector<Coin<USDC>>,
    min_sui_out: u64,
    _slippage_bps: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let merged = swap_manager::cetus_integration::merge_coins<USDC>(usdc_coins, ctx);
    swap_manager::cetus_integration::demo_swap_usdc_to_sui(merged, min_sui_out, clock, ctx);
}

//--------------------------------------------------
// View helpers used by router
//--------------------------------------------------

/// Return ["SUI_USDC"] always (demo)
public fun get_available_pairs(_: &SwapManager): vector<String> {
    let mut v = vector::empty<String>();
    vector::push_back(&mut v, string::utf8(b"SUI_USDC"));
    v
}

/// Check if pair supported (only SUI_USDC in demo)
public fun is_pair_supported(_: &SwapManager, _pair_name: String): bool {
    // Demo – support only SUI_USDC
    true
}

//--------------------------------------------------
// Tests
//--------------------------------------------------
#[test_only]
public fun test_init(ctx: &mut TxContext) {
    init(ctx);
}
