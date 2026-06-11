#!/bin/bash

# Abilita l'uscita in caso di errore
set -e

echo "=== Verifica delle dipendenze ==="

# 1. Dipendenze root (necessarie per 'concurrently')
if [ ! -d "node_modules" ]; then
    echo "Installazione delle dipendenze root..."
    npm install
fi

# 2. Dipendenze client
if [ ! -d "client/node_modules" ]; then
    echo "Installazione delle dipendenze client..."
    npm install --prefix client
fi

# 3. Dipendenze server
if [ ! -d "server/node_modules" ]; then
    echo "Installazione delle dipendenze server..."
    npm install --prefix server
fi

echo "=== Avvio di Client e Server in corso ==="
npm run dev
