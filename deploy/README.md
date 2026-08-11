# Yousra ERP — Environment Setup

## Prerequisites
- Ubuntu (or WSL2, staying inside the Linux filesystem — avoid /mnt/c/...)
- Python 3.11+, Node.js 18 (via nvm), MariaDB, Redis, Yarn, `uv`
- Frappe Bench CLI installed (`pip install frappe-bench`)

## Quick start


## Manual steps after first install
- Set brand colors via Theme doctype (see main README)
- Configure Navbar Settings for logo/title
- Import fixtures if not already applied: `bench --site yousra.local migrate`

## App versions in use
See `apps.json` for exact branches — update both files together if you bump a version.
EOF