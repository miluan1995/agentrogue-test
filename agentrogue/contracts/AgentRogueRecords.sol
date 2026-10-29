// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.26;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

interface IAgentRegistry {
    function balanceOf(address owner) external view returns (uint256);
}

/// @title AgentRogue run records (test, upgradeable UUPS)
/// @notice Only Binance Agentic Wallets holding an Agent ID can submit runs.
///         Holds no funds and asks for no token approvals. Scores are self-reported (test only).
///         Owner can upgrade, pause, and remove a player's record.
contract AgentRogueRecords is Initializable, UUPSUpgradeable, Ownable2StepUpgradeable, PausableUpgradeable {
    IAgentRegistry public constant REGISTRY = IAgentRegistry(0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F);

    struct Best {
        uint32 wave;
        uint8 mode;
        bool victory;
        uint64 time;
        bytes32 runHash;
    }

    mapping(address => Best) public best;
    mapping(address => uint32) public runsOf;
    address[] public players;
    uint256 public totalRuns;
    uint256[45] private __gap;

    event RunSubmitted(address indexed player, uint32 wave, uint8 mode, bool victory, bytes32 seed, bytes32 runHash);
    event RecordRemoved(address indexed player);

    error NotAgent();
    error BadWave();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address owner_) external initializer {
        __Ownable_init(owner_);
        __Ownable2Step_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
    }

    function version() external pure returns (string memory) {
        return "1.0.0";
    }

    function submitRun(uint32 wave, uint8 mode, bool victory, bytes32 seed, bytes32 runHash) external whenNotPaused {
        if (REGISTRY.balanceOf(msg.sender) == 0) revert NotAgent();
        if (wave == 0 || wave > 100000) revert BadWave();
        unchecked { totalRuns++; }
        if (runsOf[msg.sender] == 0) players.push(msg.sender);
        unchecked { runsOf[msg.sender]++; }
        Best storage b = best[msg.sender];
        if (wave > b.wave || (wave == b.wave && victory && !b.victory)) {
            b.wave = wave;
            b.mode = mode;
            b.victory = victory;
            b.time = uint64(block.timestamp);
            b.runHash = runHash;
        }
        emit RunSubmitted(msg.sender, wave, mode, victory, seed, runHash);
    }

    // ---- owner operations ----
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    /// @notice Clear a player's best record (e.g. cheating). Keeps them in the players list.
    function removeRecord(address player) external onlyOwner {
        delete best[player];
        emit RecordRemoved(player);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    // ---- views ----
    function playerCount() external view returns (uint256) {
        return players.length;
    }

    function page(uint256 start, uint256 n)
        external
        view
        returns (address[] memory addrs, Best[] memory bests, uint32[] memory runs)
    {
        uint256 len = players.length;
        if (start > len) start = len;
        uint256 end = start + n > len ? len : start + n;
        addrs = new address[](end - start);
        bests = new Best[](end - start);
        runs = new uint32[](end - start);
        for (uint256 i = start; i < end; i++) {
            address p = players[i];
            addrs[i - start] = p;
            bests[i - start] = best[p];
            runs[i - start] = runsOf[p];
        }
    }
}
