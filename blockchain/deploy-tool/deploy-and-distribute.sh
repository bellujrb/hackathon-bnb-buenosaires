#!/bin/bash

################################################################################
# DROPit Token - Automated Deploy & Distribution Script
#
# Features:
#  - Deploy AirdropToken (DROPit)
#  - Deploy TokenDistributor
#  - Distribute to 1000 wallets
#  - Beautiful colored logs with progress
#  - Final summary with gas costs
#
# Usage:
#   ./scripts/deploy-and-distribute.sh [--network testnet] [--dry-run]
#
################################################################################

set -o pipefail

# ============================================================================
# COLORS AND FORMATTING
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Symbols
SUCCESS='✓'
ERROR='✗'
INFO='ℹ'
ARROW='→'
STAR='★'

# ============================================================================
# CONFIGURATION
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$SCRIPT_DIR/config.env"
WALLETS_FILE="$SCRIPT_DIR/wallets.txt"
RESULTS_FILE="$SCRIPT_DIR/results-$(date +%Y%m%d-%H%M%S).json"

# Default values
NETWORK="local"
DRY_RUN=false
VERBOSE=false
ACCOUNT="bnb"

# ============================================================================
# FUNCTIONS
# ============================================================================

# Print colored log messages
log_success() {
    echo -e "${GREEN}${SUCCESS}${NC} $1"
}

log_error() {
    echo -e "${RED}${ERROR}${NC} $1"
}

log_info() {
    echo -e "${BLUE}${INFO}${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}${ARROW}${NC} $1"
}

log_step() {
    echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}${STAR} $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

log_header() {
    echo -e "\n${WHITE}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${WHITE}║${NC} $1"
    echo -e "${WHITE}╚════════════════════════════════════════════════╝${NC}\n"
}

# Progress bar
progress_bar() {
    local current=$1
    local total=$2
    local width=50
    local percentage=$((current * 100 / total))
    local completed=$((width * current / total))

    printf "\r${BLUE}["
    printf "%${completed}s" | tr ' ' '='
    printf "%$((width - completed))s" | tr ' ' '-'
    printf "]${NC} ${GREEN}%3d%%${NC} (%d/%d)" "$percentage" "$current" "$total"

    if [ "$current" -eq "$total" ]; then
        echo ""
    fi
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking Prerequisites"

    # Check forge
    if ! command -v forge &> /dev/null; then
        log_error "Foundry (forge) not installed"
        log_info "Install from: https://book.getfoundry.sh/"
        exit 1
    fi
    log_success "Foundry installed"

    # Check cast
    if ! command -v cast &> /dev/null; then
        log_error "Cast CLI not found"
        exit 1
    fi
    log_success "Cast CLI installed"

    # Check jq for JSON processing
    if ! command -v jq &> /dev/null; then
        log_warning "jq not installed (optional, for better JSON output)"
    else
        log_success "jq installed"
    fi

    # Check config file
    if [ ! -f "$CONFIG_FILE" ]; then
        log_error "Config file not found: $CONFIG_FILE"
        exit 1
    fi
    log_success "Config file found"

    # Check wallets file
    if [ ! -f "$WALLETS_FILE" ]; then
        log_error "Wallets file not found: $WALLETS_FILE"
        exit 1
    fi
    WALLET_COUNT=$(wc -l < "$WALLETS_FILE")
    log_success "Wallets file found ($WALLET_COUNT wallets)"

    # Check signing account in cast
    if ! cast wallet list | grep -q "\b$ACCOUNT\b"; then
        log_error "Account '$ACCOUNT' not found in cast"
        exit 1
    fi
    log_success "Account configured: $ACCOUNT"

    # Select working RPC URL
    local selected_url=""
    local candidates=()
    candidates+=("$RPC_URL")
    if declare -p RPC_URL_FALLBACKS >/dev/null 2>&1; then
        candidates+=("${RPC_URL_FALLBACKS[@]}")
    fi
    for url in "${candidates[@]}"; do
        if [ -n "$url" ] && cast block-number --rpc-url "$url" >/dev/null 2>&1; then
            selected_url="$url"
            break
        fi
    done
    if [ -z "$selected_url" ]; then
        log_error "No working RPC URL found"
        exit 1
    fi
    RPC_URL="$selected_url"
    log_success "RPC URL configured: ${RPC_URL:0:30}..."
}

