## Summary

<!-- What changed and why? -->

## Security checklist

- [ ] No analytics, crash reporting, ads, or background network calls added
- [ ] No logging of PINs, card numbers, vault keys, or backup payloads
- [ ] Crypto, storage, auth, or backup changes include updated tests in `__tests__/`
- [ ] `npm run check` passes locally

## Test plan

- [ ] `npm run check`
- [ ] Manual smoke test on Android and/or iOS (if UI or auth changed)
