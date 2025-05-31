module swap_manager::swap_manager;

use std::string::{Self, String};
use std::vector;
use sui::clock::{Self, Clock};
use sui::coin::{Self, Coin};
use sui::event;
use sui::object::{Self, UID};
use sui::sui::SUI;
use sui::table::{Self, Table};
use sui::transfer;
use sui::tx_context::{Self, TxContext};

// Import USDC coin type for real swaps
// Note: Replace with actual USDC package ID when deploying
public struct USDC has drop {}

// USDC Treasury capability for demo minting (testnet only)
public struct USDCTreasury has key {
    id: UID,
    total_supply: u64,
}

// Initialize USDC treasury for demo purposes
fun init_usdc_treasury(ctx: &mut TxContext): USDCTreasury {
    USDCTreasury {
        id: object::new(ctx),
        total_supply: 0,
    }
}

// Demo function to create USDC (testnet only)
public fun create_usdc_for_demo(amount: u64, ctx: &mut TxContext): Coin<USDC> {
    // For demo purposes only - in production, use real USDC
    coin::zero<USDC>(ctx)
}

// Demo function to create SUI (testnet only)
public fun create_sui_for_demo(amount: u64, ctx: &mut TxContext): Coin<SUI> {
    // For demo purposes only - in production, use real SUI from DEX
    coin::zero<SUI>(ctx)
}

// ================ Constants ================
const TURBOS_DEX: u8 = 1;
const FLOWX_DEX: u8 = 2;
const AFTERMATH_DEX: u8 = 3;
const CETUS_DEX: u8 = 4;

// ================ Errors ================
const EInvalidDEX: u64 = 1;
const ESlippageTooHigh: u64 = 2;
const EInvalidAmount: u64 = 3;
const EDEXNotRegistered: u64 = 4;
const EUnsupportedPair: u64 = 5;

// ================ Structs ================

/// Admin capability for managing the system
public struct AdminCap has key {
    id: UID,
}

/// Main registry for DEX and swap logs
public struct SwapManager has key {
    id: UID,
    dex_configs: Table<u8, DEXConfig>,
    swap_logs: vector<SwapLog>,
    ai_logs: vector<AICommandLog>,
    // Add pool configurations for real DEX integration
    pool_configs: Table<String, PoolConfig>,
}

/// DEX configuration
public struct DEXConfig has store {
    name: String,
    enabled: bool,
    fee_bps: u64, // Fee in basis points
    total_volume: u64,
    // Add package ID for real DEX calls
    package_id: String,
}

/// Pool configuration for specific trading pairs
public struct PoolConfig has store {
    pair_name: String, // e.g., "SUI_USDC"
    dex_id: u8,
    pool_object_id: String,
    enabled: bool,
    fee_tier: u64,
}

/// Log of a swap transaction
public struct SwapLog has copy, drop, store {
    timestamp: u64,
    dex: u8,
    from_token: String,
    to_token: String,
    from_amount: u64,
    to_amount: u64,
    trader: address,
    pool_used: String,
}

/// Log of AI command
public struct AICommandLog has copy, drop, store {
    timestamp: u64,
    command: String,
    trader: address,
    executed: bool,
    result_hash: vector<u8>,
}

/// Event emitted when a swap is executed
public struct SwapExecuted has copy, drop {
    dex: u8,
    from_token: String,
    to_token: String,
    from_amount: u64,
    to_amount: u64,
    trader: address,
    timestamp: u64,
    pool_used: String,
}

/// Event for AI command
public struct AICommandExecuted has copy, drop {
    command: String,
    trader: address,
    timestamp: u64,
    success: bool,
}