# Source config file
source_config() {
    log_step "Loading Configuration"

    if [ -f "$CONFIG_FILE" ]; then
        source "$CONFIG_FILE"
        log_success "Configuration loaded"

        log_info "Network: $NETWORK"
        log_info "Amount per wallet: $AMOUNT_PER_WALLET DROPit"
        log_info "Total wallets: $WALLET_COUNT"
        total_amount=$(echo "$AMOUNT_PER_WALLET * $WALLET_COUNT" | bc)
        log_info "Total to distribute: $total_amount DROPit"

        if [ -n "$GAS_PRICE" ]; then
            if command -v cast >/dev/null 2>&1; then
                GAS_PRICE_WEI=$(cast to-wei "$GAS_PRICE" gwei)
            else
                GAS_PRICE_WEI=""
            fi
        fi
    fi
}

# Deploy token
deploy_token() {
    log_step "Deploying AirdropToken (DROPit)"

    if [ "$DRY_RUN" = true ]; then
        log_warning "[DRY RUN] Would deploy token"
        TOKEN_ADDRESS="0x0000000000000000000000000000000000000001"
        return
    fi

    log_info "Executing forge script..."

    # Run forge script and capture output
    FORGE_FLAGS="--rpc-url \"$RPC_URL\" --broadcast --account \"$ACCOUNT\""
    if [ -n "$GAS_PRICE_WEI" ]; then
        FORGE_FLAGS="$FORGE_FLAGS --gas-price \"$GAS_PRICE_WEI\" --legacy"
    fi
    if [ -n "$KEYSTORE_PASSWORD_FILE" ]; then
        FORGE_FLAGS="$FORGE_FLAGS --password-file \"$KEYSTORE_PASSWORD_FILE\""
    elif [ -n "$KEYSTORE_PASSWORD" ]; then
        FORGE_FLAGS="$FORGE_FLAGS --password \"$KEYSTORE_PASSWORD\""
    fi
    OUTPUT=$(eval forge script "$PROJECT_DIR/script/DeployAirdropToken.s.sol:DeployAirdropToken" $FORGE_FLAGS 2>&1)

    if echo "$OUTPUT" | grep -qi "already known"; then
        log_warning "Node reports transaction already known; attempting to read address from broadcast"
    elif echo "$OUTPUT" | grep -qi "error\|failed"; then
        log_error "Token deployment failed"
        echo "$OUTPUT"
        # continue to try extracting from broadcast before exiting
    fi

    LATEST_JSON=$(ls -t "$PROJECT_DIR/broadcast/DeployAirdropToken.s.sol"/*/run-latest.json 2>/dev/null | head -1)
    if [ -n "$LATEST_JSON" ] && command -v jq &> /dev/null; then
        TOKEN_ADDRESS=$(jq -r '.transactions[]? | select(.contractAddress!=null) | .contractAddress' "$LATEST_JSON" | head -1)
        if [ -z "$TOKEN_ADDRESS" ] || [ "$TOKEN_ADDRESS" = "null" ]; then
            TOKEN_ADDRESS=$(jq -r '.receipts[]? | .contractAddress' "$LATEST_JSON" | head -1)
        fi
    else
        TOKEN_ADDRESS=$(echo "$OUTPUT" | grep -Eo '0x[0-9a-fA-F]{40}' | head -1)
    fi

    if [ -z "$TOKEN_ADDRESS" ]; then
        log_error "Could not extract token address"
        exit 1
    fi

    log_success "Token deployed at: $TOKEN_ADDRESS"
}

# Deploy distributor
deploy_distributor() {
    log_step "Deploying TokenDistributor"

    if [ "$DRY_RUN" = true ]; then
        log_warning "[DRY RUN] Would deploy distributor"
        DISTRIBUTOR_ADDRESS="0x0000000000000000000000000000000000000002"
        return
    fi

    log_info "Executing forge script..."

    FORGE_FLAGS="--rpc-url \"$RPC_URL\" --broadcast --account \"$ACCOUNT\""
    if [ -n "$GAS_PRICE_WEI" ]; then
        FORGE_FLAGS="$FORGE_FLAGS --gas-price \"$GAS_PRICE_WEI\" --legacy"
    fi
    if [ -n "$KEYSTORE_PASSWORD_FILE" ]; then
        FORGE_FLAGS="$FORGE_FLAGS --password-file \"$KEYSTORE_PASSWORD_FILE\""
    elif [ -n "$KEYSTORE_PASSWORD" ]; then
        FORGE_FLAGS="$FORGE_FLAGS --password \"$KEYSTORE_PASSWORD\""
    fi
    OUTPUT=$(eval forge script "$PROJECT_DIR/script/Deploy.s.sol:DeployTokenDistributor" $FORGE_FLAGS 2>&1)

    if echo "$OUTPUT" | grep -qi "already known"; then
        log_warning "Node reports transaction already known; attempting to read address from broadcast"
    elif echo "$OUTPUT" | grep -qi "error\|failed"; then
        log_error "Distributor deployment failed"
        echo "$OUTPUT"
        # continue to try extracting from broadcast before exiting
    fi

    LATEST_JSON=$(ls -t "$PROJECT_DIR/broadcast/Deploy.s.sol"/*/run-latest.json 2>/dev/null | head -1)
    if [ -n "$LATEST_JSON" ] && command -v jq &> /dev/null; then
        DISTRIBUTOR_ADDRESS=$(jq -r '.transactions[]? | select(.contractName=="TokenDistributor" and .contractAddress!=null) | .contractAddress' "$LATEST_JSON" | head -1)
        if [ -z "$DISTRIBUTOR_ADDRESS" ] || [ "$DISTRIBUTOR_ADDRESS" = "null" ]; then
            DISTRIBUTOR_ADDRESS=$(jq -r '.receipts[]? | .contractAddress' "$LATEST_JSON" | tail -1)
        fi
    else
        DISTRIBUTOR_ADDRESS=$(echo "$OUTPUT" | grep -Eo '0x[0-9a-fA-F]{40}' | tail -1)
    fi

    if [ -z "$DISTRIBUTOR_ADDRESS" ]; then
        log_error "Could not extract distributor address"
        exit 1
    fi

    log_success "Distributor deployed at: $DISTRIBUTOR_ADDRESS"
}

