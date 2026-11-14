---
id: anonymous-signin-required
role: anonymous
audience: user
goal: Open a page on a portal that requires sign-in and return to that page after sign-in
duration: 3m
viewport: 1280x800
preconditions:
  - GLOBAL_LOGIN_REQUIRED is True
  - A viewer account exists and you know its user name and password
  - The browser has no signed-in session
related_tests:
  - tests/users/test_users_approval.py::GlobalLoginRequiredTest::test_anonymous_visitor_is_sent_to_login
  - tests/users/test_users_approval.py::GlobalLoginRequiredTest::test_login_and_signup_pages_stay_reachable
  - tests/users/test_users_approval.py::GlobalLoginRequiredTest::test_login_form_sends_user_back_to_the_requested_page
  - tests/users/test_users_approval.py::GlobalLoginRequiredApiTest::test_anonymous_requests_to_the_api_are_refused
---

# Open a page on a portal that requires sign-in and return to that page after sign-in

Related guides: [First sign-in](../getting-started/first-sign-in.md), [Anonymous role](../roles/anonymous.md)

## Before you start

1. Open the portal in a desktop browser at 1280 by 800.
2. Make sure that you are not signed in.

## Steps

1. Open the address of the **Featured** page. Add `/featured` to the portal address.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The sign-in page. The address bar shows the parameter next=/featured. The fields Username and Password are empty.">
  <figcaption>The sign-in page. The address bar shows the parameter next=/featured. The fields Username and Password are empty.</figcaption>
</figure>

2. Enter your user name.
3. Enter your password.
4. Select **Sign in**.

<figure class="screenshot-placeholder">
  <img src="../assets/screenshot-placeholder.svg" alt="The Featured page after sign-in. The header shows the name of the signed-in user. The list shows featured media.">
  <figcaption>The Featured page after sign-in. The header shows the name of the signed-in user. The list shows featured media.</figcaption>
</figure>

## Expected result

The portal opens the **Featured** page, not the home page. The header shows your account.

The sign-in page and the sign-up page stay open without an account. The portal sends every other page request to the sign-in page.

## If this fails

- If the portal shows the page without a sign-in, `GLOBAL_LOGIN_REQUIRED` is `False`. See [Anonymous browse](anonymous-browse.md).
- If the portal shows the page **Account Pending Approval** after sign-in, an approver must approve your account. See [Pending browse](pending-browse.md).
- If the portal refuses your password, ask a manager to reset it.
- A program that calls the API without a token also receives an authentication error. Use the login API to get a token.