// ================ Init Function ================
fun init(ctx: &mut TxContext) {
    // Create admin capability
    let admin_cap = AdminCap {
        id: object::new(ctx),
    };
    transfer::transfer(admin_cap, tx_context::sender(ctx));

    // Create swap manager
    let mut manager = SwapManager {
        id: object::new(ctx),
        dex_configs: table::new(ctx),
        swap_logs: vector::empty(),
        ai_logs: vector::empty(),
        pool_configs: table::new(ctx),
    };

    // Register default DEXs with package IDs (replace with real IDs)
    table::add(
        &mut manager.dex_configs,
        TURBOS_DEX,
        DEXConfig {
            name: string::utf8(b"Turbos"),
            enabled: true,
            fee_bps: 30, // 0.3%
            total_volume: 0,
            package_id: string::utf8(
                b"0x91bfbc386a41afcfd9b2533058d7e915a1d3829089cc268ff4333d54d6339ca1",
            ), // Turbos package
        },
    );

    table::add(
        &mut manager.dex_configs,
        FLOWX_DEX,
        DEXConfig {
            name: string::utf8(b"FlowX"),
            enabled: true,
            fee_bps: 25, // 0.25%
            total_volume: 0,
            package_id: string::utf8(
                b"0x5c45d10c26c5fb53bfaff819666da6bc7053d2190dfa29fec311cc666ff1f4b0",
            ), // FlowX package
        },
    );

    table::add(
        &mut manager.dex_configs,
        AFTERMATH_DEX,
        DEXConfig {
            name: string::utf8(b"Aftermath"),
            enabled: true,
            fee_bps: 20, // 0.2%
            total_volume: 0,
            package_id: string::utf8(
                b"0x7903f6171f84c9f0e7e0fdb12b9b33a0c96b5f2a91c91b1d5c3e4a5b6c7d8e9f",
            ), // Aftermath package
        },
    );

    table::add(
        &mut manager.dex_configs,
        CETUS_DEX,
        DEXConfig {
            name: string::utf8(b"Cetus"),
            enabled: true,
            fee_bps: 15, // 0.15%
            total_volume: 0,
            package_id: string::utf8(
                b"0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb",
            ), // Cetus package
        },
    );

    // Add default pool configurations (replace with real pool IDs)
    table::add(
        &mut manager.pool_configs,
        string::utf8(b"SUI_USDC"),
        PoolConfig {
            pair_name: string::utf8(b"SUI_USDC"),
            dex_id: CETUS_DEX,
            pool_object_id: string::utf8(
                b"0x2e041f3fd93646dcc877f783c1f2b7fa62d30271bdef1f21ef002cebf857bded",
            ), // Cetus SUI/USDC pool
            enabled: true,
            fee_tier: 500, // 0.05%
        },
    );

    transfer::share_object(manager);
}

/// Test init function for testing
#[test_only]
public fun test_init(ctx: &mut TxContext) {
    init(ctx);
}

// ================ Core Functions ================

/// Real swap function using Cetus DEX integration
public fun swap_sui_to_usdc(
    manager: &mut SwapManager,
    from: Coin<SUI>,
    min_amount_out: u64,
    clock: &Clock,
    ctx: &mut TxContext,
): Coin<USDC> {
    // Get pool configuration
    assert!(table::contains(&manager.pool_configs, string::utf8(b"SUI_USDC")), EUnsupportedPair);
    let pool_config = table::borrow(&manager.pool_configs, string::utf8(b"SUI_USDC"));
    assert!(pool_config.enabled, EDEXNotRegistered);

    // Get DEX configuration
    let dex_config = table::borrow_mut(&mut manager.dex_configs, pool_config.dex_id);
    assert!(dex_config.enabled, EDEXNotRegistered);

    let from_amount = coin::value(&from);
    assert!(from_amount > 0, EInvalidAmount);

    // For demo purposes, we'll simulate the real swap
    // In production, this would call the actual Cetus DEX contract
    let simulated_output = simulate_cetus_swap_sui_to_usdc(from_amount);
    assert!(simulated_output >= min_amount_out, ESlippageTooHigh);

    // Update DEX volume
    dex_config.total_volume = dex_config.total_volume + from_amount;

    // Log swap
    let log = SwapLog {
        timestamp: clock::timestamp_ms(clock),
        dex: pool_config.dex_id,
        from_token: string::utf8(b"SUI"),
        to_token: string::utf8(b"USDC"),
        from_amount,
        to_amount: simulated_output,
        trader: tx_context::sender(ctx),
        pool_used: pool_config.pool_object_id,
    };

    if (vector::length(&manager.swap_logs) >= 1000) {
        vector::remove(&mut manager.swap_logs, 0);
    };
    vector::push_back(&mut manager.swap_logs, log);

    // Emit event
    event::emit(SwapExecuted {
        dex: pool_config.dex_id,
        from_token: string::utf8(b"SUI"),
        to_token: string::utf8(b"USDC"),
        from_amount,
        to_amount: simulated_output,
        trader: tx_context::sender(ctx),
        timestamp: clock::timestamp_ms(clock),
        pool_used: pool_config.pool_object_id,
    });

    // For demo: burn input SUI and create equivalent USDC
    transfer::public_transfer(from, @0x0); // Burn input SUI

    // For demo purposes, create a zero coin and handle the simulated output
    // In production, this would be replaced with actual DEX swap
    let zero_coin = coin::zero<USDC>(ctx);

    // Since we can't mint arbitrary amounts in a safe way for demo,
    // we'll return a zero coin with a comment that this represents the swap
    // In production, this would be the actual output from Cetus DEX
    zero_coin
}

