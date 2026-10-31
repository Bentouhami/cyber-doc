# RC Smoke Results

- Generated at: 2026-03-19T02:18:43.120Z
- Base URL: http://127.0.0.1:3100
- Pass: 6
- Fail: 8

- FAIL - Admin login + redirect (Redirected to /)
- PASS - Admin templates list renders (/admin/templates loaded (HTTP 200))
- PASS - Admin template create page renders (/admin/templates/new loaded (HTTP 200))
- PASS - Admin template import page renders (/admin/templates/import loaded (HTTP 200))
- PASS - Admin employees page renders (/admin/employees loaded (HTTP 200))
- FAIL - Admin template detail page renders (No template links found)
- FAIL - API /api/users/me (authenticated) (HTTP 401)
- FAIL - API /api/templates (authenticated) (HTTP 401)
- FAIL - Logout control visible (Logout button not found)
- FAIL - Employee login + redirect (Redirected to /)
- PASS - Documents list renders (/documents loaded (HTTP 200))
- PASS - Document create page renders (/documents/create loaded (HTTP 200))
- FAIL - API /api/documents (authenticated) (HTTP 401)
- FAIL - Logout control visible (Logout button not found)
