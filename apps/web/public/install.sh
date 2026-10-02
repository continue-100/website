#!/bin/sh
# Prismio installer script
# Run via: curl -fsSL https://prismio.org/install.sh | sh
#
# Installs a release archive (prismio-<version>-<os>-<arch>.tar.gz) built by
# tools/release.py, after checking its SHA-256 against the .sha256 published beside it.
#
# Environment variables:
#   PRISMIO_INSTALL        Installation directory (default: $HOME/.prismio)
#   PRISMIO_VERSION        Version to install (default: latest, e.g. 0.1.0 or v0.1.0)
#   PRISMIO_TARBALL        Path to a local archive (offline or custom builds); a
#                          .sha256 beside it is checked when there is one
#   PRISMIO_DOWNLOAD_URL   URL of an archive to download instead of the release
#   PRISMIO_NO_MODIFY_PATH Set to 1 to leave shell profiles alone

set -eu

# Setup formatting & truecolor detection
if [ -t 1 ]; then
    BOLD="\033[1m"
    DIM="\033[2m"
    RESET="\033[0m"

    # Detect 24-bit truecolor support (macOS Terminal, iTerm2, VSCode, Alacritty, Kitty, Ghostty, etc.)
    HAS_TRUECOLOR=0
    case "${COLORTERM:-}" in
        truecolor|24bit) HAS_TRUECOLOR=1 ;;
    esac
    case "${TERM_PROGRAM:-}" in
        Apple_Terminal|iTerm.app|vscode|Ghostty|WezTerm|Hyper) HAS_TRUECOLOR=1 ;;
    esac
    case "${TERM:-}" in
        xterm-256color|screen-256color|tmux-256color|alacritty|kitty*) HAS_TRUECOLOR=1 ;;
    esac

    if [ "$HAS_TRUECOLOR" -eq 1 ]; then
        C_PURPLE="\033[38;2;192;132;252m" # #c084fc
        C_VIOLET="\033[38;2;168;85;247m"  # #a855f7
        C_INDIGO="\033[38;2;99;102;241m"  # #6366f1
        C_SKY="\033[38;2;14;165;233m"     # #0ea5e9
        C_MINT="\033[38;2;71;215;181m"    # #47d7b5 (brand accent)
        C_GREEN="\033[38;2;16;185;129m"   # #10b981
        C_YELLOW="\033[38;2;245;158;11m"  # #f59e0b
        C_RED="\033[38;2;239;68;68m"      # #ef4444
    else
        # Standard ANSI fallback
        C_PURPLE="\033[1;35m"
        C_VIOLET="\033[35m"
        C_INDIGO="\033[1;34m"
        C_SKY="\033[1;36m"
        C_MINT="\033[36m"
        C_GREEN="\033[32m"
        C_YELLOW="\033[33m"
        C_RED="\033[31m"
    fi
else
    BOLD=""
    DIM=""
    RESET=""
    C_PURPLE=""
    C_VIOLET=""
    C_INDIGO=""
    C_SKY=""
    C_MINT=""
    C_GREEN=""
    C_YELLOW=""
    C_RED=""
fi

info() {
    printf "  ${C_SKY}•${RESET} %s\n" "$1"
}

success() {
    printf "  ${C_GREEN}✓${RESET} %s\n" "$1"
}

warn() {
    printf "  ${C_YELLOW}!${RESET} %s\n" "$1"
}

error() {
    printf "  ${C_RED}✗${RESET} %s\n" "$1" >&2
}

fatal() {
    error "$1"
    exit 1
}

banner() {
    printf "\n"
    printf "   ${C_PURPLE}    ____       _               _       ${RESET}\n"
    printf "   ${C_VIOLET}   / __ \\_____(_)____ ___ ___ (_)____  ${RESET}\n"
    printf "   ${C_INDIGO}  / /_/ / ___/ / ___// __ \`__ \\/ / __ \\ ${RESET}\n"
    printf "   ${C_SKY} / ____/ /  / (__  )/ / / / / / / /_/ /${RESET}\n"
    printf "   ${C_MINT}/_/   /_/  /_/____//_/ /_/ /_/_/\\____/ ${RESET}\n"
    printf "\n"
    printf "   ${C_MINT}◆${RESET} ${BOLD}Fast${RESET}   ${C_SKY}◆${RESET} ${BOLD}Deterministic${RESET}   ${C_VIOLET}◆${RESET} ${BOLD}Memory-Safe${RESET}\n"
    printf "   ${DIM}Official Toolchain Installer ${RESET}• ${C_MINT}https://prismio.org${RESET}\n"
    printf "\n"
}

