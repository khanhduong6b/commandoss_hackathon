#[test_only]
module swap_manager::swap_manager_tests;

use std::string;
use sui::clock::{Self, Clock};
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::test_scenario::{Self, Scenario};
use swap_manager::swap_manager::{Self, SwapManager, AdminCap};

// Test addresses
const ADMIN: address = @0xAD;
const USER: address = @0xCAFE;

// Helper function to create test scenario
fun create_test_scenario(): Scenario {
    test_scenario::begin(ADMIN)
}

#[test]
fun test_init_contract() {
    let mut scenario = create_test_scenario();

    // Initialize contract
    {
        swap_manager::test_init(test_scenario::ctx(&mut scenario));
    };

    // Check admin cap is created
    test_scenario::next_tx(&mut scenario, ADMIN);
    {
        assert!(test_scenario::has_most_recent_for_sender<AdminCap>(&scenario), 0);
        assert!(test_scenario::has_most_recent_shared<SwapManager>(), 1);
    };

    test_scenario::end(scenario);
}

#[test]
fun test_dex_configs() {
    let mut scenario = create_test_scenario();

    // Initialize contract
    {
        swap_manager::test_init(test_scenario::ctx(&mut scenario));
    };

    // Check DEX configs
    test_scenario::next_tx(&mut scenario, USER);
    {
        let manager = test_scenario::take_shared<SwapManager>(&scenario);

        // Test Turbos DEX config
        let turbos_config = swap_manager::get_dex_config(&manager, 1);
        let (_, enabled, fee_bps, _) = swap_manager::get_dex_config_fields(turbos_config);
        assert!(fee_bps == 30, 2);
        assert!(enabled == true, 3);

        // Test FlowX DEX config
        let flowx_config = swap_manager::get_dex_config(&manager, 2);
        let (_, enabled, fee_bps, _) = swap_manager::get_dex_config_fields(flowx_config);
        assert!(fee_bps == 25, 4);
        assert!(enabled == true, 5);

        // Test Aftermath DEX config
        let aftermath_config = swap_manager::get_dex_config(&manager, 3);
        let (_, enabled, fee_bps, _) = swap_manager::get_dex_config_fields(aftermath_config);
        assert!(fee_bps == 20, 6);
        assert!(enabled == true, 7);

        test_scenario::return_shared(manager);
    };

    test_scenario::end(scenario);
}

#[test]
fun test_swap_quote() {
    let mut scenario = create_test_scenario();

    // Initialize contract
    {
        swap_manager::test_init(test_scenario::ctx(&mut scenario));
    };

    // Test swap quotes
    test_scenario::next_tx(&mut scenario, USER);
    {
        let manager = test_scenario::take_shared<SwapManager>(&scenario);

        // Test Turbos quote (30 bps fee)
        let amount_in = 1000000; // 1 SUI
        let quote_turbos = swap_manager::get_swap_quote(&manager, 1, amount_in);
        let expected_turbos = amount_in - (amount_in * 30 / 10000);
        assert!(quote_turbos == expected_turbos, 8);

        // Test FlowX quote (25 bps fee)
        let quote_flowx = swap_manager::get_swap_quote(&manager, 2, amount_in);
        let expected_flowx = amount_in - (amount_in * 25 / 10000);
        assert!(quote_flowx == expected_flowx, 9);

        // Test Aftermath quote (20 bps fee)
        let quote_aftermath = swap_manager::get_swap_quote(&manager, 3, amount_in);
        let expected_aftermath = amount_in - (amount_in * 20 / 10000);
        assert!(quote_aftermath == expected_aftermath, 10);

        // Aftermath should give best rate (lowest fee)
        assert!(quote_aftermath > quote_flowx, 11);
        assert!(quote_flowx > quote_turbos, 12);

        test_scenario::return_shared(manager);
    };

    test_scenario::end(scenario);
}

#[test]
fun test_swap_sui() {
    let mut scenario = create_test_scenario();

    // Initialize contract
    {
        swap_manager::test_init(test_scenario::ctx(&mut scenario));
    };

    // Create clock for testing
    test_scenario::next_tx(&mut scenario, ADMIN);
    {
        let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::share_for_testing(clock);
    };

    // Test swap
    test_scenario::next_tx(&mut scenario, USER);
    {
        let mut manager = test_scenario::take_shared<SwapManager>(&scenario);
        let clock = test_scenario::take_shared<Clock>(&scenario);

        // Create test coin
        let amount = 1000000; // 1 SUI
        let test_coin = coin::mint_for_testing<SUI>(amount, test_scenario::ctx(&mut scenario));

        // Perform swap on Aftermath DEX (best rate)
        let result_coin = swap_manager::swap_sui(
            &mut manager,
            test_coin,
            3, // Aftermath DEX
            990000, // Min amount out (1% slippage)
            &clock,
            test_scenario::ctx(&mut scenario),
        );

        // Check result
        let expected_out = amount - (amount * 20 / 10000); // 20 bps fee
        assert!(coin::value(&result_coin) == expected_out, 13);

        // Clean up
        coin::burn_for_testing(result_coin);
        test_scenario::return_shared(manager);
        test_scenario::return_shared(clock);
    };

    test_scenario::end(scenario);
}

