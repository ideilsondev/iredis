#!/bin/bash

# Script de Build Automático para iRedis (Tauri)
# Permite escolher entre Linux (.deb), Windows (x64) ou Ambos.

set -e

echo "=========================================="
echo "      iRedis - Ferramenta de Build        "
echo "=========================================="
echo "Selecione o alvo de compilação:"
echo "1) Linux (.deb)"
echo "2) Windows 64-bit (.exe / .msi) via Cross-Compilation"
echo "3) Ambos"
echo "4) Sair"
echo "=========================================="
read -p "Opção (1-4): " OPTION

build_linux() {
    echo ""
    echo "[*] Iniciando Build para Linux (.deb)..."
    npm run tauri build -- --bundles deb
    echo "[+] Build de Linux finalizado! Verifique a pasta src-tauri/target/release/bundle/deb/"
}

build_windows() {
    echo ""
    echo "[*] Iniciando Build para Windows 64-bit..."
    echo "[!] Nota: O Cross-compiling de Linux para Windows exige o mingw-w64 e o target adicionado no rustup."
    echo "    Exemplo: rustup target add x86_64-pc-windows-gnu"
    echo ""
    npm run tauri build -- --target x86_64-pc-windows-gnu
    echo "[+] Build de Windows finalizado! Verifique a pasta src-tauri/target/x86_64-pc-windows-gnu/release/bundle/"
}

case $OPTION in
    1)
        build_linux
        ;;
    2)
        build_windows
        ;;
    3)
        build_linux
        build_windows
        ;;
    4)
        echo "Saindo..."
        exit 0
        ;;
    *)
        echo "Opção inválida!"
        exit 1
        ;;
esac

echo ""
echo "==== Processo de Build Concluído! ===="