RELEASES_URL="https://github.com/prismio-lang/prismio/releases"
SHIPPED_PLATFORMS="macos-arm64, linux-x64, linux-arm64, windows-x64 and windows-arm64"

fetch() {
    url="$1"
    dest="$2"
    if [ "$FETCH_CMD" = "curl" ]; then
        curl -fsSL "$url" -o "$dest"
    else
        wget -qO "$dest" "$url"
    fi
}

sha256_of() {
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$1" | awk '{print $1}'
    elif command -v shasum >/dev/null 2>&1; then
        shasum -a 256 "$1" | awk '{print $1}'
    elif command -v openssl >/dev/null 2>&1; then
        openssl dgst -sha256 "$1" | awk '{print $NF}'
    fi
}

# verify_checksum <archive> <file holding "<hash>  <name>">. Stops the install on a
# mismatch, and on there being no way to compute a hash at all.
verify_checksum() {
    expected="$(awk '{print tolower($1)}' "$2" | head -n 1)"
    actual="$(sha256_of "$1" | tr 'A-F' 'a-f')"
    [ -n "$actual" ] || fatal "No sha256sum, shasum or openssl found, so the download cannot be verified."
    if [ "$actual" != "$expected" ]; then
        error "Checksum verification failed; nothing was installed."
        error "  expected: $expected"
        error "  actual:   $actual"
        exit 1
    fi
    success "SHA-256 verified"
}

