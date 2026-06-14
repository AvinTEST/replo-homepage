# Login Modal Design QA

- Source visual truth: `/var/folders/wz/wg5bx3yx6nx1jpv239qd2_300000gn/T/codex-clipboard-b4e3932e-0c0a-4a9b-9429-34d0cb68a410.png`
- Implementation screenshot: `/private/tmp/replo-login-modal-mobile.png`
- Comparison image: `/private/tmp/replo-login-modal-comparison.png`
- Viewport: `390x844`
- State: public homepage with the login modal open

## Full-View Comparison Evidence

The implementation follows the reference's centered authentication composition, generous white space, strong heading hierarchy, lightly bordered social login button, and restrained supporting text. The homepage remains visible behind a neutral overlay because this implementation is intentionally a modal rather than a standalone login page.

## Focused Region Comparison Evidence

The authentication panel was reviewed at its rendered mobile size. The Replo wordmark replaces the GitHub mark, and only the supported Google provider is shown. Email/password, Apple, account creation, and passkey controls were intentionally omitted because they are not supported product actions.

## Required Fidelity Surfaces

- Fonts and typography: Existing Pretendard/system stack retained; heading, description, button, and note weights preserve the reference hierarchy.
- Spacing and layout rhythm: Centered single-column panel, wide internal spacing, compact action area, and mobile edge margins match the simple reference direction.
- Colors and visual tokens: White surface, dark text, gray border, neutral overlay, and Replo purple interaction states follow the project design guide.
- Image quality and asset fidelity: Existing Replo wordmark and Google provider icon are reused without placeholder assets.
- Copy and content: Korean copy is concise and limited to login purpose, provider action, and first-login onboarding notice.

## Findings

No actionable P0, P1, or P2 differences remain. Product-specific deviations from the reference are intentional.

## Patches Made

- Removed the previous marketing-style modal heading and long description.
- Centered the Replo brand and reduced the panel to one supported login action.
- Simplified border, radius, shadow, close control, copy, and mobile spacing.
- Verified desktop and mobile centering, scroll lock, horizontal overflow, and close behavior.

## Follow-up Polish

No blocking polish items.

final result: passed