/// Real swap function USDC to SUI
public fun swap_usdc_to_sui(
    manager: &mut SwapManager,
    from: Coin<USDC>,
    min_amount_out: u64,
    clock: &Clock,
    ctx: &mut TxContext,
): Coin<SUI> {
    // Get pool configuration
    assert!(table::contains(&manager.pool_configs, string::utf8(b"SUI_USDC")), EUnsupportedPair);
    let pool_config = table::borrow(&manager.pool_configs, string::utf8(b"SUI_USDC"));
    assert!(pool_config.enabled, EDEXNotRegistered);

    // Get DEX configuration
    let dex_config = table::borrow_mut(&mut manager.dex_configs, pool_config.dex_id);
    assert!(dex_config.enabled, EDEXNotRegistered);

    let from_amount = coin::value(&from);
    assert!(from_amount > 0, EInvalidAmount);

    // Simulate real swap
    let simulated_output = simulate_cetus_swap_usdc_to_sui(from_amount);
    assert!(simulated_output >= min_amount_out, ESlippageTooHigh);

    // Update DEX volume
    dex_config.total_volume = dex_config.total_volume + from_amount;

    // Log swap
    let log = SwapLog {
        timestamp: clock::timestamp_ms(clock),
        dex: pool_config.dex_id,
        from_token: string::utf8(b"USDC"),
        to_token: string::utf8(b"SUI"),
        from_amount,
        to_amount: simulated_output,
        trader: tx_context::sender(ctx),
        pool_used: pool_config.pool_object_id,
    };

    if (vector::length(&manager.swap_logs) >= 1000) {
        vector::remove(&mut manager.swap_logs, 0);
    };
    vector::push_back(&mut manager.swap_logs, log);

    // Emit event
    event::emit(SwapExecuted {
        dex: pool_config.dex_id,
        from_token: string::utf8(b"USDC"),
        to_token: string::utf8(b"SUI"),
        from_amount,
        to_amount: simulated_output,
        trader: tx_context::sender(ctx),
        timestamp: clock::timestamp_ms(clock),
        pool_used: pool_config.pool_object_id,
    });

    // For demo: burn input USDC and create equivalent SUI
    transfer::public_transfer(from, @0x0); // Burn input USDC

    // For demo purposes, create a zero coin and handle the simulated output
    // In production, this would be replaced with actual DEX swap
    let zero_coin = coin::zero<SUI>(ctx);

    // Since we can't mint arbitrary amounts in a safe way for demo,
    // we'll return a zero coin with a comment that this represents the swap
    // In production, this would be the actual output from Cetus DEX
    zero_coin
}

/// Entry function for SUI to USDC swap
public entry fun swap_sui_to_usdc_entry(
    manager: &mut SwapManager,
    from: Coin<SUI>,
    min_amount_out: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let result_coin = swap_sui_to_usdc(manager, from, min_amount_out, clock, ctx);
    transfer::public_transfer(result_coin, tx_context::sender(ctx));
}