#[test]
fun test_ai_command_logging() {
    let mut scenario = create_test_scenario();

    // Initialize contract
    {
        swap_manager::test_init(test_scenario::ctx(&mut scenario));
    };

    // Create clock
    test_scenario::next_tx(&mut scenario, ADMIN);
    {
        let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::share_for_testing(clock);
    };

    // Test AI command logging
    test_scenario::next_tx(&mut scenario, USER);
    {
        let mut manager = test_scenario::take_shared<SwapManager>(&scenario);
        let clock = test_scenario::take_shared<Clock>(&scenario);

        // Log AI command
        swap_manager::log_ai_command(
            &mut manager,
            string::utf8(b"swap 100 SUI to USDC"),
            true,
            vector[1, 2, 3, 4],
            &clock,
            test_scenario::ctx(&mut scenario),
        );

        // Check logs
        let logs = swap_manager::get_ai_logs(&manager, 10);
        assert!(vector::length(&logs) == 1, 14);

        let log = vector::borrow(&logs, 0);
        let (_, _, trader, executed, _) = swap_manager::get_ai_log_fields(log);
        assert!(executed == true, 15);
        assert!(trader == USER, 16);

        test_scenario::return_shared(manager);
        test_scenario::return_shared(clock);
    };

    test_scenario::end(scenario);
}

#[test]
fun test_admin_functions() {
    let mut scenario = create_test_scenario();

    // Initialize contract
    {
        swap_manager::test_init(test_scenario::ctx(&mut scenario));
    };

    // Test admin functions
    test_scenario::next_tx(&mut scenario, ADMIN);
    {
        let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
        let mut manager = test_scenario::take_shared<SwapManager>(&scenario);

        // Update DEX config
        swap_manager::update_dex_config(
            &admin_cap,
            &mut manager,
            1, // Turbos
            false, // Disable
            50, // New fee
        );

        // Check updated config
        let config = swap_manager::get_dex_config(&manager, 1);
        let (_, enabled, fee_bps, _) = swap_manager::get_dex_config_fields(config);
        assert!(enabled == false, 17);
        assert!(fee_bps == 50, 18);

        // Register new DEX
        swap_manager::register_dex(
            &admin_cap,
            &mut manager,
            4, // New DEX ID
            string::utf8(b"TestDEX"),
            35, // Fee
        );

        // Check new DEX
        let new_config = swap_manager::get_dex_config(&manager, 4);
        let (_, enabled, fee_bps, _) = swap_manager::get_dex_config_fields(new_config);
        assert!(enabled == true, 19);
        assert!(fee_bps == 35, 20);

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_shared(manager);
    };

    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 1)]
fun test_invalid_dex_quote() {
    let mut scenario = create_test_scenario();

    {
        swap_manager::test_init(test_scenario::ctx(&mut scenario));
    };

    test_scenario::next_tx(&mut scenario, USER);
    {
        let manager = test_scenario::take_shared<SwapManager>(&scenario);

        // Try to get quote for non-existent DEX
        let _quote = swap_manager::get_swap_quote(&manager, 99, 1000000);

        test_scenario::return_shared(manager);
    };

    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 2)]
fun test_slippage_protection() {
    let mut scenario = create_test_scenario();

    {
        swap_manager::test_init(test_scenario::ctx(&mut scenario));
    };

    test_scenario::next_tx(&mut scenario, ADMIN);
    {
        let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::share_for_testing(clock);
    };

    test_scenario::next_tx(&mut scenario, USER);
    {
        let mut manager = test_scenario::take_shared<SwapManager>(&scenario);
        let clock = test_scenario::take_shared<Clock>(&scenario);

        let amount = 1000000;
        let test_coin = coin::mint_for_testing<SUI>(amount, test_scenario::ctx(&mut scenario));

        // Try swap with unrealistic min_amount_out
        let result = swap_manager::swap_sui(
            &mut manager,
            test_coin,
            1,
            amount, // Min amount = input amount (impossible due to fees)
            &clock,
            test_scenario::ctx(&mut scenario),
        );

        // This should fail, but if not, clean up
        coin::burn_for_testing(result);
        test_scenario::return_shared(manager);
        test_scenario::return_shared(clock);
    };

    test_scenario::end(scenario);
}
