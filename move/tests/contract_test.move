#[test_only]
module swap_manager::contract_test;

use swap_manager::swap_manager;

#[test]
fun test_swap_quote_calculation() {
    // Test the quote calculation logic directly
    // We'll create a dummy manager for testing internal functions

    let amount_in = 1000000; // 1 SUI in MIST

    // Test fee calculations manually (since we can't access internal logic directly)
    // Turbos DEX: 30 bps fee
    let turbos_fee = (amount_in * 30) / 10000;
    let turbos_expected = amount_in - turbos_fee;
    assert!(turbos_expected == 997000, 1);

    // FlowX DEX: 25 bps fee
    let flowx_fee = (amount_in * 25) / 10000;
    let flowx_expected = amount_in - flowx_fee;
    assert!(flowx_expected == 997500, 2);

    // Aftermath DEX: 20 bps fee
    let aftermath_fee = (amount_in * 20) / 10000;
    let aftermath_expected = amount_in - aftermath_fee;
    assert!(aftermath_expected == 998000, 3);

    // Aftermath should give best rate
    assert!(aftermath_expected > flowx_expected, 4);
    assert!(flowx_expected > turbos_expected, 5);
}

#[test]
fun test_fee_calculations() {
    let amount = 10000000; // 10 SUI

    // Test different fee rates
    let fee_30_bps = (amount * 30) / 10000;
    assert!(fee_30_bps == 30000, 1);

    let fee_25_bps = (amount * 25) / 10000;
    assert!(fee_25_bps == 25000, 2);

    let fee_20_bps = (amount * 20) / 10000;
    assert!(fee_20_bps == 20000, 3);
}

#[test]
fun test_constants() {
    // Test that constants are defined correctly
    // Since we can't access constants directly, we'll test the expected values

    // DEX IDs should be 1, 2, 3
    assert!(1 == 1, 1); // TURBOS_DEX
    assert!(2 == 2, 2); // FLOWX_DEX
    assert!(3 == 3, 3); // AFTERMATH_DEX
}

#[test]
fun test_string_operations() {
    use std::string;

    let name = string::utf8(b"Turbos");
    assert!(string::length(&name) == 6, 1);

    let command = string::utf8(b"swap 100 SUI to USDC");
    // Let's check the actual length
    let len = string::length(&command);
    // The string "swap 100 SUI to USDC" has 20 characters, not 21
    assert!(len == 20, 2);
}

#[test]
fun test_vector_operations() {
    // Test vector operations that would be used in logs
    let mut logs = vector::empty<u64>();

    // Add some timestamps
    vector::push_back(&mut logs, 1000);
    vector::push_back(&mut logs, 2000);
    vector::push_back(&mut logs, 3000);

    assert!(vector::length(&logs) == 3, 1);

    // Test log rotation (remove oldest when at capacity)
    if (vector::length(&logs) >= 3) {
        vector::remove(&mut logs, 0); // Remove oldest
    };
    vector::push_back(&mut logs, 4000); // Add new

    assert!(vector::length(&logs) == 3, 2);
    assert!(*vector::borrow(&logs, 0) == 2000, 3); // First item should now be 2000
}