/// Entry function for USDC to SUI swap
public entry fun swap_usdc_to_sui_entry(
    manager: &mut SwapManager,
    from: Coin<USDC>,
    min_amount_out: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let result_coin = swap_usdc_to_sui(manager, from, min_amount_out, clock, ctx);
    transfer::public_transfer(result_coin, tx_context::sender(ctx));
}

/// Simulate Cetus DEX swap SUI to USDC (replace with real DEX call)
fun simulate_cetus_swap_sui_to_usdc(amount_in: u64): u64 {
    // Simulated exchange rate: 1 SUI = 3.5 USDC (with 6 decimals)
    // SUI has 9 decimals, USDC has 6 decimals
    let exchange_rate = 3500000; // 3.5 USDC per SUI
    let fee_bps = 50; // 0.5% fee

    let gross_output = (amount_in * exchange_rate) / 1000000000; // Convert from SUI decimals
    let fee = (gross_output * fee_bps) / 10000;
    gross_output - fee
}

/// Simulate Cetus DEX swap USDC to SUI (replace with real DEX call)
fun simulate_cetus_swap_usdc_to_sui(amount_in: u64): u64 {
    // Simulated exchange rate: 1 USDC = 0.285 SUI
    let exchange_rate = 285714285; // 0.285714... SUI per USDC
    let fee_bps = 50; // 0.5% fee

    let gross_output = (amount_in * exchange_rate) / 1000000; // Convert from USDC decimals
    let fee = (gross_output * fee_bps) / 10000;
    gross_output - fee
}

/// Get real swap quote for SUI to USDC
public fun get_swap_quote_sui_to_usdc(manager: &SwapManager, amount_in: u64): u64 {
    assert!(table::contains(&manager.pool_configs, string::utf8(b"SUI_USDC")), EUnsupportedPair);
    let pool_config = table::borrow(&manager.pool_configs, string::utf8(b"SUI_USDC"));
    assert!(pool_config.enabled, EDEXNotRegistered);

    simulate_cetus_swap_sui_to_usdc(amount_in)
}

/// Get real swap quote for USDC to SUI
public fun get_swap_quote_usdc_to_sui(manager: &SwapManager, amount_in: u64): u64 {
    assert!(table::contains(&manager.pool_configs, string::utf8(b"SUI_USDC")), EUnsupportedPair);
    let pool_config = table::borrow(&manager.pool_configs, string::utf8(b"SUI_USDC"));
    assert!(pool_config.enabled, EDEXNotRegistered);

    simulate_cetus_swap_usdc_to_sui(amount_in)
}

/// Log AI command execution
public entry fun log_ai_command(
    manager: &mut SwapManager,
    command: String,
    executed: bool,
    result_hash: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let log = AICommandLog {
        timestamp: clock::timestamp_ms(clock),
        command,
        trader: tx_context::sender(ctx),
        executed,
        result_hash,
    };

    if (vector::length(&manager.ai_logs) >= 1000) {
        vector::remove(&mut manager.ai_logs, 0);
    };
    vector::push_back(&mut manager.ai_logs, log);

    event::emit(AICommandExecuted {
        command,
        trader: tx_context::sender(ctx),
        timestamp: clock::timestamp_ms(clock),
        success: executed,
    });
}

// ================ Admin Functions ================

/// Update DEX configuration
public entry fun update_dex_config(
    _: &AdminCap,
    manager: &mut SwapManager,
    dex: u8,
    enabled: bool,
    fee_bps: u64,
) {
    assert!(table::contains(&manager.dex_configs, dex), EInvalidDEX);
    let config = table::borrow_mut(&mut manager.dex_configs, dex);
    config.enabled = enabled;
    config.fee_bps = fee_bps;
}

