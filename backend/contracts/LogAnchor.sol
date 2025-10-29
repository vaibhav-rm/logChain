// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// @title LogAnchor
/// @notice Minimal contract to anchor merkle roots for users/devices.
/// Emits event for off-chain indexing.
contract LogAnchor {
    struct Batch {
        bytes32 root;
        address owner;
        uint256 ts;
        string batchId; // optional user-supplied identifier
        string ipfsCid; // optional IPFS CID
    }

    // store by index for basic retrieval; indexing via events is recommended for production
    Batch[] public batches;

    event BatchAnchored(address indexed owner, bytes32 indexed root, string batchId, string ipfsCid, uint256 ts, uint256 index);

    /// @notice Anchor a merkle root with optional batch id and ipfs cid
    function anchor(bytes32 _root, string calldata _batchId, string calldata _ipfsCid) external {
        batches.push(Batch(_root, msg.sender, block.timestamp, _batchId, _ipfsCid));
        uint256 idx = batches.length - 1;
        emit BatchAnchored(msg.sender, _root, _batchId, _ipfsCid, block.timestamp, idx);
    }

    /// @notice Return latest batch for given index
    function getBatch(uint256 index) external view returns (bytes32 root, address owner, uint256 ts, string memory batchId, string memory ipfsCid) {
        require(index < batches.length, "out of range");
        Batch storage b = batches[index];
        return (b.root, b.owner, b.ts, b.batchId, b.ipfsCid);
    }

    /// @notice Returns number of anchored batches
    function totalBatches() external view returns (uint256) {
        return batches.length;
    }
}