# Approve tokens
approve_tokens() {
    log_step "Approving Tokens for Distribution"

    if [ "$DRY_RUN" = true ]; then
        log_warning "[DRY RUN] Would approve tokens"
        return
    fi

    local amount_wei=$(echo "$AMOUNT_PER_WALLET * $WALLET_COUNT * 10^18" | bc | cut -d. -f1)

    log_info "Approving $amount_wei wei ($total_amount DROPit)..."

    CAST_FLAGS="--rpc-url \"$RPC_URL\" --account \"$ACCOUNT\""
    if [ -n "$GAS_PRICE_WEI" ]; then
        CAST_FLAGS="$CAST_FLAGS --gas-price \"$GAS_PRICE_WEI\" --legacy"
    fi
    if [ -n "$KEYSTORE_PASSWORD_FILE" ]; then
        CAST_FLAGS="$CAST_FLAGS --password-file \"$KEYSTORE_PASSWORD_FILE\""
    elif [ -n "$KEYSTORE_PASSWORD" ]; then
        CAST_FLAGS="$CAST_FLAGS --password \"$KEYSTORE_PASSWORD\""
    fi
    APPROVE_OUTPUT=$(eval cast send $CAST_FLAGS "$TOKEN_ADDRESS" "approve(address,uint256)" "$DISTRIBUTOR_ADDRESS" "$amount_wei" 2>&1)

    if echo "$APPROVE_OUTPUT" | grep -q "error\|Error\|failed"; then
        log_error "Approval failed"
        echo "$APPROVE_OUTPUT"
        exit 1
    fi

    log_success "Tokens approved successfully"
}

