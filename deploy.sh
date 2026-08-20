#!/bin/bash
# ==============================================================================
# Dastak Platform — Hostinger Git Auto-Deployment Script (dastak.cc)
# ==============================================================================
set -e

echo "🚀 [1/4] Pulling latest updates from Git repository..."
git pull origin main || git pull origin master

echo "📦 [2/4] Setting up Laravel Backend API (api.dastak.cc)..."
cd backend
composer install --no-dev --optimize-autoloader --no-interaction
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link || true
cd ..

echo "⚡ [3/4] Building all 5 Web Applications into their dist/ folders..."
# Uses the root .env.production environment
npm --prefix landing-page run build
npm --prefix admin-app run build
npm --prefix customer-app run build
npm --prefix partner-app run build
npm --prefix deliveryboy-app run build

echo "🔒 [4/4] Setting proper file & storage permissions..."
chmod -R 755 .
chmod -R 775 backend/storage backend/bootstrap/cache || true

echo "=============================================================================="
echo "✅ Dastak Platform successfully deployed to dastak.cc!"
echo "   • Central API:   https://api.dastak.cc"
echo "   • Admin Portal:  https://admin.dastak.cc"
echo "   • Customer App:  https://user.dastak.cc"
echo "   • Partner App:   https://partner.dastak.cc"
echo "   • Rider App:     https://rider.dastak.cc"
echo "=============================================================================="
