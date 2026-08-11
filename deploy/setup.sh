#!/bin/bash
# Yousra ERP — fresh environment setup
# Usage: bash setup.sh
set -e

BENCH_NAME="yousra-erp"
SITE_NAME="yousra.local"

bench init "$BENCH_NAME" --frappe-branch version-16
cd "$BENCH_NAME"

bench get-app erpnext --branch version-16
bench get-app hrms --branch version-16
bench get-app crm --branch main
bench get-app raven --branch main
bench get-app https://github.com/Yousra-team/Yousra-ERP.git --branch main

bench new-site "$SITE_NAME"
bench --site "$SITE_NAME" install-app erpnext hrms crm raven yousra_erp

echo "Done. Run 'bench start' to launch, then visit http://$SITE_NAME:8000"
