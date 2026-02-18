#!/bin/bash

# ============================================================
# Database Check: Verify BusinessSites Setup
# ============================================================
# This script helps you quickly check if BusinessSites are
# properly set up for customer registration
#
# USAGE:
#   ./check-business-sites.sh [database-url]
#
# Example:
#   ./check-business-sites.sh "postgresql://user:pass@localhost:5432/dbname"
#
# Or if DATABASE_URL is in your .env:
#   ./check-business-sites.sh
# ============================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "============================================================"
echo "🔍 BusinessSites Setup Checker"
echo "============================================================"
echo ""

# Get database URL
if [ -n "$1" ]; then
    DB_URL="$1"
elif [ -f .env ]; then
    DB_URL=$(grep DATABASE_URL .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
else
    echo -e "${RED}❌ No database URL provided and no .env file found${NC}"
    echo "Usage: $0 [database-url]"
    exit 1
fi

if [ -z "$DB_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL is empty${NC}"
    exit 1
fi

echo -e "${BLUE}📊 Checking database...${NC}"
echo ""

# Function to run SQL query
run_query() {
    psql "$DB_URL" -t -A -c "$1" 2>/dev/null
}

# Check 1: Count businesses
echo -e "${YELLOW}1. Checking Businesses...${NC}"
BUSINESS_COUNT=$(run_query "SELECT COUNT(*) FROM businesses WHERE deleted_at IS NULL;")
if [ $? -eq 0 ]; then
    echo -e "   ${GREEN}✓${NC} Found $BUSINESS_COUNT business(es)"
else
    echo -e "   ${RED}✗${NC} Could not connect to database"
    exit 1
fi

# Check 2: Count business sites
echo -e "${YELLOW}2. Checking Business Sites...${NC}"
SITE_COUNT=$(run_query "SELECT COUNT(*) FROM business_sites WHERE deleted_at IS NULL;")
echo -e "   ${GREEN}✓${NC} Found $SITE_COUNT business site(s)"

# Check 3: Find businesses without sites
echo -e "${YELLOW}3. Checking for businesses without sites...${NC}"
NO_SITE_COUNT=$(run_query "SELECT COUNT(*) FROM businesses b WHERE b.deleted_at IS NULL AND NOT EXISTS (SELECT 1 FROM business_sites bs WHERE bs.business_id = b.id AND bs.deleted_at IS NULL);")

if [ "$NO_SITE_COUNT" -gt 0 ]; then
    echo -e "   ${RED}⚠${NC}  Found $NO_SITE_COUNT business(es) without sites"
    echo ""
    echo -e "${YELLOW}   Businesses missing sites:${NC}"
    run_query "SELECT '   - ' || name || ' (slug: ' || slug || ')' FROM businesses b WHERE b.deleted_at IS NULL AND NOT EXISTS (SELECT 1 FROM business_sites bs WHERE bs.business_id = b.id AND bs.deleted_at IS NULL);"
else
    echo -e "   ${GREEN}✓${NC} All businesses have sites"
fi

# Check 4: Check for specific slug
echo ""
echo -e "${YELLOW}4. Checking for 'bapi-test' slug...${NC}"
BAPI_TEST_EXISTS=$(run_query "SELECT COUNT(*) FROM business_sites WHERE slug = 'bapi-test' AND deleted_at IS NULL;")

if [ "$BAPI_TEST_EXISTS" -gt 0 ]; then
    echo -e "   ${GREEN}✓${NC} BusinessSite with slug 'bapi-test' exists"
    run_query "SELECT '   ID: ' || id || E'\n   Name: ' || name FROM business_sites WHERE slug = 'bapi-test' AND deleted_at IS NULL;"
else
    echo -e "   ${RED}✗${NC} BusinessSite with slug 'bapi-test' NOT found"
fi

# Check 5: List all available slugs
echo ""
echo -e "${YELLOW}5. Available business site slugs:${NC}"
SLUGS=$(run_query "SELECT '   - ' || slug || ' (' || name || ')' FROM business_sites WHERE deleted_at IS NULL ORDER BY created_at DESC;")

if [ -n "$SLUGS" ]; then
    echo "$SLUGS"
else
    echo -e "   ${RED}(none)${NC}"
fi

# Check 6: Check customer registrations
echo ""
echo -e "${YELLOW}6. Customer registrations:${NC}"
CUSTOMER_COUNT=$(run_query "SELECT COUNT(*) FROM customer_business_sites;")
echo -e "   ${GREEN}✓${NC} Found $CUSTOMER_COUNT customer(s) registered to business sites"

# Summary
echo ""
echo "============================================================"
echo "📋 Summary"
echo "============================================================"
echo -e "Businesses:        ${GREEN}$BUSINESS_COUNT${NC}"
echo -e "Business Sites:    ${GREEN}$SITE_COUNT${NC}"
echo -e "Without Sites:     $([ "$NO_SITE_COUNT" -gt 0 ] && echo -e "${RED}$NO_SITE_COUNT${NC}" || echo -e "${GREEN}$NO_SITE_COUNT${NC}")"
echo -e "Customers:         ${GREEN}$CUSTOMER_COUNT${NC}"
echo ""

# Recommendations
if [ "$NO_SITE_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠ RECOMMENDED ACTIONS:${NC}"
    echo ""
    echo "You have businesses without BusinessSites. To fix this:"
    echo ""
    echo "Option 1 - Migrate all:"
    echo "  psql \"$DB_URL\" -f migrate-add-business-sites.sql"
    echo ""
    echo "Option 2 - Create manually:"
    echo "  See create-business-site.sql for step-by-step instructions"
    echo ""
elif [ "$BAPI_TEST_EXISTS" -eq 0 ] && [ "$SITE_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}ℹ INFO:${NC}"
    echo ""
    echo "All businesses have sites, but 'bapi-test' slug not found."
    echo "Available slugs are listed above."
    echo ""
else
    echo -e "${GREEN}✅ Everything looks good!${NC}"
    echo ""
    echo "You can now register customers using any of the slugs listed above."
    echo ""
fi

echo "============================================================"
echo ""
echo "For detailed help, see: CUSTOMER_REGISTRATION_DEBUG_GUIDE.md"
echo ""