main() {
    # 1. Dependency checks
    if command -v curl >/dev/null 2>&1; then
        FETCH_CMD="curl"
    elif command -v wget >/dev/null 2>&1; then
        FETCH_CMD="wget"
    else
        fatal "Neither 'curl' nor 'wget' was found on your system. Please install one of them to proceed."
    fi

    command -v tar >/dev/null 2>&1 || fatal "'tar' is required to extract the Prismio archive but was not found."
    command -v gzip >/dev/null 2>&1 || fatal "'gzip' is required to extract the Prismio archive but was not found."

    banner

    # 2. Platform and architecture detection
    OS="$(uname -s)"
    case "$OS" in
        Darwin) OS_NAME="macos" ;;
        Linux)  OS_NAME="linux" ;;
        CYGWIN*|MINGW*|MSYS*|Windows_NT)
            printf "${C_YELLOW}This script installs Prismio on macOS and Linux.${RESET}\n"
            printf "On Windows, download the .zip for your machine from the latest release:\n"
            printf "  ${BOLD}%s/latest${RESET}\n" "$RELEASES_URL"
            printf "unpack it, and put its bin directory on PATH.\n\n"
            exit 1
            ;;
        *) fatal "Unsupported operating system: $OS" ;;
    esac

    ARCH="$(uname -m)"
    case "$ARCH" in
        x86_64|amd64) ARCH_NAME="x64" ;;
        arm64|aarch64) ARCH_NAME="arm64" ;;
        *) fatal "Unsupported architecture: $ARCH" ;;
    esac

    # A shell running under Rosetta reports x86_64 on an Apple-silicon Mac; the native
    # build is the one to install.
    if [ "$OS_NAME" = "macos" ] && [ "$ARCH_NAME" = "x64" ] \
        && [ "$(sysctl -n hw.optional.arm64 2>/dev/null || echo 0)" = "1" ]; then
        ARCH_NAME="arm64"
    fi

    if [ "$OS_NAME" = "macos" ] && [ "$ARCH_NAME" = "x64" ]; then
        fatal "Prismio does not ship for Intel Macs; releases ship ${SHIPPED_PLATFORMS}."
    fi

    # The Linux archive is built against glibc.
    if [ "$OS_NAME" = "linux" ] && (ldd --version 2>&1 || true) | grep -qi musl; then
        fatal "This system uses musl libc (Alpine); the Prismio archive needs glibc."
    fi

    info "Detected platform: ${OS_NAME} (${ARCH_NAME})"

    # Setup temp directory
    TMP_DIR="$(mktemp -d -t prismio-install-XXXXXX 2>/dev/null || mktemp -d 2>/dev/null || fatal "Failed to create temporary directory")"
    trap 'rm -rf "$TMP_DIR"' EXIT INT TERM

    # 3. Version resolution -- only an official download needs one; a local archive or a
    # custom URL names its own.
    RELEASE_TAG=""
    if [ -z "${PRISMIO_TARBALL:-}" ] && [ -z "${PRISMIO_DOWNLOAD_URL:-}" ]; then
        REQ_VERSION="${PRISMIO_VERSION:-latest}"
        TAG=""

        if [ "$REQ_VERSION" != "latest" ]; then
            case "$REQ_VERSION" in
                v*) TAG="$REQ_VERSION" ;;
                *)  TAG="v$REQ_VERSION" ;;
            esac
        else
            info "Querying latest release from GitHub..."
            if [ "$FETCH_CMD" = "curl" ]; then
                API_RESP="$(curl -fsSL -H "Accept: application/vnd.github.v3+json" "https://api.github.com/repos/prismio-lang/prismio/releases/latest" 2>/dev/null || true)"
            else
                API_RESP="$(wget -qO- "https://api.github.com/repos/prismio-lang/prismio/releases/latest" 2>/dev/null || true)"
            fi
            TAG="$(printf '%s' "$API_RESP" | grep '"tag_name":' | head -n 1 | sed -E 's/.*"tag_name": *"([^"]+)".*/\1/' || true)"

            # The API is rate limited; the redirect from /releases/latest is not.
            if [ -z "$TAG" ] && [ "$FETCH_CMD" = "curl" ]; then
                REDIRECT_URL="$(curl -fsSL -o /dev/null -w "%{url_effective}" "${RELEASES_URL}/latest" 2>/dev/null || true)"
                case "$REDIRECT_URL" in
                    */tag/*) TAG="${REDIRECT_URL##*/tag/}" ;;
                esac
            fi

            # Never guess: a pinned fallback would install a stale version, silently, forever.
            if [ -z "$TAG" ]; then
                error "Could not determine the latest release (offline, or GitHub is rate limiting)."
                fatal "Name one instead, e.g.  PRISMIO_VERSION=0.1.0 sh install.sh"
            fi
        fi

        VERSION="${TAG#v}"
        case "$VERSION" in
            ""|*[!0-9A-Za-z._-]*) fatal "Not a version: ${VERSION}" ;;
        esac
        RELEASE_TAG="v$VERSION"
        info "Target release: ${RELEASE_TAG}"
    fi

    # 4. Acquire the archive, and check it
    CHECKSUM_FILE="${TMP_DIR}/archive.sha256"
    if [ -n "${PRISMIO_TARBALL:-}" ]; then
        [ -f "$PRISMIO_TARBALL" ] || fatal "Specified PRISMIO_TARBALL file does not exist: $PRISMIO_TARBALL"
        info "Using local archive: $PRISMIO_TARBALL"
        ARCHIVE="$PRISMIO_TARBALL"
        if [ -f "${PRISMIO_TARBALL}.sha256" ]; then
            verify_checksum "$ARCHIVE" "${PRISMIO_TARBALL}.sha256"
        else
            warn "No ${PRISMIO_TARBALL##*/}.sha256 beside it; the archive is not verified."
        fi
    else
        if [ -n "${PRISMIO_DOWNLOAD_URL:-}" ]; then
            URL="$PRISMIO_DOWNLOAD_URL"
        else
            ASSET="prismio-${VERSION}-${OS_NAME}-${ARCH_NAME}.tar.gz"
            URL="${RELEASES_URL}/download/${RELEASE_TAG}/${ASSET}"
        fi
        ARCHIVE="${TMP_DIR}/prismio.tar.gz"
        info "Downloading ${URL##*/}..."
        if ! fetch "$URL" "$ARCHIVE" 2>/dev/null || [ ! -s "$ARCHIVE" ]; then
            error "Could not download ${URL}"
            if [ -z "${PRISMIO_DOWNLOAD_URL:-}" ]; then
                error "Release ${RELEASE_TAG} may not exist, or may not ship for ${OS_NAME}-${ARCH_NAME}."
                error "Releases ship ${SHIPPED_PLATFORMS}: ${RELEASES_URL}"
            fi
            printf "\n  To install from a local archive:\n"
            printf "    ${BOLD}PRISMIO_TARBALL=/path/to/archive.tar.gz sh install.sh${RESET}\n\n"
            exit 1
        fi

        # The checksum is the integrity story (archives are not signed), so for an official
        # release it is required, not best effort. A custom URL may not publish one.
        if fetch "${URL}.sha256" "$CHECKSUM_FILE" 2>/dev/null && [ -s "$CHECKSUM_FILE" ]; then
            verify_checksum "$ARCHIVE" "$CHECKSUM_FILE"
        elif [ -n "${PRISMIO_DOWNLOAD_URL:-}" ]; then
            warn "No ${URL##*/}.sha256 published beside it; the archive is not verified."
        else
            fatal "Could not download ${URL##*/}.sha256, so the archive cannot be verified; nothing was installed."
        fi
    fi

    # 5. Extract
    EXTRACT_DIR="${TMP_DIR}/extract"
    mkdir -p "$EXTRACT_DIR"
    info "Extracting archive..."
    tar -xzf "$ARCHIVE" -C "$EXTRACT_DIR" || fatal "The archive could not be extracted."

    SOURCE_ROOT=""
    if [ -f "${EXTRACT_DIR}/bin/prismio" ]; then
        SOURCE_ROOT="${EXTRACT_DIR}"
    else
        for entry in "${EXTRACT_DIR}"/*; do
            if [ -d "$entry" ] && [ -f "$entry/bin/prismio" ]; then
                SOURCE_ROOT="$entry"
                break
            fi
        done
    fi
    [ -n "$SOURCE_ROOT" ] || fatal "Corrupted or invalid Prismio archive: missing bin/prismio."
    # A compiler without its runtime bitcode installs and then cannot build a program.
    [ -d "${SOURCE_ROOT}/lib/runtime" ] || fatal "Corrupted or invalid Prismio archive: missing lib/runtime."
    [ -d "${SOURCE_ROOT}/stdlib" ] || fatal "Corrupted or invalid Prismio archive: missing stdlib."

    # 6. Install. The layout is the toolchain's own: the compiler finds its runtime at
    # <exe_dir>/../lib and its standard library at <exe_dir>/../stdlib.
    INSTALL_DIR="${PRISMIO_INSTALL:-$HOME/.prismio}"
    mkdir -p "${INSTALL_DIR}/bin" "${INSTALL_DIR}/lib" "${INSTALL_DIR}/stdlib"

    info "Installing to ${INSTALL_DIR}..."
    # Unlinked first, so replacing a compiler that is running does not fail with
    # "text file busy".
    for f in "${SOURCE_ROOT}/bin"/*; do
        rm -f "${INSTALL_DIR}/bin/$(basename "$f")"
    done
    cp -R "${SOURCE_ROOT}/bin"/* "${INSTALL_DIR}/bin/"
    cp -R "${SOURCE_ROOT}/lib"/* "${INSTALL_DIR}/lib/"
    cp -R "${SOURCE_ROOT}/stdlib"/* "${INSTALL_DIR}/stdlib/"
    for meta in LICENSE CHANGELOG.md POST_INSTALL.txt; do
        if [ -f "${SOURCE_ROOT}/${meta}" ]; then
            cp "${SOURCE_ROOT}/${meta}" "${INSTALL_DIR}/"
        fi
    done
    chmod +x "${INSTALL_DIR}/bin/prismio"

    # 7. Prove it starts. Reporting success for a binary that does not run (the wrong
    # glibc, a missing library) would only move the failure to the user's first command.
    # Run from the temp directory: in a directory with a build.ums, `prismio` forwards to
    # that project's own compiler and would report on that instead of this install.
    VERSION_OUTPUT="$(cd "$TMP_DIR" && "${INSTALL_DIR}/bin/prismio" --version 2>&1 | head -n 1 || true)"
    case "$VERSION_OUTPUT" in
        prismio\ *) ;;
        *)
            error "Installed, but ${INSTALL_DIR}/bin/prismio does not start:"
            error "  ${VERSION_OUTPUT:-no output}"
            exit 1
            ;;
    esac
    success "Installed ${VERSION_OUTPUT}"

    # 8. Shell profile PATH
    PROFILE_UPDATED=""

    update_profile() {
        target_profile="$1"
        line_export="export PRISMIO_INSTALL=\"$INSTALL_DIR\""
        line_path='export PATH="$PRISMIO_INSTALL/bin:$PATH"'

        if [ -f "$target_profile" ] && grep -Fq "PRISMIO_INSTALL" "$target_profile" 2>/dev/null; then
            return 0
        fi

        printf '\n# Prismio toolchain\n%s\n%s\n' "$line_export" "$line_path" >> "$target_profile"
        PROFILE_UPDATED="$target_profile"
    }

    case ":$PATH:" in
        *":${INSTALL_DIR}/bin:"*)
            # Already present on PATH
            ;;
        *)
            if [ "${PRISMIO_NO_MODIFY_PATH:-0}" != "1" ]; then
                CURRENT_SHELL="$(basename "${SHELL:-}")"
                case "$CURRENT_SHELL" in
                    zsh)
                        ZSH_RC="${ZDOTDIR:-$HOME}/.zshrc"
                        touch "$ZSH_RC"
                        update_profile "$ZSH_RC"
                        ;;
                    bash)
                        if [ -f "$HOME/.bashrc" ]; then
                            update_profile "$HOME/.bashrc"
                        fi
                        if [ -f "$HOME/.bash_profile" ]; then
                            update_profile "$HOME/.bash_profile"
                        fi
                        if [ -z "$PROFILE_UPDATED" ]; then
                            update_profile "$HOME/.profile"
                        fi
                        ;;
                    fish)
                        FISH_CONF="${XDG_CONFIG_HOME:-$HOME/.config}/fish/config.fish"
                        mkdir -p "$(dirname "$FISH_CONF")"
                        if [ ! -f "$FISH_CONF" ] || ! grep -Fq "PRISMIO_INSTALL" "$FISH_CONF" 2>/dev/null; then
                            printf '\n# Prismio toolchain\nset -gx PRISMIO_INSTALL "%s"\nfish_add_path "$PRISMIO_INSTALL/bin"\n' "$INSTALL_DIR" >> "$FISH_CONF"
                            PROFILE_UPDATED="$FISH_CONF"
                        fi
                        ;;
                    *)
                        update_profile "$HOME/.profile"
                        ;;
                esac
            fi
            ;;
    esac

    # 9. The C tools. The compiler carries its own LLVM but links programs with the
    # system's linker, so a machine without them installs fine and then fails to link.
    NEED_C_TOOLS=""
    if [ "$OS_NAME" = "macos" ]; then
        xcode-select -p >/dev/null 2>&1 || NEED_C_TOOLS="the Xcode Command Line Tools:  xcode-select --install"
    else
        command -v cc >/dev/null 2>&1 || command -v gcc >/dev/null 2>&1 || command -v clang >/dev/null 2>&1 \
            || NEED_C_TOOLS="a C compiler and the C library headers (build-essential on Debian and Ubuntu)"
    fi

    printf "\n"
    printf "  ${C_GREEN}${BOLD}✓ Prismio installed successfully!${RESET}\n\n"
    printf "    ${BOLD}Version:${RESET}   ${C_MINT}%s${RESET}\n" "$VERSION_OUTPUT"
    printf "    ${BOLD}Location:${RESET}  %s\n\n" "${INSTALL_DIR}"

    if [ -n "$NEED_C_TOOLS" ]; then
        warn "Prismio links programs with your system's C tools, and none were found."
        warn "Install ${NEED_C_TOOLS}"
        printf "\n"
    fi

    if [ -n "$PROFILE_UPDATED" ]; then
        printf "  ${C_SKY}•${RESET} Configured PATH in: ${DIM}%s${RESET}\n\n" "$PROFILE_UPDATED"
        printf "  ${BOLD}Next Steps:${RESET}\n"
        printf "    ${C_MINT}1.${RESET} Reload your shell or run:\n"
        printf "       ${BOLD}export PATH=\"%s/bin:\$PATH\"${RESET}\n\n" "${INSTALL_DIR}"
    elif case ":$PATH:" in *":${INSTALL_DIR}/bin:"*) false;; *) true;; esac; then
        printf "  ${BOLD}Next Steps:${RESET}\n"
        printf "    ${C_MINT}1.${RESET} Add Prismio to your current terminal session:\n"
        printf "       ${BOLD}export PATH=\"%s/bin:\$PATH\"${RESET}\n\n" "${INSTALL_DIR}"
    else
        printf "  ${BOLD}Next Steps:${RESET}\n"
    fi

    printf "    ${C_MINT}2.${RESET} Verify your installation:\n"
    printf "       ${BOLD}prismio --version${RESET}\n\n"
    printf "    ${C_MINT}3.${RESET} Run your first program:\n"
    printf "       ${BOLD}prismio run main.psm${RESET}\n\n"
    printf "  ${DIM}Documentation: ${C_MINT}https://docs.prismio.org${RESET}\n"
    printf "\n"
}

# Everything runs from here, so a download that is cut short never executes half an install.
main "$@"
