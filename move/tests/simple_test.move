#[test_only]
module swap_manager::simple_test;

#[test]
fun test_basic_logic() {
    let a = 10;
    let b = 20;
    assert!(a + b == 30, 0);
}

#[test]
#[expected_failure(abort_code = 1)]
fun test_expected_failure() {
    abort 1
}

#[test]
fun test_vector_operations() {
    let mut v = vector::empty<u64>();
    vector::push_back(&mut v, 100);
    vector::push_back(&mut v, 200);

    assert!(vector::length(&v) == 2, 0);
    assert!(vector::pop_back(&mut v) == 200, 1);
    assert!(vector::length(&v) == 1, 2);
}
