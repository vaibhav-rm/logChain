# backend/deploy_and_run.py
import os
from app.eth import compile_contract, deploy_contract, load_contract_instance, w3
from dotenv import load_dotenv

load_dotenv()
CONTRACT_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "contracts", "LogAnchor.sol"))
print("Compiling and deploying contract...")
abi, bytecode = compile_contract(CONTRACT_PATH)
addr, _abi = deploy_contract(abi, bytecode)  # returns address
print("Contract deployed at:", addr)
print("Contract ABI saved in memory.")