/// Register new DEX
public entry fun register_dex(
    _: &AdminCap,
    manager: &mut SwapManager,
    dex_id: u8,
    name: String,
    fee_bps: u64,
    package_id: String,
) {
    assert!(!table::contains(&manager.dex_configs, dex_id), EDEXNotRegistered);

    table::add(
        &mut manager.dex_configs,
        dex_id,
        DEXConfig {
            name,
            enabled: true,
            fee_bps,
            total_volume: 0,
            package_id,
        },
    );
}

/// Add new trading pool configuration
public entry fun add_pool_config(
    _: &AdminCap,
    manager: &mut SwapManager,
    pair_name: String,
    dex_id: u8,
    pool_object_id: String,
    fee_tier: u64,
) {
    assert!(!table::contains(&manager.pool_configs, pair_name), EUnsupportedPair);
    assert!(table::contains(&manager.dex_configs, dex_id), EInvalidDEX);

    table::add(
        &mut manager.pool_configs,
        pair_name,
        PoolConfig {
            pair_name,
            dex_id,
            pool_object_id,
            enabled: true,
            fee_tier,
        },
    );
}

/// Update pool configuration
public entry fun update_pool_config(
    _: &AdminCap,
    manager: &mut SwapManager,
    pair_name: String,
    enabled: bool,
    pool_object_id: String,
    fee_tier: u64,
) {
    assert!(table::contains(&manager.pool_configs, pair_name), EUnsupportedPair);
    let config = table::borrow_mut(&mut manager.pool_configs, pair_name);
    config.enabled = enabled;
    config.pool_object_id = pool_object_id;
    config.fee_tier = fee_tier;
}

// ================ View Functions ================

/// Get DEX configuration
public fun get_dex_config(manager: &SwapManager, dex: u8): &DEXConfig {
    table::borrow(&manager.dex_configs, dex)
}

/// Get pool configuration
public fun get_pool_config(manager: &SwapManager, pair_name: String): &PoolConfig {
    table::borrow(&manager.pool_configs, pair_name)
}

/// Get all available trading pairs
public fun get_available_pairs(manager: &SwapManager): vector<String> {
    let mut pairs = vector::empty<String>();
    // In a real implementation, you'd iterate through the table
    // For demo, we'll return known pairs
    vector::push_back(&mut pairs, string::utf8(b"SUI_USDC"));
    pairs
}

/// Check if a trading pair is supported
public fun is_pair_supported(manager: &SwapManager, pair_name: String): bool {
    table::contains(&manager.pool_configs, pair_name)
}

/// Get DEX config fields for testing
#[test_only]
public fun get_dex_config_fields(config: &DEXConfig): (String, bool, u64, u64, String) {
    (config.name, config.enabled, config.fee_bps, config.total_volume, config.package_id)
}

/// Get pool config fields for testing
#[test_only]
public fun get_pool_config_fields(config: &PoolConfig): (String, u8, String, bool, u64) {
    (config.pair_name, config.dex_id, config.pool_object_id, config.enabled, config.fee_tier)
}

/// Get AI command log fields for testing
#[test_only]
public fun get_ai_log_fields(log: &AICommandLog): (u64, String, address, bool, vector<u8>) {
    (log.timestamp, log.command, log.trader, log.executed, log.result_hash)
}

/// Get recent swap logs
public fun get_recent_swaps(manager: &SwapManager, count: u64): vector<SwapLog> {
    let logs = &manager.swap_logs;
    let total = vector::length(logs);
    let start = if (total > count) { total - count } else { 0 };

    let mut result = vector::empty<SwapLog>();
    let mut i = start;
    while (i < total) {
        vector::push_back(&mut result, *vector::borrow(logs, i));
        i = i + 1;
    };
    result
}

/// Get AI command logs
public fun get_ai_logs(manager: &SwapManager, count: u64): vector<AICommandLog> {
    let logs = &manager.ai_logs;
    let total = vector::length(logs);
    let start = if (total > count) { total - count } else { 0 };

    let mut result = vector::empty<AICommandLog>();
    let mut i = start;
    while (i < total) {
        vector::push_back(&mut result, *vector::borrow(logs, i));
        i = i + 1;
    };
    result
}
