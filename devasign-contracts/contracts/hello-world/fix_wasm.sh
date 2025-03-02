#!/bin/bash

WASM_FILE=/home/bishopbethel/devasign-build-v0/devasign-contracts/target/wasm32-unknown-unknown/release/devasign_contract.wasm
TEMP_FILE=/tmp/fixed_wasm.wasm

# Create a copy of the WASM file
cp $WASM_FILE $TEMP_FILE

# Use wasm-tools to add reference types
cargo install wasm-tools
wasm-tools component new $TEMP_FILE -o $WASM_FILE