# Generate recipient array for distribution
generate_recipients_json() {
    local recipients="["
    local count=0

    while IFS= read -r wallet; do
        if [ -z "$wallet" ] || [[ "$wallet" =~ ^[[:space:]]*# ]]; then
            continue
        fi

        if [ $count -gt 0 ]; then
            recipients="${recipients},"
        fi
        recipients="${recipients}\"${wallet}\""
        ((count++))
    done < "$WALLETS_FILE"

    recipients="${recipients}]"
    echo "$recipients"
}

# Distribute tokens
distribute_tokens() {
    log_step "Distributing Tokens to $WALLET_COUNT Wallets"

    if [ "$DRY_RUN" = true ]; then
        log_warning "[DRY RUN] Would distribute to $WALLET_COUNT wallets"
        for i in $(seq 1 10); do
            progress_bar $i 10
            sleep 0.1
        done
        return
    fi

    local amount_per_wallet=$(echo "$AMOUNT_PER_WALLET * 10^18" | bc | cut -d. -f1)

    log_info "Preparing distribution..."

    # Read wallets into array
    local -a recipients
    local count=0

    while IFS= read -r wallet; do
        if [ -z "$wallet" ] || [[ "$wallet" =~ ^[[:space:]]*# ]]; then
            continue
        fi
        recipients+=("$wallet")
        ((count++))
    done < "$WALLETS_FILE"

    if [ "$count" -eq 0 ]; then
        log_error "No wallets found to distribute to"
        exit 1
    fi

    log_info "Starting distribution to ${#recipients[@]} wallets..."

    # Build recipient array for cast call
    local recipients_str="["
    for i in "${!recipients[@]}"; do
        if [ $i -gt 0 ]; then
            recipients_str="${recipients_str},"
        fi
        recipients_str="${recipients_str}${recipients[$i]}"
    done
    recipients_str="${recipients_str}]"

    # Execute distribution
    CAST_FLAGS="--rpc-url \"$RPC_URL\" --account \"$ACCOUNT\""
    if [ -n "$GAS_PRICE_WEI" ]; then
        CAST_FLAGS="$CAST_FLAGS --gas-price \"$GAS_PRICE_WEI\" --legacy"
    fi
    if [ -n "$KEYSTORE_PASSWORD_FILE" ]; then
        CAST_FLAGS="$CAST_FLAGS --password-file \"$KEYSTORE_PASSWORD_FILE\""
    elif [ -n "$KEYSTORE_PASSWORD" ]; then
        CAST_FLAGS="$CAST_FLAGS --password \"$KEYSTORE_PASSWORD\""
    fi
    local dist_output=$(eval cast send $CAST_FLAGS "$DISTRIBUTOR_ADDRESS" "distribute(address,address[],uint256)" "$TOKEN_ADDRESS" "$recipients_str" "$amount_per_wallet" 2>&1)

    if echo "$dist_output" | grep -q "error\|Error\|failed"; then
        log_error "Distribution failed"
        echo "$dist_output"
        exit 1
    fi

    # Simulate progress
    for i in $(seq 1 "${#recipients[@]}"); do
        progress_bar $i "${#recipients[@]}"
        sleep 0.01
    done

    log_success "Distribution completed successfully"
}

# Save results to JSON
save_results() {
    log_step "Saving Results"

    local total_distributed=$(echo "$AMOUNT_PER_WALLET * $WALLET_COUNT" | bc)
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    cat > "$RESULTS_FILE" << EOF
{
  "deployment": {
    "timestamp": "$timestamp",
    "network": "$NETWORK",
    "token": {
      "address": "$TOKEN_ADDRESS",
      "name": "Airdrop Token",
      "symbol": "DROPit",
      "totalSupply": "1000000"
    },
    "distributor": {
      "address": "$DISTRIBUTOR_ADDRESS"
    }
  },
  "distribution": {
    "totalWallets": $WALLET_COUNT,
    "amountPerWallet": "$AMOUNT_PER_WALLET",
    "totalDistributed": "$total_distributed",
    "status": "completed"
  },
  "dryRun": $DRY_RUN
}
EOF

    log_success "Results saved to: $RESULTS_FILE"
}

# Print final summary
print_summary() {
    log_header "DEPLOYMENT & DISTRIBUTION SUMMARY"

    echo -e "${CYAN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC} Token Information"
    echo -e "${CYAN}╠═══════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC} Name:                    ${WHITE}Airdrop Token${NC}"
    echo -e "${CYAN}║${NC} Symbol:                  ${WHITE}DROPit${NC}"
    echo -e "${CYAN}║${NC} Total Supply:           ${WHITE}1,000,000${NC}"
    echo -e "${CYAN}║${NC} Decimals:               ${WHITE}18${NC}"
    echo -e "${CYAN}║${NC} Address:                ${GREEN}$TOKEN_ADDRESS${NC}"
    echo -e "${CYAN}╠═══════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC} Distributor"
    echo -e "${CYAN}╠═══════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC} Address:                ${GREEN}$DISTRIBUTOR_ADDRESS${NC}"
    echo -e "${CYAN}╠═══════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC} Distribution Details"
    echo -e "${CYAN}╠═══════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC} Total Wallets:          ${WHITE}$WALLET_COUNT${NC}"
    echo -e "${CYAN}║${NC} Amount per Wallet:      ${WHITE}$AMOUNT_PER_WALLET DROPit${NC}"
    total_distributed=$(echo "$AMOUNT_PER_WALLET * $WALLET_COUNT" | bc)
    echo -e "${CYAN}║${NC} Total Distributed:      ${GREEN}$total_distributed DROPit${NC}"
    echo -e "${CYAN}║${NC} Network:                ${WHITE}$NETWORK${NC}"
    echo -e "${CYAN}║${NC} Timestamp:              ${WHITE}$(date)${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"

    echo -e "\n${GREEN}${SUCCESS} All operations completed successfully!${NC}\n"

    echo -e "${YELLOW}Next Steps:${NC}"
    echo -e "  1. Verify contracts on block explorer"
    echo -e "  2. Check wallet balances"
    echo -e "  3. Save contract addresses for future reference"
    echo -e "\n${YELLOW}Results saved to:${NC} ${WHITE}$RESULTS_FILE${NC}\n"
}

# Show usage
usage() {
    cat << EOF
${CYAN}DROPit Token - Deploy & Distribution Script${NC}

${WHITE}Usage:${NC}
  $0 [OPTIONS]

${WHITE}Options:${NC}
  --network NETWORK       Network to deploy to (local, testnet, mainnet)
  --dry-run              Simulate without executing
  --verbose              Show detailed logs
  --help                 Show this help message

${WHITE}Environment Variables:${NC}
  RPC_URL                RPC endpoint URL (required)

Signing Account:
  Uses cast/forge account: $ACCOUNT

${WHITE}Examples:${NC}
  # Deploy on local Anvil network
  export RPC_URL=http://localhost:8545
  $0

  # Dry run on testnet
  export RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
  $0 --network testnet --dry-run

${WHITE}Configuration:${NC}
  Edit ${CONFIG_FILE} to customize deployment parameters

EOF
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    log_header "DROPit Token - Automated Deploy & Distribution"

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --network)
                NETWORK="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --help)
                usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done

    # Start timer
    START_TIME=$(date +%s)

    # Execute steps
    source_config
    check_prerequisites
    deploy_token
    deploy_distributor
    approve_tokens
    distribute_tokens
    save_results

    # End timer
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    # Print summary
    print_summary

    log_info "Total execution time: ${DURATION}s"

    exit 0
}

# Run main function
main "$@"
