#!/bin/bash
# Docker helper for standalone hyperliquid-manager (docker-compose.yml service: hyperliquid-manager)

set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

COMPOSE_FILE="docker-compose.yml"
SERVICE_NAME="hyperliquid-manager"

require_tools() {
    if ! command -v docker >/dev/null 2>&1; then
        echo "Error: docker not found" >&2
        exit 1
    fi
    if ! docker compose version >/dev/null 2>&1; then
        echo "Error: 'docker compose' (v2 plugin) not available" >&2
        exit 1
    fi
}

show_help() {
    cat <<EOF
Usage: $0 <command> [service]

Commands:
  rebuild [service]   Rebuild image (--no-cache) and start container
  start [service]     Build and start (force recreate)
  stop [service]      Stop container
  status              docker compose ps
  logs [service]      Follow logs

Service (optional): $SERVICE_NAME (default)
EOF
}

resolve_service() {
    local s="${1:-$SERVICE_NAME}"
    if [[ "$s" != "$SERVICE_NAME" ]]; then
        echo "Error: unknown service '$s'. Only '$SERVICE_NAME' is supported." >&2
        exit 1
    fi
    echo "$s"
}

main() {
    local cmd="${1:-}"
    local svc_arg="${2:-}"

    case "$cmd" in
        rebuild)
            require_tools
            local svc
            svc="$(resolve_service "$svc_arg")"
            echo "Stopping $svc (if running)..."
            docker compose -f "$COMPOSE_FILE" stop "$svc" 2>/dev/null || true
            echo "Building $svc (--no-cache)..."
            docker compose -f "$COMPOSE_FILE" build --no-cache "$svc"
            echo "Starting $svc..."
            docker compose -f "$COMPOSE_FILE" rm -sf "$svc" 2>/dev/null || true
            docker compose -f "$COMPOSE_FILE" up -d --force-recreate "$svc"
            echo "Done."
            ;;
        start)
            require_tools
            local svc
            svc="$(resolve_service "$svc_arg")"
            docker compose -f "$COMPOSE_FILE" up -d --build --force-recreate "$svc"
            ;;
        stop)
            require_tools
            local svc
            svc="$(resolve_service "$svc_arg")"
            docker compose -f "$COMPOSE_FILE" stop "$svc"
            ;;
        status|ps)
            require_tools
            docker compose -f "$COMPOSE_FILE" ps
            ;;
        logs)
            require_tools
            local svc
            svc="$(resolve_service "$svc_arg")"
            docker compose -f "$COMPOSE_FILE" logs -f "$svc"
            ;;
        help|--help|-h|"")
            show_help
            ;;
        *)
            echo "Error: unknown command '$cmd'" >&2
            show_help
            exit 1
            ;;
    esac
}

main "$@"
