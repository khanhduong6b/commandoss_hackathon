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

// ================ Constants ================
const TURBOS_DEX: u8 = 1;
const FLOWX_DEX: u8 = 2;
const AFTERMATH_DEX: u8 = 3;

// ================ Errors ================
const EInvalidDEX: u64 = 1;
const ESlippageTooHigh: u64 = 2;
const EInvalidAmount: u64 = 3;
const EDEXNotRegistered: u64 = 4;

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
}

/// DEX configuration
public struct DEXConfig has store {
    name: String,
    enabled: bool,
    fee_bps: u64, // Fee in basis points
    total_volume: u64,
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
    };

    // Register default DEXs
    table::add(
        &mut manager.dex_configs,
        TURBOS_DEX,
        DEXConfig {
            name: string::utf8(b"Turbos"),
            enabled: true,
            fee_bps: 30, // 0.3%
            total_volume: 0,
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

/// Simplified swap function for SUI tokens (demo purposes)
public fun swap_sui(
    manager: &mut SwapManager,
    mut from: Coin<SUI>,
    dex: u8,
    min_amount_out: u64,
    clock: &Clock,
    ctx: &mut TxContext,
): Coin<SUI> {
    // Validate DEX
    assert!(table::contains(&manager.dex_configs, dex), EInvalidDEX);
    let dex_config = table::borrow_mut(&mut manager.dex_configs, dex);
    assert!(dex_config.enabled, EDEXNotRegistered);

    let from_amount = coin::value(&from);
    assert!(from_amount > 0, EInvalidAmount);

    // Calculate output amount (simplified for demo)
    let fee_amount = (from_amount * dex_config.fee_bps) / 10000;
    let amount_out = from_amount - fee_amount; // Simplified 1:1 rate minus fees

    assert!(amount_out >= min_amount_out, ESlippageTooHigh);

    // Update DEX volume
    dex_config.total_volume = dex_config.total_volume + from_amount;

    // Log swap
    let log = SwapLog {
        timestamp: clock::timestamp_ms(clock),
        dex,
        from_token: string::utf8(b"SUI"),
        to_token: string::utf8(b"SUI"),
        from_amount,
        to_amount: amount_out,
        trader: tx_context::sender(ctx),
    };

    if (vector::length(&manager.swap_logs) >= 1000) {
        vector::remove(&mut manager.swap_logs, 0);
    };
    vector::push_back(&mut manager.swap_logs, log);

    // Emit event
    event::emit(SwapExecuted {
        dex,
        from_token: string::utf8(b"SUI"),
        to_token: string::utf8(b"SUI"),
        from_amount,
        to_amount: amount_out,
        trader: tx_context::sender(ctx),
        timestamp: clock::timestamp_ms(clock),
    });

    // For demo: Take fee and return reduced amount
    let fee_coin = coin::split(&mut from, fee_amount, ctx);
    // In production, fee would go to protocol/liquidity providers
    transfer::public_transfer(fee_coin, @0x0); // Burn fee for demo

    // Return the remaining coin as swap result
    from
}

/// Get swap quote (view function)
public fun get_swap_quote(manager: &SwapManager, dex: u8, amount_in: u64): u64 {
    assert!(table::contains(&manager.dex_configs, dex), EInvalidDEX);
    let dex_config = table::borrow(&manager.dex_configs, dex);
    assert!(dex_config.enabled, EDEXNotRegistered);

    // Calculate output amount (simplified)
    let fee_amount = (amount_in * dex_config.fee_bps) / 10000;
    amount_in - fee_amount
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
        },
    );
}

// ================ View Functions ================

/// Get DEX configuration
public fun get_dex_config(manager: &SwapManager, dex: u8): &DEXConfig {
    table::borrow(&manager.dex_configs, dex)
}

/// Get DEX config fields for testing
#[test_only]
public fun get_dex_config_fields(config: &DEXConfig): (String, bool, u64, u64) {
    (config.name, config.enabled, config.fee_bps, config.total_volume)
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
