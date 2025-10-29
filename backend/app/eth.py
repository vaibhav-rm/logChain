# backend/app/eth.py
import json
import os
from solcx import install_solc, compile_standard
from web3 import Web3
from web3.middleware.proof_of_authority import ExtraDataToPOAMiddleware
from dotenv import load_dotenv

load_dotenv()

# === Environment Setup ===
WEB3_PROVIDER = os.getenv("WEB3_PROVIDER_URL")
PRIVATE_KEY = os.getenv("DEPLOYER_PRIVATE_KEY")
PUBLIC_ADDRESS = os.getenv("DEPLOYER_ADDRESS")
CHAIN_ID = int(os.getenv("CHAIN_ID", "11155111"))  # Sepolia default
CONTRACT_ADDRESS_FILE = os.getenv("CONTRACT_ADDRESS_FILE", "./deployed_contract_addr.txt")

# === Web3 Setup ===
w3 = Web3(Web3.HTTPProvider(WEB3_PROVIDER))
if not w3.is_connected():
    raise ConnectionError("⚠️  Web3 provider not connected. Check your WEB3_PROVIDER_URL.")

# Inject PoA middleware for Sepolia
w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)

# === Solidity Compiler Setup ===
SOLC_VERSION = "0.8.17"


def compile_contract(solidity_file_path: str):
    """Compile Solidity contract and return (ABI, Bytecode)"""
    install_solc(SOLC_VERSION)

    with open(solidity_file_path, "r") as f:
        source = f.read()

    compiled = compile_standard(
        {
            "language": "Solidity",
            "sources": {"LogAnchor.sol": {"content": source}},
            "settings": {
                "outputSelection": {
                    "*": {"*": ["abi", "metadata", "evm.bytecode", "evm.bytecode.object"]}
                }
            },
        },
        solc_version=SOLC_VERSION,
    )

    contract_key = list(compiled["contracts"]["LogAnchor.sol"].keys())[0]
    abi = compiled["contracts"]["LogAnchor.sol"][contract_key]["abi"]
    bytecode = compiled["contracts"]["LogAnchor.sol"][contract_key]["evm"]["bytecode"]["object"]

    return abi, bytecode


def deploy_contract(abi, bytecode):
    """Deploy smart contract and save its address to file"""
    acct = w3.eth.account.from_key(PRIVATE_KEY)
    contract = w3.eth.contract(abi=abi, bytecode=bytecode)
    nonce = w3.eth.get_transaction_count(acct.address)

    txn = contract.constructor().build_transaction(
        {
            "from": acct.address,
            "nonce": nonce,
            "chainId": CHAIN_ID,
            # Let provider handle EIP-1559 base and priority fees
        }
    )

    signed = acct.sign_transaction(txn)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)  # ✅ fixed
    print("📤 Deploy tx hash:", tx_hash.hex())

    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=600)
    print("✅ Deployed at:", receipt.contractAddress)

    with open(CONTRACT_ADDRESS_FILE, "w") as f:
        f.write(receipt.contractAddress)

    return receipt.contractAddress, abi


def load_contract_instance(abi, contract_address):
    """Load an existing deployed contract instance"""
    return w3.eth.contract(
        address=Web3.to_checksum_address(contract_address),
        abi=abi,
    )


def anchor_root(contract, root_hex: str, batch_id: str = "", ipfs_cid: str = ""):
    """
    Anchor Merkle root on-chain.
    Calls: anchor(bytes32 root, string batchId, string ipfsCid)
    """
    acct = w3.eth.account.from_key(PRIVATE_KEY)
    nonce = w3.eth.get_transaction_count(acct.address)

    tx = contract.functions.anchor(root_hex, batch_id, ipfs_cid).build_transaction(
        {
            "from": acct.address,
            "nonce": nonce,
            "chainId": CHAIN_ID,
        }
    )

    signed = acct.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)  # ✅ fixed
    print(f"📤 Anchoring TX: {tx_hash.hex()}")

    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=600)
    print(f"✅ Anchored in block {receipt.blockNumber}")

    return tx_hash.hex(), receipt
